---
name: convert-bump
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author order-form bump offers: 30-80 word checkbox micro-copy that lifts AOV without breaking checkout flow. Emits brief + paste-ready HTML/CSS for the bump checkbox component.
  Use when the user has a checkout page and wants to add a single relevant low-friction bump above the buy button.
  Not for full upsell pages (see /convert oto-page) or post-purchase add-ons (see /convert cross-sell-page).
triggers:
  - order bump
  - bump offer
  - checkout bump
  - bump copy
  - convert bump
  - checkbox upsell
  - order-form bump
negative_triggers:
  - oto page
  - cross-sell page
  - sales page
  - audit my bump
tags: [conversion, copy, bump, donahoe-method, html, page]
priority: 80
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-checkout-page, convert-oto-page, convert-bullets, convert-proof, convert-voice, convert-bullshit-filter, convert-four-questions]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references direct-response order-form bump canon, Cialdini commitment-and-consistency, behavioral-economics 'completion bias' framing"
---

# Convert Bump - Order-Form Bump Offer

> *"The bump is the smallest piece of copy in the funnel and the highest dollars-per-word. Eighty words and a checkbox. If you get it right, AOV jumps 12-30% across the whole funnel."*

This skill builds the bump: a single relevant low-friction add-on, presented as a checkbox above the order button, with Method-compressed micro-copy.

## When to Use

Trigger phrases: `order bump`, `bump offer`, `checkout bump`, `bump copy`, `/convert bump <product>`.

Use when the user has a checkout page and wants to add a single low-friction add-on (template pack, course module, license tier, faster-shipping option, swipe file, etc.) - small enough that the buyer adds it without thinking twice.

## When NOT to Use

- **Full upsell with its own page** → `/convert oto-page`.
- **Post-purchase cross-sell** → `/convert cross-sell-page`.
- **Pre-purchase main sales page** → `/convert sales-page`.
- **Auditing existing bump** → `/convert audit`.

## Inputs

Required:
1. **The flagship product** - what's already in the cart.
2. **The bump product** - what's being added. Must be:
   - Genuinely relevant to the flagship (no random "buy a t-shirt with your course" bumps).
   - Priced 5-30% of the flagship.
   - Deliverable instantly (no shipping logistics that complicate checkout).
3. **The flagship's voice + One Person** - bump must match the voice of the page it sits on.
4. **Real bump-only price reasoning** - the bump price is genuinely lower than buying the same thing later.

Optional:
- **Brand colors / logo.**
- **One specific Receipt or Snapshot proof beat** - optional but valuable.
- **`out_path`** - defaults via `build_report_path`.

## Workflow - All Eight Method Phases (radically compressed)

A bump is 30–80 words. Every Method framework collapses to one or two sentences.

### Phase 0 - Four Questions (call `convert-four-questions`)

The bump answers all four in a single short paragraph:
- **Why You** = the bump fills a gap the flagship leaves.
- **Why Me** = inherited.
- **Why This** = "the [bump product] does [specific job] that [flagship] doesn't cover."
- **Why Now** = bump-only pricing valid only at this checkout.

### Phase 1 - Temperature

Boiling. The buyer is on the order form. Don't pitch - *suggest*.

### Phase 2 - Four-Layer Open (call `convert-open`)

Compressed to 1 sentence: a Nerve Strike that anticipates the next question they're about to ask. *"Most people who get [flagship] hit the same wall by week two - no [thing the bump solves]."*

### Phase 3 - Three Locks

- **Want** = the wall the bump removes.
- **Trust** = "I built this in" - Skin in the Game, one phrase.
- **Excuse** = "$X added to your order - vs. $Y if you grab it later."

### Phase 4 - Bullets

If the bump uses bullets at all, 2 max. Snapshot or Keyhole only. Most bumps are better as a single sentence + checkbox label, no bullets.

### Phase 5 - Proof

