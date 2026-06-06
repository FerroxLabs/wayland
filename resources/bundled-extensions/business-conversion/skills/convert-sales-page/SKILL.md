---
name: convert-sales-page
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author long-form direct-response sales pages: section architecture, full body copy, paste-ready HTML/CSS, and Method audit footer. Applies The Donahoe Method top-to-bottom across 16 sections.
  Use when the user has a product and needs a complete sales page built from a brief - not a teardown of an existing URL.
  Not for auditing live URLs (use /market landing) or rewriting existing copy (use /convert rewrite). For squeeze/opt-in pages use /convert squeeze.
triggers:
  - write me a sales page
  - build me a sales page
  - long-form sales page
  - direct response sales page
  - sales letter
  - donahoe sales page
  - convert sales-page
  - the full sales page
  - flagship sales page
negative_triggers:
  - audit my sales page
  - score my landing page
  - rewrite my sales page
  - cro review of my page
  - just a squeeze page
  - just a vsl
tags: [conversion, copy, page, sales-page, donahoe-method, html]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-four-questions, convert-temperature, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter, convert-audit]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references Halbert long-form direct mail canon, Schwartz awareness levels, Caples headline formulas, Sugarman slippery slide, Hormozi value-equation framing"
---

# Convert Sales Page - The Long-Form Direct-Response Sales Page

> *"Know who you're talking to and where they are. Answer the Four Questions before you write a word. Open through the Side Door with Skin in the Game and your Fingerprint. Build desire, earn trust, give them the excuse to buy. Close from every angle. Then close again."* - The Donahoe Method, in one paragraph

This is the flagship of the conversion pack. It applies all eight Donahoe Method frameworks top-to-bottom and emits three things: a structured editorial brief, a paste-ready HTML/CSS reference implementation, and a Method audit footer.

## When to Use

Trigger phrases: `write me a sales page`, `build me a sales page`, `long-form sales page`, `donahoe sales page`, `direct response sales page`, `flagship sales page`, `/convert sales-page <product>`.

Use this when:
- The user has a product, course, service, or offer that needs a complete long-form page (1,500–8,000 words depending on temperature).
- The reader needs to be taken from cold to sold inside a single page.
- Both copy AND a deployable HTML scaffold are needed.

## When NOT to Use

