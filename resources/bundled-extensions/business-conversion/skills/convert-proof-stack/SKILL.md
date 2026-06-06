---
name: convert-proof-stack
slash_command: false
pack: business-conversion
family: visual_conversion
description: |
  Engineer visual proof stacks that map to the Donahoe Method's 5 proof types: testimonial layouts (text + photo + name + result), logo bars, video > text hierarchy, quote-photo-result cards, numerical proof, case studies. Specs paste-ready HTML/CSS for each pattern + placement rules across the page.
  Use when designing the proof zone of a sales page, VSL page, lead-magnet page, or any asset where Lock 2 (Trust) needs visual scaffolding.
  Not for writing testimonial copy from scratch (use /convert proof) and not for live-page proof teardown (use /market landing).
triggers:
  - proof stack
  - testimonial layout
  - social proof design
  - logo bar
  - video testimonial
  - case study card
  - donahoe proof stack
  - visual proof
  - trust signals
negative_triggers:
  - write testimonials from scratch
  - generate fake testimonials
  - audit proof on this url
tags: [conversion, page, proof, donahoe-method, conversational-proof, three-locks, visual]
priority: 80
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-proof, convert-three-locks, convert-above-fold, convert-scroll-rhythm, convert-mobile, convert-sales-page]
attribution:
  lineage: "The Donahoe Method - Conversational Proof + 5 proof types (Wayland-owned operating system); Cialdini's social-proof principle (Influence, 1984/2021); Aristotle's three rhetorical appeals (ethos / pathos / logos, c. 350 BCE) for the proof-type hierarchy"
---

# Convert Proof-Stack - Visual Stacking of the 5 Donahoe Proof Types

> *"Proof in Donahoe copy never announces itself. It doesn't feel like 'evidence.' It feels like conversation."* - The Donahoe Method, Framework 2

This skill takes the 5 Donahoe proof types - Anecdote / Receipt / Drive-By / Namecheck / Because - and engineers their visual rendering across the page. Every proof block is mapped to a layout pattern that preserves the Method's *conversational* feel while exploiting visual hierarchy to maximize believability.

## When to Use

Trigger phrases: "proof stack", "testimonial layout", "social proof design", "logo bar", "video testimonial", "case study card", "donahoe proof stack", "visual proof", "trust signals", `/convert proof-stack <product>`.

