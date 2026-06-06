---
name: convert-checkout-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author checkout-page micro-copy + trust signals: order summary, form-field copy, bump slot, button label, guarantee restatement, and friction-reduction patterns. Emits brief + paste-ready HTML/CSS scaffold (payment-processor-agnostic).
  Use when the user needs a conversion-optimized checkout page where every word and visual signal earns its place.
  Not for the bump component itself (see /convert bump) or post-purchase OTOs (see /convert oto-page).
triggers:
  - checkout page
  - order page
  - order form copy
  - checkout copy
  - convert checkout
  - cart page
  - buy form
negative_triggers:
  - bump component
  - oto page
  - sales page
  - audit my checkout
tags: [conversion, copy, page, donahoe-method, html, accessibility]
priority: 85
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-bump, convert-oto-page, convert-four-questions, convert-open, convert-three-locks, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references checkout-conversion canon, trust-signal placement literature, Cialdini commitment-and-consistency at the moment of purchase"
---

# Convert Checkout Page - Checkout Micro-Copy + Trust Signals

> *"By the time they hit checkout, the heavy persuasion is done. The job here is friction reduction. Every doubt that creeps in between the buy button and the confirm button is a sale you already won and lost again. Micro-copy is the lever."*

This skill builds the checkout-page surface: order summary, form-field copy, optional bump slot, button label, guarantee restatement, and the trust signals that close the gap between intent and confirm.

## When to Use

Trigger phrases: `checkout page`, `order page`, `order form copy`, `checkout copy`, `cart page`, `/convert checkout <product>`.

Use when:
- The user has a sales page (or VSL page) that needs a checkout surface to land on.
- The checkout will be assembled from a payment processor (Stripe Checkout, ThriveCart, SamCart, custom). This skill emits the *page chrome* and copy - the form fields themselves usually come from the processor.
- The user wants to reduce checkout abandonment.

## When NOT to Use

- **The bump component itself** → `/convert bump` (this skill includes a slot for it).
- **Post-purchase OTO** → `/convert oto-page`.
- **Pre-purchase sales page** → `/convert sales-page`.
- **Auditing existing checkout** → `/convert audit`.

## Inputs

Required:
1. **Product + price + components** - what's being bought.
2. **Payment processor** - Stripe Checkout / ThriveCart / SamCart / custom. Determines what form fields you control vs. inherit.
3. **Guarantee terms** - exact text.
4. **One person + the brand voice from the upstream sales page** (voice continuity matters here).
5. **Bump (optional)** - if a `/convert bump` exists, this page reserves a slot for it.

Optional:
- **Brand colors / logo.**
- **Trust badges / payment-method icons / SSL signal copy.**
- **Existing testimonial for sidebar reassurance block.**
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases (radically compressed; checkout is execution, not persuasion)

The checkout page is **post-decision** copy. The Method still applies, but every phase compresses to a sentence or a label.

### Phase 0 - Four Questions (call `convert-four-questions`)

The buyer's *current* questions at the moment they hit checkout:
- **Why You?** - Already answered upstream.
- **Why Me?** - Already answered.
- **Why This?** - Already answered.
- **Why Now?** - *"Should I really do this right now?"* This is the only Question still alive at checkout, and it's the one micro-copy must address.

### Phase 1 - Temperature

Boiling. Don't pitch. Confirm.

### Phase 2 - Four-Layer Open (call `convert-open`)

A page-top reassurance line collapses Layers 1–3 into one sentence:

*"You're seconds away from [the desired state]. Fill in the details below - I'll have your access ready before you finish your coffee."*

Layer 4 (Fingerprint) lives in the voice consistency between this page and the sales page.

### Phase 3 - Three Locks

- **Want** = the state, restated in one line at top.
- **Trust** = guarantee block + payment badges + (optional) one inline testimonial.
- **Excuse** = the guarantee. Restated *next to* the buy button - not at the bottom of the page where the eye doesn't reach.