- **Auditing an existing live page** → `/market landing <url>` (CRO teardown of someone else's page) or `/convert audit` (Method-scoring an existing draft).
- **Rewriting existing copy** → `/convert rewrite` (preserves voice while applying Method).
- **Short opt-in page** → `/convert squeeze`.
- **Video sales letter script** → `/convert vsl`.
- **VSL hosting page** → `/convert vsl-page`.
- **Designing the offer itself** (value equation, bonuses, pricing) → `/funnel offer`.
- **Sequencing the page in a campaign** → `/funnel build-campaign` or `/funnel ladder`.

## Inputs

Required:
1. **Product description** - what is being sold? What does it actually do?
2. **The one person** - name, city, situation, last failure. Donahoe Voice Rule #1: One Person Rule. If the user supplies a segment ("course creators"), ask once for one specific human.
3. **The Nerve** - the specific raw pain that's bothering them this morning. Sensory, not abstract.
4. **Offer** - price, what's included, deliverables, any bonuses, guarantee terms.

Optional:
- **Author voice notes** - signature phrases, profanity tolerance, tone. If absent, default to The Donahoe Voice Rules.
- **Existing proof assets** - testimonials, case study numbers, screenshots, named customers.
- **Temperature override** - if the user knows the traffic is cold/cool/warm/hot, accept; otherwise classify via `convert-temperature`.
- **Brand colors / logo** - for the HTML scaffold's CSS custom properties.
- **`out_path`** - defaults via `build_report_path("business-conversion", instruction)`.

## Workflow - Phase -1 plus All Eight Method Phases

The page-builder MUST walk Phase -1 (VoC mining) plus all eight Method phases. Skipping any phase produces broken copy.

### Phase -1 - Voice-of-Customer Mining (HARD GATE - refuse to proceed without it)

Halbert's "person who" letter style and Schwartz's awareness-level sequencing both require one thing the seller cannot fake: **the buyer's actual language**. Without it, every framework that follows generates from the seller's mental model, not the buyer's. The page reads *plausible* but never *resonant*.

This skill REFUSES to proceed to Phase 0 until the VoC bank exists. Ask once. If the user says they don't have one, hand them the 30-minute mining playbook below. Do not start writing without it.

#### What to collect - 5 to 10 verbatim quotes

The quotes must come from the reader's actual mouth/keyboard, not the seller's hypothesis. Sources, in order of diagnostic value:

1. **Amazon reviews of similar / competing products** - especially the **3-star reviews** (most diagnostic - buyer is engaged enough to write, but unhappy enough to name what's missing).
2. **Support tickets / customer-service transcripts** - pre-purchase questions show objections; post-purchase complaints show desired-outcome gaps.
3. **Sales-call transcripts** - prior calls with this avatar; pull pain quotes, "what I tried before" quotes, and "what would success look like" answers.
4. **Reddit / Quora / forum threads** - search the niche subreddit or forum for the problem term; the comments are the language.
5. **Customer interview voice memos** - even one 20-minute call with one buyer beats a hundred reviews.
6. **Email replies from the existing list** - paste the question "what's the hardest part of [problem] right now?" and read the replies as raw material.

Aim for 5-10 quotes total, balanced across pain, desired-outcome, and objection categories (3-5 each).

#### VoC bank format (capture before writing a word)

```
## VoC Bank - <YYYY-MM-DD>

### Pain quotes (3-5)
- "Quote 1, verbatim, with original spelling/grammar." - [source: Reddit r/<sub>, 2026-04-12]
- "Quote 2, verbatim." - [source: 3-star Amazon review of <competitor product>, 2026-03-08]
- "Quote 3, verbatim." - [source: support ticket #1247]

### Desired-outcome quotes (3-5)
- "Quote 1, verbatim - what they said success would look like." - [source: existing testimonial we have]
- "Quote 2, verbatim." - [source: sales call transcript with <name>, 2026-04-22]

### Objection quotes (3-5)
- "I tried [competitor] before and it didn't work because..." - [source: Reddit thread]
- "I'd buy this but I'm worried about..." - [source: support ticket]
- "What if my situation is different because..." - [source: sales-call objection log]
```

Keep the original spelling, profanity, fragments, and run-ons. Cleaning the quote up destroys its value - the rough edges are the proof of authenticity.

#### How Phase 1+ uses the VoC bank (load-bearing)

The VoC bank is not a research artifact filed away. Each downstream phase MUST pull from it:

- **Phase 2 (Layer 1 Nerve Strike)** MUST quote or near-paraphrase a **pain quote** from the bank. The first sentence of the page is the buyer's words played back to them, not the seller's invention.
- **Phase 3 (Three Locks - The Want)** MUST surface **desired-outcome quotes** verbatim where possible. Lock 1 sells the state in the buyer's own words.
- **Phase 4 (Bullets)** MUST surface the **objection quotes** - every Flip and Scar bullet should map to an objection from the bank. If a bullet doesn't trace to a real objection, cut it.
- **Phase 5 (Proof)** uses **desired-outcome quotes** from existing customers as Namecheck and Receipt material when the user has them.
- **Phase 8 (Bullshit Filter)** - for every paragraph in the final draft, ask: *"Is the buyer's language anywhere in this paragraph? Or is this all my language?"* If the page is 100% seller-voice, it has failed regardless of what the Filter says about marketing-speak.

#### If the user says "I don't have a VoC bank"

Do not write the page. Hand them this 30-minute mining playbook and wait for the bank.

```
## 30-Minute VoC Mining Playbook

Goal: 5-10 verbatim quotes (3-5 pain, 3-5 desired-outcome, 3-5 objection).

Minutes 0-10 - Amazon mine
- Search Amazon for the closest competing book / product to your offer.
- Filter to 3-star reviews. Read 5. Pull 2 pain quotes + 1 desired-outcome quote verbatim.

Minutes 10-20 - Reddit mine
- Search the niche subreddit (r/<niche>) for the problem term ("can't write copy", "stuck at $5k months", etc.).
- Read the top 3 threads. Pull 2 pain quotes + 1 objection quote verbatim.
  Bonus: scroll the comments - the dissenters in the thread are your objection bank.

Minutes 20-30 - Sales-call / list mine
- If you have prior sales-call notes: pull 1 pain + 1 desired-outcome + 1 objection.
- If you don't: post one question to your list ("what's the hardest part of [problem] right now?") and pull from the replies tomorrow.

If you have NO list and NO prior calls: do the Amazon + Reddit pass twice (different competitors,
different threads) and you'll still get 6-8 usable quotes. That's enough to write Layer 1.
```

Do not start the page until the bank exists. The skill exits Phase -1 only when 5+ verbatim, sourced quotes are in hand.

### Phase 0 - Diagnostic: The Four Questions

Call `convert-four-questions` (or run inline) before writing a single section. Answer from the reader's perspective:

- **Why You?** - Why should THIS person care, today, this Tuesday?
- **Why Me?** - Why are *you* qualified to help them with *this*? (Skin in the Game, not credential dump.)
- **Why This?** - What's the mechanism that makes this approach different (not "better" - *different*)?
- **Why Now?** - Real reason to act today. If there isn't one, don't manufacture one.

If any answer is weak or generic, stop and refine. The whole page rests on these four answers.

### Phase 1 - Temperature Classification

Call `convert-temperature` to classify the reader as Ice Cold / Cool / Warm / Hot / Boiling.

- **Ice Cold** → Lead with pattern interrupt + education. Page length 4,000–8,000 words.
- **Cool** → Name the problem precisely, introduce category of solution. 3,000–5,000 words.
- **Warm** → Differentiate. Mechanism does the work. 2,500–4,000 words.
- **Hot** → Persuasion + risk reversal. 1,500–3,000 words.
- **Boiling** → Short, direct, almost a reminder. 800–1,500 words.

Temperature determines the word budget and the depth of every section below. Writing hot copy for a cold audience is the most common cause of page failure - do not skip this step.

### Phase 2 - The Four-Layer Open

Call `convert-open`. Generate the hero/above-fold open using all four layers in 3–5 sentences:

1. **Nerve Strike** - first sentence hits the raw pain they feel today.
2. **Side Door** - casual entry, not a frontal pitch.
3. **Skin in the Game** - within sentences 3–4, why *you* are telling them.
4. **Fingerprint** - the only-you moment (opinion, comparison, vivid image, contrarian take).

This becomes the first content the reader sees. The headline lives inside Layer 1 or sits just above it.

### Phase 3 - Three Locks Architecture

Call `convert-three-locks` to architect the body:

- **Lock 1 - The Want** → Sections 5–7 (sell the *state*, not the product).
- **Lock 2 - The Trust** → Sections 8–10 (Conversational Proof, mechanism, big claim).
- **Lock 3 - The Excuse** → Sections 11–12 (offer stack + math justification).

All three locks must open before the reader can buy. Map each section to a lock; if a section doesn't open a lock, cut it.

### Phase 4 - Bullets

Call `convert-bullets` to generate the bullet block (Section 10). 8–15 bullets, mixed across four types:

- **Keyhole** - "The [unexpected thing] that [specific result]. (Page 14)"
- **Flip** - "Why [common practice] is actually costing you - and what to do instead."
- **Snapshot** - "How [name] used this to [measurable result] in [timeframe]."
- **Scar** - "The one mistake that [dramatic consequence] - I made it myself in [year]."

No bullet should sound like marketing. Each must be specific, sensory, curiosity-gap-shaped.

### Phase 5 - Proof, Woven Throughout

Call `convert-proof`. Conversational Proof never lives in one "proof section" - it runs through every claim. The rhythm: Claim → Evidence (story or specific) → Reason → Move on.

Five proof types, used as needed:
- **Anecdote** - "Here's what happened when..."
- **Receipt** - exact numbers, dates, dollar amounts.
- **Drive-By** - credentials mentioned in passing, never announced.
- **Namecheck** - "A guy named Mike sent me an email..."
- **Because** - the logical reason the mechanism works.

Every major claim gets at least one layer of proof within 2–3 sentences of the claim.

### Phase 6 - Cascade Close

Call `convert-close`. The Cascade Close is Section 13:

- **Stack** - list everything they get, conversationally.
- **Vision Close** - paint the desired state 90 days from now.
- **Math Close** - the numbers, the cost-of-inaction comparison.
- **Safety Net** - guarantee so strong it's almost absurd.
- **Door** - simple click instruction.

Then Section 16: **P.S.** (recloses from another angle) and **P.P.S.** (restates strongest proof or guarantee).

### Phase 7 - Greased Chute Throughout

Call `convert-chute`. Engineer momentum across the entire page:

- **Open loops** at section transitions ("But that's not even the interesting part...").
- **Short paragraphs** - 1–3 sentences. White space is pacing.
- **Varied rhythm** - short punch, longer breath, short again.
- **Curiosity transitions** - never end a section with a conclusion; end with a tease.
- **Read-aloud test** - every place you'd stumble, the reader will check their phone. Fix it.

Apply chute discipline to every section before moving on.

### Phase 8 - Voice Pass + Bullshit Filter

Final pass. Call `convert-voice` then `convert-bullshit-filter`.

Voice Rules:
- First person ("I", "you" - never "we", "customers").
- Contractions throughout.
- Mixed sentence lengths.
- No marketing-speak (banned: leverage, optimize, revolutionary, game-changing, unlock potential, take to the next level).
- Specificity over generality.
- Visceral over abstract.

Bullshit Filter - for every paragraph: *"Would I actually say this to someone I'm trying to help?"* If no, rewrite until yes.

## Section Architecture (16 Sections)

The full long-form arc. For Hot/Boiling traffic, sections 6, 7, 9, 12 may be compressed; the others stay.

| # | Section | Purpose | Method primitive |
|---|---------|---------|------------------|
| 1 | Hero / above-fold | Layer 1 Nerve Strike + headline + primary CTA | convert-open Layer 1 |
| 2 | Side-Door entry | Conversational on-ramp; defenses down | convert-open Layer 2 |
| 3 | Skin-in-the-Game origin | Why *you* | convert-open Layer 3 |
| 4 | Fingerprint moment | Only-you POV | convert-open Layer 4 |
| 5 | The Want section | Paint the state vividly | Lock 1 |
| 6 | Pain agitation | Specific, sensory cost of staying stuck | Lock 1 reinforcement |
| 7 | Bridge / mechanism reveal | The "this is how it works" pivot | Lock 2 setup |
| 8 | The Trust section | Conversational Proof in rhythm | Lock 2 |
| 9 | The big-claim section | The strongest, most specific promise | Lock 2 climax |
| 10 | Bullet block | 8–15 mixed bullets | convert-bullets |
| 11 | Offer / value stack | Everything they get, conversationally | Cascade Stack |
| 12 | The Excuse section | Math justification | Lock 3 |
| 13 | Cascade Close | Stack → Vision → Math → Safety Net → Door | convert-close |
| 14 | Guarantee block | The Safety Net, expanded | Cascade Safety Net |
| 15 | FAQ | Objection handling inline | Lock 3 reinforcement |
| 16 | P.S. + P.P.S. | Recloses from new angles | Cascade reclose |

## Section-by-Section HTML/CSS Template

Modern, semantic, mobile-first. CSS custom properties for theming. No CDN imports. No utility frameworks. Single `<style>` block under 60 lines. Pastes into Webflow / Framer / Wix / Carrd / static HTML.

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
    :root {
      --ink: #111418;
      --ink-soft: #3a3f47;
      --paper: #fdfcf9;
      --accent: #c0392b;
      --accent-ink: #fff;
      --rule: #e6e2d8;
      --max: 720px;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; font: 18px/1.6 Georgia, "Times New Roman", serif; color: var(--ink); background: var(--paper); }
    main { max-width: var(--max); margin: 0 auto; padding: 24px 20px 96px; }
    h1, h2, h3 { font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; line-height: 1.18; color: var(--ink); }
    h1 { font-size: clamp(28px, 6vw, 44px); margin: 16px 0 24px; }
    h2 { font-size: clamp(22px, 4.5vw, 30px); margin: 56px 0 16px; }
    h3 { font-size: 20px; margin: 32px 0 12px; }
    p { margin: 0 0 18px; }
    ul.bullets { list-style: none; padding: 0; }
    ul.bullets li { padding: 10px 0 10px 28px; position: relative; border-bottom: 1px solid var(--rule); }
    ul.bullets li::before { content: ""; position: absolute; left: 6px; top: 18px; width: 10px; height: 10px; background: var(--accent); border-radius: 2px; }
    .cta { display: inline-block; padding: 18px 28px; background: var(--accent); color: var(--accent-ink); text-decoration: none; font-weight: 700; font-size: 18px; border-radius: 6px; border: 0; cursor: pointer; }
    .cta:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
    .stack { background: #fff; border: 1px solid var(--rule); padding: 24px; border-radius: 8px; margin: 24px 0; }
    .ps { border-top: 2px solid var(--rule); padding-top: 24px; margin-top: 48px; font-style: italic; color: var(--ink-soft); }
    /* Default: Conversational Proof - proof never announces itself (Method Framework 2) */
    figure.proof { margin: 1.2em 0; padding-left: 1.5em; border-left: 2px solid currentColor; font-style: italic; opacity: 0.92; }
    figure.proof p, figure.proof blockquote { margin: 0; border: 0; padding: 0; }
    figure.proof figcaption { display: inline; font-size: 0.9em; font-style: normal; margin-left: 0.5em; opacity: 0.7; color: var(--ink-soft); }
    /* Opt-in: Block-quote framing - Hot/Boiling audiences only (e-commerce, post-purchase) */
    figure.proof.block { margin: 1.5em 0; padding: 1em 1.2em; background: rgba(0,0,0,0.04); border-left: 4px solid var(--accent); border-radius: 4px; font-style: normal; opacity: 1; }
    figure.proof.block blockquote { margin: 0 0 0.5em 0; }
    figure.proof.block figcaption { display: block; opacity: 0.75; font-size: 0.85em; margin-top: 0.4em; margin-left: 0; }
    details { border-bottom: 1px solid var(--rule); padding: 12px 0; }
    details summary { cursor: pointer; font-weight: 600; }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
  </style>
</head>
<body>
<main>
  <!-- 1. Hero / above-fold -->
  <header>
    <p class="kicker">{{KICKER_NERVE_STRIKE}}</p>
    <h1>{{HEADLINE}}</h1>
    <p class="subhead">{{SUBHEAD_LAYER_1_2}}</p>
    <a class="cta" href="#offer" aria-label="{{CTA_ARIA}}">{{CTA_PRIMARY}}</a>
  </header>

  <!-- 2. Side-Door entry -->
  <section aria-label="Opening"><p>{{SIDE_DOOR_PARAGRAPH}}</p></section>

  <!-- 3. Skin-in-the-Game origin -->
  <section><p>{{SKIN_IN_GAME_PARAGRAPH}}</p></section>

  <!-- 4. Fingerprint moment -->
  <section><p>{{FINGERPRINT_PARAGRAPH}}</p></section>

  <!-- 5. The Want section -->
  <section><h2>{{WANT_HEADER}}</h2><p>{{WANT_BODY_VIVID_STATE}}</p></section>

  <!-- 6. Pain agitation -->
  <section><h2>{{PAIN_HEADER}}</h2><p>{{PAIN_AGITATION_BODY}}</p></section>

  <!-- 7. Bridge / mechanism reveal -->
  <section><h2>{{MECHANISM_HEADER}}</h2><p>{{MECHANISM_BODY_BECAUSE}}</p></section>

  <!-- 8. The Trust section (Conversational Proof) -->
  <section><h2>{{TRUST_HEADER}}</h2>
    <p>{{CLAIM_1}}</p>
    <figure class="proof"><blockquote>{{ANECDOTE_OR_RECEIPT_1}}</blockquote><figcaption>{{NAMECHECK_1}}</figcaption></figure>
    <p>{{BECAUSE_1}}</p>
    <p>{{CLAIM_2}}</p>
    <figure class="proof"><blockquote>{{ANECDOTE_OR_RECEIPT_2}}</blockquote><figcaption>{{NAMECHECK_2}}</figcaption></figure>
    <p>{{BECAUSE_2}}</p>
  </section>

  <!-- 9. Big claim -->
  <section><h2>{{BIG_CLAIM_HEADER}}</h2><p>{{BIG_CLAIM_BODY}}</p></section>

  <!-- 10. Bullet block -->
  <section><h2>{{BULLET_HEADER}}</h2>
    <ul class="bullets">
      <li>{{BULLET_KEYHOLE_1}}</li>
      <li>{{BULLET_FLIP_1}}</li>
      <li>{{BULLET_SNAPSHOT_1}}</li>
      <li>{{BULLET_SCAR_1}}</li>
      <li>{{BULLET_KEYHOLE_2}}</li>
      <li>{{BULLET_FLIP_2}}</li>
      <li>{{BULLET_SNAPSHOT_2}}</li>
      <li>{{BULLET_SCAR_2}}</li>
      <!-- 8-15 total, mixed types -->
    </ul>
  </section>

  <!-- 11. Offer / value stack -->
  <section id="offer" class="stack">
    <h2>{{OFFER_HEADER}}</h2>
    <p>{{STACK_CONVERSATIONAL_PARAGRAPH}}</p>
    <ul class="bullets">
      <li>{{COMPONENT_1}}</li>
      <li>{{COMPONENT_2}}</li>
      <li>{{COMPONENT_3}}</li>
      <li>{{BONUS_1}}</li>
      <li>{{BONUS_2}}</li>
    </ul>
    <p><strong>{{PRICE_FRAMING}}</strong></p>
  </section>

  <!-- 12. Excuse section (math) -->
  <section><h2>{{EXCUSE_HEADER}}</h2><p>{{MATH_JUSTIFICATION_BODY}}</p></section>

  <!-- 13. Cascade Close -->
  <section><h2>{{CLOSE_HEADER}}</h2>
    <p>{{VISION_CLOSE_PARAGRAPH}}</p>
    <p>{{MATH_CLOSE_PARAGRAPH}}</p>
    <p>{{SAFETY_NET_PARAGRAPH}}</p>
    <p><a class="cta" href="{{CHECKOUT_URL}}" aria-label="{{CTA_ARIA}}">{{CTA_PRIMARY}}</a></p>
    <p class="door">{{DOOR_INSTRUCTION}}</p>
  </section>

  <!-- 14. Guarantee block -->
  <section><h2>{{GUARANTEE_HEADER}}</h2><p>{{GUARANTEE_BODY}}</p></section>

  <!-- 15. FAQ -->
  <section><h2>Questions you're probably asking</h2>
    <details><summary>{{FAQ_Q_1}}</summary><p>{{FAQ_A_1}}</p></details>
    <details><summary>{{FAQ_Q_2}}</summary><p>{{FAQ_A_2}}</p></details>
    <details><summary>{{FAQ_Q_3}}</summary><p>{{FAQ_A_3}}</p></details>
    <details><summary>{{FAQ_Q_4}}</summary><p>{{FAQ_A_4}}</p></details>
  </section>

  <!-- 16. P.S. and P.P.S. -->
  <aside class="ps">
    <p><strong>P.S.</strong> {{PS_RECLOSE_NEW_ANGLE}}</p>
    <p><strong>P.P.S.</strong> {{PPS_RESTATE_PROOF_OR_GUARANTEE}}</p>
  </aside>
</main>
</body>
</html>
```

CSS notes for the writer:
- The serif body type signals editorial / direct-mail rather than SaaS. Replace with a sans-serif if the offer is technical and the audience is engineers.
- `--accent` is the only loud color. Keep it singular. The CTA, the proof rule, and the bullet markers all share it so the eye keeps returning to the action.
- The page is single-column, max 720px wide. Long-form copy reading at 60–75 characters per line. Do not introduce a sidebar.

## Output Template (the report you write to disk)

```markdown
# Sales Page: {{PRODUCT}}

**One person:** {{NAME}}, {{CITY}}, {{SITUATION}}
**The Nerve:** {{NERVE_SENTENCE}}
**Temperature:** {{ICE_COLD/COOL/WARM/HOT/BOILING}}
**Word budget:** {{N}} words
**Offer:** {{PRICE}} - {{WHAT_IS_INCLUDED}} - {{GUARANTEE_TERMS}}

---

## Phase -1 - Voice-of-Customer Bank

### Pain quotes (3-5)
- "{{PAIN_QUOTE_1}}" - [source: {{SOURCE_1}}]
- "{{PAIN_QUOTE_2}}" - [source: {{SOURCE_2}}]
- "{{PAIN_QUOTE_3}}" - [source: {{SOURCE_3}}]

### Desired-outcome quotes (3-5)
- "{{OUTCOME_QUOTE_1}}" - [source: {{SOURCE}}]
- "{{OUTCOME_QUOTE_2}}" - [source: {{SOURCE}}]
- "{{OUTCOME_QUOTE_3}}" - [source: {{SOURCE}}]

### Objection quotes (3-5)
- "{{OBJECTION_QUOTE_1}}" - [source: {{SOURCE}}]
- "{{OBJECTION_QUOTE_2}}" - [source: {{SOURCE}}]
- "{{OBJECTION_QUOTE_3}}" - [source: {{SOURCE}}]

**VoC -> Page mapping:**
- Layer 1 Nerve Strike sources from: {{PAIN_QUOTE_N}}
- Lock 1 (Want) sources from: {{OUTCOME_QUOTE_N}}
- Bullet block (Flip / Scar) sources from: {{OBJECTION_QUOTE_N}}

## Phase 0 - Four Questions

- **Why You?** {{ANSWER}}
- **Why Me?** {{ANSWER}}
- **Why This?** {{ANSWER}}
- **Why Now?** {{ANSWER}}

## Phase 1 - Temperature

{{CLASSIFICATION}} - {{ONE_LINE_RATIONALE}}

## Phase 2 - Four-Layer Open

> {{FULL_OPEN_3_TO_5_SENTENCES}}

Layer breakdown:
- **Nerve Strike:** "{{QUOTE}}"
- **Side Door:** "{{QUOTE}}"
- **Skin in Game:** "{{QUOTE}}"
- **Fingerprint:** "{{QUOTE}}"

## Phase 3 - Three Locks Map

- **Want (sections 5–7):** {{ONE_LINE}}
- **Trust (sections 8–10):** {{ONE_LINE}}
- **Excuse (sections 11–12):** {{ONE_LINE}}

## Phase 4 - Bullet Block (10–15)

- {{BULLETS}} (typed: K=Keyhole F=Flip Sn=Snapshot Sc=Scar)

## Phase 5 - Proof Rhythm

{{LIST_OF_CLAIMS_AND_THEIR_PAIRED_PROOF_TYPES}}

## Phase 6 - Cascade Close

{{FULL_CLOSE_TEXT}}

## Phase 7 - Chute Notes

- Open loops planted at: {{SECTION_NUMBERS}}
- Read-aloud stumble points fixed: {{NOTES}}

## Phase 8 - Voice + Bullshit Filter (separate gate)

- Voice Rules pass: applied (first person, contractions, no marketing-speak)
- Buyer-language presence - VoC quotes / paraphrases located in the draft: {{COUNT}}
- Bullshit Filter: NOT graded here - run `/convert bullshit-filter` as a separate coaching pass before shipping

---

## Full sales page copy (final)

{{SECTION_1_TO_16_FULL_TEXT}}

---

## HTML/CSS reference implementation

{{HTML_BLOCK}}

---

## Method coverage report

```
Method coverage report:
  Open:           full - all 4 layers (Nerve Strike, Side Door, Skin in Game, Fingerprint); Layer 1 sourced from a VoC quote
  Three Locks:    full - Want, Trust, Excuse architected across the 16 sections; mapped to VoC bank where applicable
  Proof:          full - claim → evidence → reason → move-on rhythm woven across the body, not boxed
  Bullets:        full - mixed types (K / F / Sn / Sc); each Flip and Scar traces to a VoC objection
  Cascade Close:  full - Stack / Vision / Math / Safety Net / Door + P.S. + P.P.S. in spec order
  Greased Chute:  full - paragraph rhythm + open loops at section breaks; read-aloud pass completed
  Voice Rules:    full - first person, contractions, no marketing-speak; banned-phrase grep clean
  Temperature:    {{ICE_COLD / COOL / WARM / HOT / BOILING}}

VoC inputs: {{N}} pain / {{N}} outcome / {{N}} objection quotes - sources logged

Required next step: Run /convert bullshit-filter on this draft before shipping.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- This skill orchestrates the other writing skills. It does not duplicate them - it calls them in order. If a sub-skill's output is weak, fix it in that skill, not here.
- **VoC bank ownership.** The Phase -1 VoC bank built here is the canonical buyer-language artifact for the offer. When `convert-vsl` or `convert-bridge-page` (advertorial) runs against the same product, reuse this bank - re-mining is wasted effort. Pass the bank file path along when handing off.
- For composite "research → write → page → audit" delivery, route through `/convert package` instead of calling this skill directly.
- For Hot/Boiling traffic where the page should be 1,500 words or less, drop sections 6, 7, and 12 to one-paragraph summaries each. Keep the rest.
- For Ice Cold traffic, expand Section 5 (Want) and Section 7 (Mechanism) - these are the "education" workhorses for cold readers.
- HTML scaffold is intentionally minimal. Designers can extend; the bones are correct.
- If the final draft fails the Bullshit Filter, do not ship. Route back to `convert-voice`, then `convert-chute`, then re-filter.
- The P.S. is not optional. Donahoe pages always close again after the close. Then close one more time in the P.P.S.

## Lineage

- Long-form direct-mail structure - Halbert (Boron Letters, 1984) and the canon of long-copy Direct Mail.
- Awareness-level sequencing - Schwartz (Breakthrough Advertising, 1966).
- Headline construction inside Layer 1 - Caples (Tested Advertising Methods, 1932).
- Slippery-slide momentum (Greased Chute) - Sugarman (The AdWeek Copywriting Handbook, 1998).
- Value-stack framing in Section 11 - informed by Hormozi-style equation logic, expressed in conversational rather than calculator form.
- The Method itself - Wayland-owned operating system. No external citation needed for the Method; cite lineage authors only where their canonical concept does specific work in a section.