One Receipt or one Drive-By. Optional. The bump is short enough that the proof is sometimes the price comparison itself.

### Phase 6 - Cascade Close

The checkbox **is** the close. The label is the Door. *"Yes! Add the [bump] to my order for an extra $X."*

### Phase 7 - Greased Chute

The eye must move from the flagship summary line → bump headline → checkbox → buy button without backtracking. Visual hierarchy is everything.

### Phase 8 - Voice + Bullshit Filter

A bump that sounds salesy at this stage triggers cart abandonment. Read aloud - would you say this casually? If no, rewrite.

## The Bump Anatomy (30–80 words)

| Element | Words | Job |
|---------|-------|-----|
| Yellow/highlighted box | - | Break visual rhythm of the order form |
| 1-line headline (bold) | ~8 | The Nerve Strike compressed |
| 1–2 sentence body | ~30–50 | Side Door + Skin + Excuse compressed |
| Bullet (optional, 2 max) | ~10–20 | Snapshot bullet if needed |
| Checkbox label | ~10–20 | The Door |
| Price line | ~5 | The Math |

Total: 30–80 words. Period.

## HTML/CSS Reference Implementation

```html
<!-- Drop-in bump component for order-form pages. -->
<style>
  .bump{
    --bump-bg:#fff8d8;
    --bump-border:#e2c34a;
    --bump-ink:#1a1408;
    --bump-accent:#c0392b;
    background:var(--bump-bg);
    border:2px dashed var(--bump-border);
    color:var(--bump-ink);
    padding:18px 18px 14px;
    border-radius:8px;
    margin:18px 0;
    font:16px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;
  }
  .bump h3{margin:0 0 8px;font-size:18px}
  .bump p{margin:0 0 10px}
  .bump ul{margin:0 0 10px 18px;padding:0}
  .bump label{display:flex;gap:10px;align-items:flex-start;cursor:pointer;font-weight:600;border-top:1px dashed var(--bump-border);padding-top:10px}
  .bump label input[type=checkbox]{margin-top:4px;width:18px;height:18px;accent-color:var(--bump-accent)}
  .bump label input[type=checkbox]:focus-visible{outline:3px solid var(--bump-accent);outline-offset:2px}
  .bump .price{font-weight:700}
  @media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
</style>

<aside class="bump" aria-label="Optional add-on">
  <h3>{{NERVE_STRIKE_HEADLINE_8_WORDS}}</h3>
  <p>{{COMPRESSED_BODY_30_TO_50_WORDS}}</p>
  <!-- Optional bullet block (2 max). Delete if bump body is enough. -->
  <ul>
    <li>{{SNAPSHOT_BULLET_OPTIONAL}}</li>
  </ul>
  <label>
    <input type="checkbox" name="bump_{{BUMP_SLUG}}" value="1" aria-describedby="bump-price-{{BUMP_SLUG}}">
    <span>
      {{CHECKBOX_LABEL_DOOR_VISION}}
      <span id="bump-price-{{BUMP_SLUG}}" class="price">- add ${{BUMP_PRICE}}</span>
    </span>
  </label>
</aside>
```

CSS notes:
- The yellow/dashed-border treatment is the canonical bump visual signal. It breaks the order-form's visual rhythm and pulls the eye exactly once. Do NOT make this look like the rest of the form.
- `accent-color` styles the checkbox to brand color in modern browsers. Falls back gracefully.
- `aria-describedby` links the checkbox to the price line for screen readers.
- Keep the box width matching the order-form column. Don't full-bleed it.

## Output Template