Use when:
- Designing the visual proof zones of a long-form sales page or VSL page (Sections 7 + 9 in `convert-scroll-rhythm`'s skeleton)
- Translating the output of `/convert proof` (which writes the proof copy) into specific layout patterns
- Adding a logo bar, testimonial grid, video testimonial block, or case-study card section
- Diagnosing why an existing proof zone reads as "marketing" instead of "conversation"

Do NOT use for:
- Writing testimonial copy from scratch - use `/convert proof` (this skill renders that output)
- Generating fake testimonials - Wayland never fabricates proof; if no proof exists, omit the block
- Auditing an existing live page's proof section - use `/market landing <url>`
- Building the full sales page - use `/convert sales-page`

## The 5 Donahoe Proof Types (Framework 2)

Proof in Donahoe copy is woven throughout, not isolated to a "proof section." Five types, used in priority order:

| # | Type | What it looks like | Visual pattern |
|---|------|--------------------|-----------------|
| 1 | **The Anecdote** | "Here's what happened when..." - story-form proof | Quote card with photo, name, location, specific result |
| 2 | **The Receipt** | Numbers, dates, exact amounts ("$14,327 in 11 days") | Numerical proof block with the number large + context line |
| 3 | **The Drive-By** | Credentials mentioned in passing | Inline byline / "About me" sliver / passing footnote |
| 4 | **The Namecheck** | "A guy named Mike sent me an email..." | Conversational quote (no formal testimonial block) inline with body copy |
| 5 | **The Because** | "The reason this works is..." - logical mechanism | Mechanism diagram or sub-headed explainer with simple iconography |

Each type wants a different visual treatment. A logo bar of recognizable companies is a Receipt + Authority hybrid. A case study card with before/after numbers is an Anecdote + Receipt fusion. The patterns below map proof type → layout.

## Temperature-based decision rule: Conversational vs Blocked Proof

The Method's Conversational Proof rule says proof should never *announce itself* - it should feel like the rest of the body copy with subtle attribution. But high-temperature audiences (Hot, Boiling) on commerce surfaces (e-commerce product pages, OTOs, post-purchase cross-sells) actually expect blocked testimonials and treat their absence as a missing trust signal. The Method bends, slightly, on those surfaces.

| Temperature | Default proof framing | Notes |
|-------------|------------------------|-------|
| Ice Cold | **Conversational always** | Blocked testimonials trigger "this is marketing" defenses; conversational proof slips past them |
| Cool | **Conversational always** | Same. Pull-quote inline, attribution as inline figcaption, no card framing |
| Warm | **Conversational by default; blocked sparingly** | One blocked testimonial card near the CTA stack is fine; more than that drifts into brochure-territory |
| Hot | **Blocked OK** | They're already comparing offers; blocked testimonials read as expected proof furniture |
| Boiling | **Blocked OK / expected** | Post-purchase / e-commerce surfaces expect testimonial blocks |

**Implementation in the page-builder HTML/CSS:**

- The default `figure.proof` rule renders **Conversational Proof** - body-text margin, italic, currentColor 2px left border, inline figcaption. It looks like a passing aside, not a quote-box.
- Add the `block` modifier (`<figure class="proof block">`) only when the temperature is Hot/Boiling AND the surface is commerce-shaped (post-purchase OTO, cross-sell, e-commerce PDP).
- OTO and cross-sell page-builders flip the default - those surfaces ship blocked-by-default with `figure.proof.conversational` available as the opt-in for cooler temperatures.

This rule is load-bearing: every page-builder's HTML scaffold MUST honor it. If a Cool-temperature sales page ships with quote-box testimonial cards, the Method's Conversational Proof rule has been violated even if the copy is perfect.

## The 7 Proof Stack Patterns (ranked by typical conversion lift)

Source: direct-response canon + Cialdini social proof (1984/2021) + folklore-leaning conversion data. Top entries are stronger than bottom but always: real beats designed, and any one strong type beats five weak types.

### Pattern 1 - Video Testimonial Card (named, faced person + verifiable result)

**Strongest typical lift.** ~30%+ over no testimonials in some studies (varies wildly; folklore-leaning).

```
+---------------------------+
|                           |
|   [▶ poster image, 16:9]  |
|                           |
+---------------------------+
| Name, Title, Company      |
| "Specific result quote."  |
|                           |
| [+$47K in 90 days]        |  ← optional result chip
+---------------------------+
```

Rules:
- Poster image shows the person's face - never a logo or product screenshot
- Play on tap; no autoplay (mobile-bandwidth hostile)
- Caption with name + title + company under the video
- Optional result chip below the caption (specific, verifiable)
- Aspect ratio 16:9 desktop / 9:16 if filmed vertically (don't letterbox vertical video)

### Pattern 2 - Text Testimonial + Photo + Name + Result

**Strong** - the workhorse pattern.

```
+--------------------------------+
|  [ ✦ ✦ ✦ ✦ ✦ ]                   |
|                                |
|  "Quote with the specific      |
|   nerve hit and outcome -      |
|   3-5 sentences of voice."     |
|                                |
|  [photo]  Name                  |
|           Title, Company        |
|           +$X result            |
+--------------------------------+
```

Rules:
- Photo is a real headshot (square, 64-96px); no stock, no avatar generator
- Name + title + company present (anonymized testimonials *hurt* conversion vs no testimonial)
- Quote includes a specific number, date, or before/after
- Star row optional but benign; never replaces the quote

### Pattern 3 - Logo Bar (recognizable clients)

**Modest lift, cheap to add.**

```
+--------------------------------------------------+
|   AS USED BY                                     |
|   [logo] [logo] [logo] [logo] [logo] [logo]      |
+--------------------------------------------------+
```

Rules:
- Logos are real and recognizable to the target reader
- Grayscale or 50-70% opacity (low-key visual presence)
- 3-7 logos; more than 7 = vanity, fewer than 3 = thin
- Single row desktop; wraps to 2-3 rows on mobile
- Above the fold trust strip = 3-4 logos; in-page bar = 5-7 logos
- **Never invent logos.** Faking "as seen in" is the fastest credibility-killer on the web.

### Pattern 4 - Numerical Proof Block (Receipt-type)

**Credibility multiplier** when paired with other proof.

```
+----------------------+----------------------+----------------------+
|     1,847            |     $2.4M            |      4.9 / 5         |
|  founders served     |  total revenue       |   based on 312       |
|                      |   tracked            |     reviews          |
+----------------------+----------------------+----------------------+
```

Rules:
- 3-4 numbers max - more reads as desperate
- Numbers are *specific, not rounded* ("1,847" beats "1,800+" beats "thousands")
- Each number gets a one-line context label
- Numbers live in a row on desktop, stacked column on mobile
- Numbers are real and verifiable
- Pair with at least one other proof type - naked numbers feel staged

### Pattern 5 - Case Study Card (before/after with quote)

**Strong for considered purchases ($100+).**

```
+-----------------------------------------+
| CASE STUDY - Mike, plumber, Ohio         |
+-----------------------------------------+
|  BEFORE                  AFTER          |
|  $0 online leads         47 leads/week  |
|  $40K wasted on ads      $18K MRR        |
|                                         |
|  "I set this up on a Thursday and woke  |
|   up Saturday to 47 leads. I called Sean|
|   because I thought something was       |
|   broken."                              |
|                                         |
|  [photo]  - Mike R., Cleveland          |
+-----------------------------------------+
```

Rules:
- Headline names the person + role + location ("Mike, plumber, Ohio")
- Two-column before/after with specific numbers
- Quote in voice (Donahoe Voice Rules - first person, contractions, no marketing-speak)
- Photo + name + location at the bottom
- 2-4 case study cards per page max - more is overload

### Pattern 6 - Third-Party Badges (G2, Trustpilot, Capterra)

**Modest, additive.**

```
+--------------------------------+
| ⭐ 4.8 on G2 (312 reviews)      |
| ⭐ 4.9 on Trustpilot (847 rev.) |
+--------------------------------+
```

Rules:
- Real badges only with link to source
- Live counts preferred over static numbers
- 1-2 badges; rotating "G2 Leader Spring 2025" type seals add authority halo
- Place adjacent to the primary CTA (Trust Signals Placement, §7.6)

### Pattern 7 - Press / Media Mentions

**Modest direct lift, big authority halo.**

```
+--------------------------------------------------+
|  AS FEATURED IN                                  |
|  [Forbes]  [TechCrunch]  [WSJ]  [Inc.]            |
+--------------------------------------------------+
```

Rules:
- Real coverage only - link out to the article when possible
- Outlets recognizable to the target reader (Forbes for B2C, TechCrunch for tech, etc.)
- 3-5 outlets; row format
- Halo effect even if the link is a passing mention

### Anti-Pattern - Anonymous Testimonials

```
+---------------------------+
|  "This product changed my |
|   life!"                  |
|  - Sarah K., Entrepreneur |
+---------------------------+
```

**These hurt conversion vs no testimonial.** Anonymized first-name-last-initial-vague-title testimonials read as fake. If the real person isn't willing to attach a name, photo, and verifiable detail, omit. Empty space beats fake proof.

## Inputs

Required:
1. **Asset type** - sales page / VSL / squeeze / OTO / lead-magnet (changes proof zone size)
2. **Real proof inventory** - what proof exists and is shippable? Customer names, photos, quotes, specific results, logos, numbers, press mentions, case studies. Wayland never invents.
3. **Method skill output** - output of `/convert proof` (the actual proof copy) is the source content this skill renders

Optional:
- **Visual brand constraints** - colors, photo style, typography
- **Existing proof zone** - for redesign / compression
- **Audience temperature** (Ice Cold / Cool / Warm / Hot / Boiling) - informs proof stack density
- `out_path` - caller-controlled output. Defaults via `build_report_path("business-conversion", instruction)`

## Stack Composition Rules

Proof is woven through, not concentrated. The skill emits a *full-page proof map*, not just one block.

### Composition by zone (from `convert-scroll-rhythm`)

| Scroll zone | Proof types | Patterns | Density |
|-------------|-------------|----------|---------|
| Hero (Want) | Trust strip | Compressed numerical + logo (3-4 items) + 1 star rating | Tight |
| Open body (Want) | Drive-By | Inline credential mentioned in passing | One pass |
| Pain agitate (Want) | Anecdote (yours) | Inline first-person micro-story | 1-2 sentences |
| Mechanism (Trust) | Because | Mechanism diagram or sub-headed explainer | Visual |
| Proof Block 1 (Trust) | Anecdote + Receipt | Pattern 2 (text testimonial + photo + result) ×2-3 | Card grid |
| Bullets (Trust) | Snapshot bullets (output of `convert-bullets`) | Inline; no new visual | Mixed inline |
| Proof Block 2 (Trust) | Case Study | Pattern 5 (before/after card) ×1-2 | Wide card |
| Stack close (Excuse) | Receipt | Pattern 4 (numerical proof block) | Row |
| Math close (Excuse) | Because | Mechanism / value-math callout | Highlighted box |
| Safety Net (Excuse) | Receipt + Anecdote | Money-back guarantee + redemption story | Card |
| FAQ (Excuse) | Namecheck | "A guy named Mike asked me..." inline within answer | Conversational |

Each zone gets its proof. The page never feels like one big "PROOF" chunk; it feels like proof keeps showing up.

### Composition by temperature

| Temperature | Total proof items | Pattern emphasis |
|-------------|--------------------|------------------|
| Ice Cold | 8-12 | Anecdote (their pain) + Because (mechanism) heavy |
| Cool | 6-10 | Anecdote + Receipt mix |
| Warm | 5-8 | Receipt + Case Study heavy (differentiation) |
| Hot | 4-6 | Numerical proof + Safety Net heavy (commitment) |
| Boiling | 2-4 | Final reminder + redemption story only |

## Proof Rhythm (claim → proof → claim → proof)

The Method's proof rhythm: every major claim gets at least one layer of proof within 2-3 sentences. Visually, this means the proof patterns above are not just in dedicated proof blocks - they are sprinkled inline through the body copy.

Visual implementation:
- **Inline pull-quotes** - pulled-out lines of text from a testimonial, set in larger type / colored, breaking the body copy column
- **Inline result chips** - small inline badges ("$47K in 90 days") placed beside a claim
- **Inline photo + caption** - small photo (32-48px) placed in margin or inline-flow with the body, captioning a Namecheck

These keep proof density high without creating "proof sections" that feel marketing-formal.

## Workflow

### Step 1 - Inventory the real proof

Ask the user: *"What real proof do you have?"* Map their answers to the 5 proof types and the 7 patterns. If a category is empty, mark it; never invent to fill it. Common categories:

- Customer testimonials (text + photo + named) - count, quality, specificity
- Video testimonials - count, length, faced/named
- Case studies (before/after numbers) - count, detail
- Logos - recognizable to target reader?
- Numerical proof - what numbers can we cite truthfully?
- Press mentions - what publications, what URL?
- Third-party badges - G2, Trustpilot, Capterra accounts active?
- Founder credentials - what specific past results / shipped products / dollar amounts?

### Step 2 - Map the inventory to zones

Distribute the real proof across the scroll zones per the table above. Honor priority order (Anecdote first, then Receipt, then Drive-By, then Namecheck, then Because) when picking which inventory item lands in which slot.

### Step 3 - Spec each pattern

For each proof block, emit a wireframe + the specific copy (pulled from `/convert proof` output) + the layout rules. If the user supplied raw testimonials, format them into Pattern 2 cards; if raw video links, format Pattern 1 cards.

### Step 4 - Mobile compression check

For every pattern, define the mobile rendering:
- Pattern 1 (video): 9:16 if vertical, full-width 16:9 if horizontal
- Pattern 2 (text + photo): single column, photo above quote OR small inline
- Pattern 3 (logo bar): wraps to 2-3 rows
- Pattern 4 (numerical): stacks vertically (one number per row)
- Pattern 5 (case study): before/after stacks vertically (before above, after below)
- Pattern 6 (badges): wraps to row 2 if needed
- Pattern 7 (press): wraps to 2 rows of logos

### Step 5 - Anti-pattern audit

Pass the proof stack through the anti-pattern filter:
- Any anonymous testimonials? Remove or chase the real attribution.
- Any invented logos / press? Remove.
- Any rounded "thousands of customers" numbers? Replace with exact count or remove.
- Any stock photos as testimonial photos? Remove or replace with real headshots.

### Step 6 - Emit the spec + paste-ready HTML/CSS

## Output Template

```markdown
# Proof Stack: <Product>

**Asset:** <type>
**Temperature:** <Ice Cold / Cool / Warm / Hot / Boiling>
**Total proof items:** <N>

## Inventory mapping (5 proof types → real items)

| Type | Real items available | Used in zones |
|------|----------------------|----------------|
| Anecdote | <list> | Pain / Proof Block 1 / FAQ |
| Receipt | <list of numbers, amounts> | Hero trust strip / Proof Block 1 / Stack close |
| Drive-By | <credentials> | Open body / Founder anchor |
| Namecheck | <quoted conversational refs> | Body / FAQ |
| Because | <mechanism explanations> | Mechanism / Math close |

## Page-level proof map

| # | Section | Pattern | Proof type | Specific item |
|---|---------|---------|------------|----------------|
| 1 | Hero trust strip | Pattern 3 (compressed) | Receipt + logo | ⭐ 4.9 / 312 + 3 logos |
| ... | ... | ... | ... | ... |
| 7 | Proof Block 1 | Pattern 2 ×3 | Anecdote + Receipt | Mike (Cleveland), Sarah (Phoenix), Dan (Austin) |
| 9 | Proof Block 2 | Pattern 5 ×1 | Case Study | Mike - full before/after |
| 13 | Math close | numerical callout | Receipt + Because | $1.27/day vs $200/mo SaaS |
| 14 | Safety Net | redemption story | Anecdote | "Three guys returned in year one - here's what happened" |

## Pattern specs (one block each - example: Pattern 2)

### Pattern 2 - Text Testimonial Card (Section 7)

**Wireframe (desktop)**
[wireframe per spec above]

**Wireframe (mobile)**
[wireframe - single column, photo above quote]

**Copy:**
- Quote: "<exact quote, voice-checked>"
- Star row: ⭐⭐⭐⭐⭐
- Photo: <filename / source>
- Name: <full name>
- Title + company: <full>
- Result chip: "<specific number>"

**HTML/CSS:**
```html
<figure class="testimonial">
  <div class="testimonial__stars">★★★★★</div>
  <blockquote class="testimonial__quote">
    "Quote text with specific nerve hit and outcome - 3-5 sentences of voice."
  </blockquote>
  <figcaption class="testimonial__attribution">
    <img class="testimonial__photo" src="mike.jpg" alt="Mike R., Cleveland">
    <div>
      <div class="testimonial__name">Mike R.</div>
      <div class="testimonial__title">Plumber, Cleveland Ohio</div>
      <div class="testimonial__result">+47 leads in week one</div>
    </div>
  </figcaption>
</figure>

<style>
  .testimonial {
    background: #fff;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 16px;
    padding: 28px;
    margin: 0;
    max-width: 560px;
  }
  .testimonial__stars { color: #f5a623; font-size: 14px; letter-spacing: 2px; }
  .testimonial__quote {
    font-size: 18px; line-height: 1.55; margin: 16px 0 24px;
    border: 0; padding: 0; quotes: '"' '"';
  }
  .testimonial__attribution {
    display: flex; align-items: center; gap: 16px;
  }
  .testimonial__photo {
    width: 56px; height: 56px; border-radius: 50%; object-fit: cover;
  }
  .testimonial__name { font-weight: 700; font-size: 15px; }
  .testimonial__title { font-size: 14px; opacity: 0.7; }
  .testimonial__result {
    margin-top: 4px; display: inline-block;
    background: rgba(34,197,94,0.12); color: #15803d;
    font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 6px;
  }
  @media (max-width: 600px) {
    .testimonial { padding: 20px; }
    .testimonial__quote { font-size: 17px; }
  }
</style>
```

### Pattern 4 - Numerical Proof Block (Section 11 / Stack close)

[wireframe + spec + HTML/CSS]

### Pattern 5 - Case Study Card (Section 9)

[wireframe + spec + HTML/CSS]

(...one block per pattern used on the page...)

## Anti-pattern audit results

- Anonymous testimonials: <none / N flagged → action>
- Invented logos / press: <verified real / N flagged → action>
- Rounded numbers: <verified specific / N replaced>
- Stock photos in testimonial slots: <verified real / N replaced>

---

## How to deploy

1. Use this proof map as the proof zone of `/convert sales-page`.
2. Pair with `/convert above-fold` - the hero trust strip is Pattern 3 compressed.
3. Pair with `/convert scroll-rhythm` - proof rhythm follows the zone allocations.
4. Pair with `/convert mobile` - every pattern's mobile compression is specced above.
5. Run `/convert audit` once the page is assembled - proof rhythm scoring lives there.
```

## Pitfalls

- **Concentrating proof in one block.** A single "PROOF" section labeled "Testimonials" feels like a marketing brochure. Distribute across zones.
- **Anonymous testimonials.** First-name-last-initial-vague-title hurts conversion vs no testimonial. Empty space beats fake proof.
- **Stock photo headshots.** Recognizable as stock = signals fake. Real photos only; if not available, drop the photo (text-only quote with name + verifiable detail still works).
- **Rounded numbers.** "10,000+ users" reads less true than "1,847 founders." Specificity is credibility.
- **Logo overload.** 12 client logos feels desperate. 5-7 is the sweet spot.
- **Invented "as seen in" mentions.** A faked Forbes logo is grounds for instant credibility loss and possible legal exposure. Real coverage only.
- **Video autoplay.** Bandwidth-hostile and almost universally blocked. Always poster + tap-to-play.
- **Overstacking.** 30+ testimonials in one zone reads as protesting too much. 3-4 strong testimonials beat 30 weak.
- **Proof without claim.** A testimonial dropped beside no specific claim is decorative. Claim → proof rhythm requires the proof to be tied to a claim within 2-3 sentences.

## Lineage

- **Conversational Proof + 5 proof types** - The Donahoe Method, Framework 2 (Wayland-owned operating system)
- **Anecdote / Receipt / Drive-By / Namecheck / Because** - Donahoe-coined proof typology
- **Cialdini's social proof principle** - *Influence: The Psychology of Persuasion* (Cialdini, 1984; expanded 2021)
- **Aristotle's three rhetorical appeals** (ethos / pathos / logos, *Rhetoric*, c. 350 BCE) - the priority order maps loosely: pathos (Anecdote) → logos (Receipt + Because) → ethos (Drive-By + Namecheck)
- **Proof stacking conversion data** - direct-response folklore + replicated case-study research (cited as folklore-leaning where appropriate)
- **Anti-pattern (anonymous testimonial)** - replicated split tests showing anonymized testimonials *underperform* no testimonial

## Notes

- Wayland never invents proof. If the inventory is thin, the page either has thin proof (visible, honest) or proof types are weighted toward what's available (e.g., heavy Drive-By + Because if only one customer testimonial exists yet).
- Proof is woven, not concentrated. A page with one giant "Testimonials" section and no proof anywhere else fails the Method's proof rhythm even if every testimonial is strong.
- Mobile rendering is non-optional. Specify it for every pattern.
- This skill is downstream of `/convert proof` (which writes the actual proof copy) and upstream of `/convert sales-page` (which uses this map as the proof zone). It composes with `/convert scroll-rhythm` for placement and `/convert mobile` for compression.
- Real beats designed. Real beats polished. Real beats abundant. One real, specific, named, faced testimonial converts better than ten polished anonymous ones.