### Phase 4 - Bullets

3 bullets max in the order summary - what's included. Mostly Snapshot ("Module 1: ...", "Bonus: ...") for clarity, not curiosity.

### Phase 5 - Proof

A single inline testimonial in a sidebar or below the form. Optional but high-leverage. One Anecdote / Receipt is enough; more distracts from form completion.

### Phase 6 - Cascade Close

The buy button is the Door. Label it with Vision:

- ✗ "Submit" / "Pay now" / "Continue"
- ✓ "Get instant access" / "Lock in my spot" / "Start the program"

### Phase 7 - Greased Chute

Eye flow: order summary → form fields → bump (optional) → guarantee + trust badges → buy button. No detours, no popups, no "are you sure?" interrupts.

### Phase 8 - Voice + Bullshit Filter

The biggest filter test: *"Does the voice on this page match the voice on the sales page?"* Voice mismatch between sales page and checkout is one of the largest sources of cart abandonment - buyers feel like they're suddenly on a different site.

## Section Architecture

| # | Section | Purpose |
|---|---------|---------|
| 1 | Top reassurance line | Open compressed |
| 2 | Order summary block (with edit option) | Want lock |
| 3 | Form fields (name, email, payment) | Friction layer |
| 4 | Bump slot (optional) | Bump from /convert bump |
| 5 | Guarantee restatement | Excuse lock |
| 6 | Buy button (Vision-labeled) | Door |
| 7 | Trust signals (badges, SSL, payment methods) | Trust lock |
| 8 | Inline testimonial (sidebar or below button) | Trust reinforcement |
| 9 | Footer: contact link + refund link + privacy | Friction reduction |