```markdown
# Order-Form Bump - {{BUMP_PRODUCT}}

**Flagship in cart:** {{FLAGSHIP}}
**Bump product:** {{BUMP_PRODUCT}}
**Bump price:** ${{BUMP_PRICE}} (vs. ${{LATER_PRICE}} if added separately)
**Word count:** {{N}} (target: 30–80)

## Phase 0–8 (compressed)
- Why You / Me / This / Now → answers (one sentence each)
- Bump body collapses Open + Want + Excuse into one paragraph
- Checkbox label = Door (Vision-flavored)
- Voice Rules applied; Bullshit Filter is a separate downstream pass

## Final copy

- **Headline (Nerve Strike, ~8 words):** "{{H3}}"
- **Body (~30–50 words):** "{{P}}"
- **(Optional) Snapshot bullet:** "{{B1}}"
- **Checkbox label (Door):** "{{LABEL}}"
- **Price line:** "+ ${{PRICE}}"

## HTML reference
{{HTML_BLOCK}}

## Method coverage report
```
Method coverage report:
  Open:           partial - Nerve Strike compressed to checkbox-area headline; Layers 2-4 not applicable at 30-80 words
  Three Locks:    compressed - Want + Trust signaled by parent page; Excuse via the price line (the math)
  Proof:          partial - optional one-line Receipt or the price comparison itself; full proof block not applicable at this scale
  Bullets:        partial - 0-2 bullets max (Snapshot or Keyhole); the bullet block as a system not applicable
  Cascade Close:  partial - Stack / Vision / Math collapse into one price line; the Door = the checkbox itself; Safety Net inherited from parent page
  Greased Chute:  not applicable - single-component element, no internal momentum to engineer
  Voice Rules:    full - first person, contractions, no marketing-speak; voice continuous with the checkout page
  Temperature:    Boiling (post-decision, hand on credit card)

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- **One bump per checkout.** Two bumps doubles complexity and roughly halves take rate per bump. The math: a single 25% take-rate bump beats two 14% take-rate bumps in both AOV and form-completion rate.
- **The bump price should be 5-30% of the flagship.** Above 30%, it should be an OTO (its own page), not a bump. Bumps work because they feel like an obvious add-on, not a second purchase decision.
- **The yellow-box visual treatment matters.** Test alternatives (light blue, soft red border) but never blend it into the form chrome - the visual interruption is the conversion mechanism. The eye must register the bump as a *different element* before the brain processes the offer.
- **Bumps for digital products work better than bumps for physical products** (no shipping math complexity). For physical bumps, ensure the fulfillment flow handles the addition without pricing surprise on confirmation.
- **For the page that hosts this component**, see `/convert checkout-page`.

## Failure modes to watch

Four ways a bump fails. Walk this checklist before shipping:

1. **The bump is irrelevant.** A "buy a t-shirt with your course" bump is the canonical fail. The bump must complete a job the flagship leaves unfinished.
2. **The body copy is too long.** Over 80 words and the bump turns into a mini-sales-page that competes with the flagship checkout. Compression is a feature.
3. **The checkbox label is generic.** *"Add this to my order"* is dead. The label must preview the state ("Yes - give me the [bump] templates so I can launch by Friday").
4. **The price comparison is fake.** If the bump's "save $X" math is invented, buyers detect it within the refund window. The price comparison must be a real "buy now or buy later" delta.

## Variant cheat sheet

When the user wants a bump variant, here are the canonical patterns:

- **Templates / swipe / asset bump.** Snapshot bullet, "saves you the [time it would take to build]" math.
- **Done-for-you bump.** Skin in Game implicit ("I built this so you don't have to"), "saves you the [hours]" math.
- **License-tier bump.** Keyhole bullet ("the unlock that lets you...") + commercial-rights framing.
- **Faster-shipping bump.** Vision close in label ("get it tomorrow"), no body copy needed beyond price comparison.
- **Community / accountability bump.** Anecdote-driven body, "people who joined this hit [result] X% more often" pattern.

## Lineage

- Order-form bump canon - direct-response info-marketing (long-form sales letter to order form transition).
- Commitment-and-consistency at point of purchase - Cialdini (Influence, 1984).
- Completion-bias framing ("you're already getting X - finish the set with Y") - behavioral-economics literature on bundle effects.
- The Method itself - Wayland-owned operating system.