## HTML/CSS Reference Implementation

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Checkout - {{PRODUCT_NAME}}</title>
  <meta name="description" content="{{META_DESCRIPTION}}">
  <meta property="og:title" content="Checkout - {{PRODUCT_NAME}}">
  <meta property="og:type" content="website">
  <style>
    :root{--ink:#0e1116;--ink-soft:#3a3f47;--paper:#fbfaf6;--accent:#c0392b;--accent-ink:#fff;--rule:#e6e2d8;--max:920px}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font:17px/1.55 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--paper)}
    main{max-width:var(--max);margin:0 auto;padding:24px 20px 64px;display:grid;grid-template-columns:1fr;gap:24px}
    @media(min-width:820px){main{grid-template-columns:1.2fr 1fr}}
    h1{font-size:clamp(22px,3.8vw,28px);line-height:1.2;margin:0 0 14px}
    h2{font-size:18px;margin:24px 0 10px}
    p{margin:0 0 14px}
    .reassure{background:#fff;border:1px solid var(--rule);padding:14px 16px;border-radius:8px;font-size:15px;color:var(--ink-soft)}
    .summary{background:#fff;border:1px solid var(--rule);padding:18px;border-radius:8px}
    .summary ul{list-style:none;padding:0;margin:0 0 14px}
    .summary li{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--rule);font-size:15px}
    .summary li:last-child{border:0;font-weight:700;font-size:17px;padding-top:10px}
    .form-card{background:#fff;border:1px solid var(--rule);padding:18px;border-radius:8px}
    label{display:block;font-size:14px;font-weight:600;margin:10px 0 4px;color:var(--ink)}
    input[type=text],input[type=email],input[type=tel]{width:100%;padding:12px 14px;font-size:16px;border:1px solid var(--rule);border-radius:6px;background:#fff;color:var(--ink)}
    input:focus-visible{outline:3px solid var(--accent);outline-offset:1px}
    .guarantee{margin-top:16px;padding:14px 16px;background:#fff8d8;border:1px dashed #e2c34a;border-radius:8px;font-size:14px;color:#1a1408}
    button.cta{width:100%;padding:18px 20px;background:var(--accent);color:var(--accent-ink);border:0;border-radius:6px;font-size:18px;font-weight:700;cursor:pointer;margin-top:14px}
    button.cta:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
    .badges{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px;font-size:13px;color:var(--ink-soft)}
    .badges span{padding:4px 8px;border:1px solid var(--rule);border-radius:4px;background:#fff}
    .testimonial{margin-top:18px;padding:14px 16px;background:#fff;border-left:4px solid var(--accent);font-size:15px}
    .testimonial figcaption{font-size:13px;color:var(--ink-soft);margin-top:6px}
    footer{grid-column:1/-1;margin-top:24px;font-size:13px;color:var(--ink-soft);text-align:center;border-top:1px solid var(--rule);padding-top:14px}
    footer a{color:var(--ink-soft);margin:0 8px}
    @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
<main>
  <!-- Left column: reassurance + form -->
  <section>
    <p class="reassure">{{TOP_REASSURANCE_LINE_VISION_FRAMED}}</p>

    <h1>{{CHECKOUT_HEADLINE}}</h1>

    <div class="form-card">
      <form action="{{PAYMENT_PROCESSOR_ENDPOINT}}" method="post" novalidate>
        <h2>Your details</h2>

        <label for="name">Full name</label>
        <input id="name" type="text" name="name" autocomplete="name" required aria-required="true">

        <label for="email">Email <span style="font-weight:400;color:var(--ink-soft)">(where we'll send your access)</span></label>
        <input id="email" type="email" name="email" autocomplete="email" required aria-required="true">

        <h2>Payment</h2>
        <!-- Replace with payment processor's element (Stripe Element, ThriveCart embed, etc.). -->
        <div id="payment-element" aria-label="Payment details">{{PAYMENT_PROCESSOR_ELEMENT}}</div>

        <!-- Optional bump slot. Drop in component from /convert bump here. -->
        {{BUMP_SLOT_OR_EMPTY}}

        <div class="guarantee">{{GUARANTEE_RESTATEMENT_NEXT_TO_BUTTON}}</div>

        <button class="cta" type="submit" aria-label="{{CTA_ARIA}}">{{CTA_VISION_LABEL}}</button>

        <div class="badges" aria-label="Trust signals">
          <span>SSL secured</span>
          <span>Visa</span>
          <span>Mastercard</span>
          <span>Amex</span>
          <span>{{REGION_PAYMENT_METHOD}}</span>
        </div>
      </form>
    </div>
  </section>

  <!-- Right column: order summary + testimonial -->
  <aside>
    <div class="summary" aria-label="Order summary">
      <h2 style="margin-top:0">Order summary</h2>
      <ul>
        <li><span>{{COMPONENT_1}}</span><span>{{C1_PRICE}}</span></li>
        <li><span>{{COMPONENT_2}}</span><span>{{C2_PRICE}}</span></li>
        <li><span>{{COMPONENT_3}}</span><span>{{C3_PRICE}}</span></li>
        <li><span>Total today</span><span>{{TOTAL}}</span></li>
      </ul>
      <p style="font-size:13px;color:var(--ink-soft);margin:0">{{BILLING_NOTE_E_G_BILLED_ONCE_NO_RECURRING}}</p>
    </div>

    <figure class="testimonial">
      <blockquote>{{ONE_INLINE_TESTIMONIAL_ANECDOTE_OR_RECEIPT}}</blockquote>
      <figcaption>{{NAMECHECK}}</figcaption>
    </figure>
  </aside>

  <footer>
    <a href="{{CONTACT_URL}}">Contact</a> ·
    <a href="{{REFUND_URL}}">Refund policy</a> ·
    <a href="{{PRIVACY_URL}}">Privacy</a>
  </footer>
</main>
</body>
</html>
```

CSS notes:
- Two-column layout on desktop (form left, summary right) with single-column collapse on mobile. Order summary above form on mobile because thumb-zone first impression matters.
- The guarantee box uses the same yellow/dashed pattern as the bump and webinar attendance bonus - consistent visual language for "this is *additional* and *easy*."
- Trust badges in plain text/border boxes. Avoid logos that look like clipart; trust badges that look fake hurt more than they help.
- The button is full-width at the bottom of the form so the eye lands there after every field. Single primary action.
- Email field has a tiny clarification ("where we'll send your access") - micro-copy that prevents typos and reduces "did it work?" support tickets.

## Output Template

```markdown
# Checkout Page - {{PRODUCT}}

**Product:** {{PRODUCT}} - {{PRICE}}
**Components:** {{LIST}}
**Guarantee:** {{TERMS}}
**Bump slot:** {{IF_PRESENT_OR_NONE}}
**Payment processor:** {{NAME}}

## Phase 0–8 (compressed)
- Four Questions: only "Why Now" is live; addressed by reassurance line + guarantee placement
- Open: 1-line top reassurance
- Locks: Want (restated up top) / Trust (guarantee + badges + testimonial) / Excuse (guarantee next to button)
- Bullets: 3 in order summary
- Cascade Close: button label is Door (Vision-framed)
- Voice Rules applied (matches upstream sales page); Bullshit Filter is a separate downstream pass

## Final copy
- Top reassurance line: "{{LINE}}"
- Checkout headline: "{{H1}}"
- Field micro-copy: name = "{{LABEL}}", email = "{{LABEL}} ({{HINT}})"
- Guarantee restatement: "{{LINE}}"
- Buy button label: "{{CTA}}"
- Order summary lines: {{LIST}}
- Billing note: "{{LINE}}"
- Inline testimonial: "{{P}}" - {{NAMECHECK}}
- Trust badges: {{LIST}}
- Footer links: contact / refund / privacy

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Method coverage report:
  Open:           not applicable - checkout is post-decision; no Layer-1 Nerve Strike needed. 1-line top reassurance carries voice continuity (Layer 4 only)
  Three Locks:    maintained - Want restated up top; Trust signals (guarantee + badges + testimonial) reinforce Trust lock; price stack and guarantee-next-to-button reinforce Excuse
  Proof:          partial - 1 inline testimonial + trust badges; full proof block lives upstream on the sales page
  Bullets:        not applicable - order-summary line items only; the bullet block as a system not used at this surface
  Cascade Close:  compressed - Door = the purchase button (Vision-labeled); Stack via order summary; Safety Net via guarantee microcopy; Math omitted (price already decided upstream); P.S./P.P.S. omitted
  Greased Chute:  full - summary → form → bump → guarantee → button → badges; thumb-zone optimized on mobile
  Voice Rules:    full - voice matches upstream sales page; no marketing-speak on every label, button, error message
  Temperature:    Boiling (post-decision, mid-purchase)

Friction: no popups, no interrupts, no "are you sure?" - every interrupt costs conversions

Required next step: Run /convert bullshit-filter on this draft before shipping - checkout microcopy fails are the most expensive voice fails in the funnel.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- The checkout page's voice MUST match the upstream sales page's voice. If a buyer feels they're suddenly on a different site, abandonment spikes. Use the same headline patterns, the same trust language, the same color accents.
- For the bump slot, drop in the component from `/convert bump`. Don't generate two competing bumps on the same page.
- The post-checkout flow should land on `/convert oto-page` (immediate upgrade), then optionally `/convert downsell-page`, then `/convert thank-you-page`.
- If a payment processor (Stripe Checkout, Paddle) hosts its own form, this skill emits the *pre-checkout* page chrome with the buy button that redirects there - same Method, slightly different surface.
- Mobile checkout is where most carts die. Test on a real phone, not the desktop emulator. Thumb-zone the button.

## Lineage

- Checkout-conversion / cart-abandonment canon - direct-response info-marketing playbook.
- Trust-signal placement - UX research literature on perceived security cues.
- Commitment-and-consistency at the moment of purchase - Cialdini (Influence, 1984).
- The Method itself - Wayland-owned operating system.
