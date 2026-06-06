---
name: convert-bullets
slash_command: false
pack: business-conversion
family: donahoe_method
description: |
  Generate Donahoe bullets across 4 types - Keyhole, Flip, Snapshot, Scar - mixed for rhythm. Each bullet is a miniature persuasion engine that creates a curiosity gap only the product resolves.
  Use when authoring the "what's inside" / "what you get" / feature section of a sales page, VSL, lead-magnet pitch, or course module list.
  Not for ordinary feature lists or specs (those go in plain prose) and not for headline-only generation (use convert-open Layer 1).
triggers:
  - write me bullets
  - donahoe bullets
  - bullet system
  - keyhole bullets
  - flip bullets
  - snapshot bullets
  - scar bullets
  - whats inside section
  - feature bullets
  - benefit bullets
negative_triggers:
  - feature list with specs
  - just give me a checklist
  - score my bullets
  - rewrite my bullets one for one
tags: [conversion, copy, donahoe-method, bullet-system, bullets]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-four-questions, convert-open, convert-proof, convert-three-locks, convert-close, convert-sales-page]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references *Sugarman fascination bullets (AdWeek Copywriting Handbook, 1998)*, *Halbert curiosity-gap construction + admitted-failure credibility (Boron Letters, 1984)*, *Hopkins evidence-and-reason structure (Scientific Advertising, 1923)*, and *Carlton magalog bullet structures (Kick-Ass Copywriting Secrets, 2003)*"
---

# Convert Bullets - The Donahoe Bullet System

> *"Bullets are miniature persuasion engines. Each one should be compelling enough to serve as its own headline. Four types, mixed together for rhythm."* - The Donahoe Method, Framework 4

This skill generates bullets in the four Method types (Keyhole, Flip, Snapshot, Scar), mixes them for rhythm, and outputs them ready to drop into the "what's inside" section of any conversion asset.

Each bullet creates a curiosity gap that ONLY the product resolves. If a bullet could be answered by Googling, it's a bad bullet.

## When to Use

Trigger phrases: "write me bullets", "donahoe bullets", "bullet system", "keyhole bullets", "flip bullets", "snapshot bullets", "scar bullets", "what's inside section", "feature bullets", "benefit bullets", `/convert bullets <product>`.

Use for any section where a list will outperform prose: course module lists, "what's inside" reveals on a sales page, lead-magnet promise lists, email teaser blocks, ad-copy bullet variants.

Do NOT use for:
- Plain feature/spec lists (e.g. "ships in 5 business days, 30-day battery life, weighs 1.2 lbs") - those are utility, not persuasion
- Replacing prose entirely - bullets land harder when surrounded by narrative
- Generating standalone headlines (use `convert-open` Layer 1)
- Auditing existing bullets for Method-fit (use `convert-audit`)

## Inputs

Required:
1. **Product / offer** - what the bullets are revealing the contents of. The more concrete the contents, the better the bullets.
2. **Real contents** - actual modules, lessons, templates, secrets, tactics, frameworks. Bullets pulled from imagined contents fail because they can't be specific. Real contents = pages / module numbers / specific scripts the product actually contains.
3. **Reader / brief** - from `convert-four-questions`. The bullets must hit nerves *that reader* feels, not generic ones.

Optional:
- **Number of bullets** - defaults to 12 (mixed 4-type rhythm) for a sales page section. 5-7 for a lead-magnet promise. 3-5 for an email teaser.
- **Section context** - what comes before and after (affects which bullet leads / closes the block)
- **Reader temperature** - Cool audiences need Snapshot-heavy; Hot audiences can take Keyhole-heavy
- `out_path` - caller-controlled output. Defaults via `build_report_path`.

## The Four Bullet Types (full method)

### The Keyhole

A peek through the keyhole at something specific enough to be believable, but withheld enough to create a gap only the product fills.

**Pattern:**
> *"The [unexpected thing] that [specific result]. (Page X / Module Y)"*

Specifications:
- Names a specific *thing* the product reveals
- Pairs it with a specific *outcome* the thing produces
- Locates it precisely (page, module, video timestamp) - locating it makes it feel real
- Does NOT reveal the thing itself

Examples:
- ✓ *"The 3-minute morning routine that generated more leads than my previous $3,000/month ad spend. (Module 4)"*
- ✓ *"The exact subject-line formula that pulled a 67% open rate from a list that hadn't seen me in 14 months. (Page 23)"*
- ✗ *"Discover proven strategies for success."* (no peek, no specificity, no curiosity gap)

### The Flip

Flips conventional wisdom. People are drawn to discovering they've been wrong - it implies that fixing the mistake will unlock results they've been missing.

**Pattern:**
> *"Why [common practice] is actually [costing/hurting] you - and what to do instead."*

Specifications:
- Names a *specific* common practice the reader believes in
- Reveals it's actively harmful (not just neutral)
- Promises the inverted approach (without revealing it)

Examples:
- ✓ *"Why 'posting consistently' is actually training the algorithm to IGNORE you - and the counterintuitive posting schedule that fixed my reach overnight."*
- ✓ *"Why following up '3-5 times' kills the deal instead of closing it - and the one-touch follow-up that closed 38% of my B2B prospects last quarter."*
- ✗ *"Avoid common mistakes."* (no specific practice, no inversion, no result)

### The Snapshot

A mini case study in one sentence. Each bullet is proof and curiosity compressed.

**Pattern:**
> *"How [name/description] used this to [specific measurable result] in [timeframe]."*

Specifications:
- Names a specific person (or vividly describes them)
- Names a specific result with a non-round number
- Names a specific timeframe
- Optionally: caveat ("with zero tech skills", "starting from scratch", "while working full-time") - the caveat is what makes it feel achievable for the reader

Examples:
- ✓ *"How a retired teacher from Austin used Module 2 to build a $4,200/month side income in her first 60 days - with zero tech skills and no existing audience."*
- ✓ *"How Mike - a plumber in Akron - went from 4 calls a week to 23 in 31 days, without spending a dollar on Facebook ads."*
- ✗ *"Real students see real results."* (no specificity, no proof, no curiosity)

### The Scar

You're showing a scar. Admitting a failure. This bullet type builds trust because the admitted-failure opening is disarming - and it signals *"I've paid the price so you don't have to."* Halbert ran this in the Boron Letters as the "I'm not a copywriter, I'm just some guy who…" opening; Hopkins ran the same structural move in *Scientific Advertising* as "I have nothing to gain by lying to you, and here's why I can prove this." Direct-response copywriters were shipping the Scar in print 80+ years before the modern psychology literature got around to writing it up.

**Pattern:**
> *"The one mistake that [dramatic consequence] - I made it myself in [year]."*

Specifications:
- First-person admission
- Specific past mistake (ideally with a year, location, or scenario)
- Specific dramatic consequence (numbers preferred)
- Promises the fix without revealing it

Examples:
- ✓ *"The pricing mistake I made in 2019 that cost me over $200K in revenue - and the dead-simple fix that took 10 minutes."*
- ✓ *"The 'helpful' onboarding email I sent for years that quietly killed my refund rate - until I deleted it on a hunch and watched refunds drop 41% overnight."*
- ✗ *"Learn from common pitfalls."* (no scar, no skin, no curiosity)

## Bullet Rules (non-negotiable)

1. **No bullet should sound like marketing.** Each should sound like something you'd say out loud to someone over coffee.
2. **Specificity over cleverness.** *"Page 14"* beats *"Inside you'll discover..."*. Numbers, names, modules, locations.
3. **Every bullet must create a curiosity gap that ONLY the product resolves.** If the reader can Google it, the bullet is dead.
4. **Mix all four types.** A block of same-type bullets gets monotonous - and monotony is friction.
5. **Each bullet stands alone.** A bullet that requires the previous bullet for context isn't earning its line.
6. **No fake specifics.** Made-up numbers, fabricated case studies, invented module pages - all destroy credibility on first reader inspection. Every Snapshot must be real.

## Workflow

### Step 1 - Inventory the actual contents

Do NOT generate bullets from imagination. Get the real list of:
- Modules / lessons / chapters (with their actual numbers)
- Templates / scripts / swipes the product contains
- Specific tactics / frameworks / formulas inside
- Real customer outcomes (for Snapshots)
- Real seller mistakes (for Scars)

If the user can't supply real contents, generate placeholder bullets but flag every one with `[VERIFY: real content needed]` so they don't ship until grounded.

### Step 2 - Map nerves to bullets

For each bullet, identify which nerve it hits - pulled from the Four Questions output. A reader looking at 12 bullets should feel *each one* hit a different nerve they recognize.

### Step 3 - Generate by type

Generate ~3 candidates per type:
- 3 Keyholes (specific reveals from real contents)
- 3 Flips (specific common-practice inversions)
- 3 Snapshots (specific real case studies - verify these are real)
- 3 Scars (specific seller mistakes from real history)

12 total candidates. Trim to the requested count after rhythm pass.

### Step 4 - Sequence for rhythm

Arrange the bullets so no two adjacent ones are the same type. A typical 12-bullet sequence:

```
1. Keyhole (open with curiosity)
2. Snapshot (immediate proof)
3. Flip (pattern interrupt)
4. Keyhole
5. Scar (vulnerability beat)
6. Snapshot
7. Keyhole
8. Flip
9. Snapshot
10. Scar
11. Keyhole
12. Snapshot (close on proof - leads into next section's Lock 2 Trust load)
```

The opener and closer of the bullet block matter most. Open with a Keyhole that hits the strongest nerve. Close with a Snapshot that proves the strongest result.

### Step 5 - Voice pass

Apply The Donahoe Voice Rules to every bullet:
- First-person ("I", "you" - never "we" or "the user")
- Contractions
- No marketing-speak ("leverage", "optimize", "revolutionary", "unlock")
- Specifics every line - numbers, names, dates

### Step 6 - Bullshit Filter

For each bullet, ask: would I say this out loud to a friend over coffee? If a bullet sounds like writing instead of talking, kill it and rewrite.

Then a final test: read the bullet block aloud, in sequence. If you stumble or rush past a bullet, that bullet is friction - rewrite or delete.

## Examples (Donahoe-style block, mixed)

```
- The 3-minute morning routine that generated more leads than my previous $3,000/month ad spend. (Module 4) [Keyhole]
- How a retired teacher from Austin built a $4,200/month side income in 60 days - with zero tech skills and no existing audience. [Snapshot]
- Why "posting consistently" is actually training the algorithm to IGNORE you - and the posting schedule that fixed my reach overnight. [Flip]
- The exact subject-line formula that pulled a 67% open rate from a list that hadn't seen me in 14 months. (Page 23) [Keyhole]
- The pricing mistake I made in 2019 that cost me over $200K - and the 10-minute fix. [Scar]
- How Mike, a plumber in Akron, went from 4 weekly calls to 23 in 31 days without spending a dollar on Facebook ads. [Snapshot]
- The "helpful" onboarding email I sent for years that quietly killed my refund rate - until I deleted it on a hunch and watched refunds drop 41% overnight. [Scar]
- Why following up "3-5 times" kills the deal instead of closing it - and the one-touch follow-up that closed 38% of my B2B prospects last quarter. [Flip]
- How Sarah, an interior designer in Austin, booked $32,000 in new contracts in 9 days using nothing but the Module 6 outreach script. [Snapshot]
- The 14-second voicemail format that triples callback rates - most coaches still teach the wrong version. (Module 7) [Keyhole]
- The pricing mistake I made in 2017 that I made AGAIN in 2020 because I forgot what 2017 taught me - and the system that finally killed it. [Scar]
- The 90-day case study where one student went from $0 to $11,400 in monthly recurring revenue using only what's in Module 2. [Snapshot]
```

Anti-pattern block (do NOT ship):
```
- Discover the secrets to success
- Learn proven strategies that work
- Get the tools you need to grow
- Unlock your true potential
- Take your business to the next level
- Master the art of marketing
```
Each line is generic, vague, marketing-speak, no curiosity gap, no specifics. Every bullet fails the Bullshit Filter on first read.

## Output template

```markdown
# Bullet Block - <Product / Section>

**Reader (one person):** <name + situation>
**Section context:** <what comes before / after>
**Block size:** <number> bullets
**Type mix:** Keyhole <n> / Flip <n> / Snapshot <n> / Scar <n>

---

## The bullets (sequenced for rhythm)

1. **[Keyhole]** <Bullet copy>
2. **[Snapshot]** <Bullet copy>
3. **[Flip]** <Bullet copy>
4. **[Keyhole]** <Bullet copy>
5. **[Scar]** <Bullet copy>
6. **[Snapshot]** <Bullet copy>
7. **[Keyhole]** <Bullet copy>
8. **[Flip]** <Bullet copy>
9. **[Snapshot]** <Bullet copy>
10. **[Scar]** <Bullet copy>
11. **[Keyhole]** <Bullet copy>
12. **[Snapshot]** <Bullet copy>

---

## Per-bullet breakdown

| # | Type | Nerve hit | Curiosity gap | Source content | Verified? |
|---|------|-----------|---------------|----------------|-----------|
| 1 | Keyhole | Wasted ad spend | What 3-min routine? | Module 4 | ✓ |
| 2 | Snapshot | "Can someone like me?" | What did teacher do? | Real student | ✓ |
| ... | | | | | |

---

## Rhythm check

**Adjacent-type collisions:** <0 - clean / N collisions - re-sequence>
**Open bullet:** Keyhole hitting <strongest nerve>
**Close bullet:** Snapshot proving <strongest result>

---

## Bullshit Filter

- [ ] Every bullet sounds spoken, not written
- [ ] Every bullet has specific numbers / names / dates / locations
- [ ] No marketing-speak ("leverage", "unlock", "discover", "proven", "revolutionary")
- [ ] Every Snapshot is from a real person (not invented)
- [ ] Every Scar is a real seller mistake (not invented)
- [ ] No two adjacent bullets are the same type
- [ ] Read aloud - none of them sound like a sales page from 2009
- [ ] Each bullet creates a gap only the product can close
```

## Notes

- Bullets are the highest-leverage block on a sales page. The bullet section often outperforms the headline in scroll-depth attention because skimmers read bullets even when they skip prose. Treat each bullet like a headline.
- The Snapshot is where most pages cheat. It's tempting to invent a Sarah-from-Austin case study to pad the block. Don't. One real Snapshot beats five fake ones, and one fake Snapshot caught by a reader collapses the entire asset's credibility.
- The Scar is the most undervalued type. Most copywriters skip it because admitting failure feels weak. It's the opposite - it's the strongest trust-builder per word in the Method. Always include 2-3 Scars in a 12-bullet block.
- For Cool-temperature audiences (still problem-aware, not solution-aware), lead Snapshot-heavy. They need to *meet* people who got the result before they'll believe it's possible for them.
- For Hot-temperature audiences (already on the fence about your offer specifically), lead Keyhole-heavy. They want to know what's *inside* - not whether it works.
- This skill composes with `convert-three-locks` (the bullet block re-anchors Lock 1 Want and deepens Lock 2 Trust), `convert-proof` (Snapshots are compressed Conversational Proof), and `convert-chute` (the bullet rhythm is part of the Greased Chute pacing).

## Lineage

The Donahoe Bullet System is part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:
- Bullet-as-fascination construction - *Sugarman fascination bullets, AdWeek Copywriting Handbook (1998)*
- Curiosity-gap mechanics - *Halbert's "blind bullets" canon, the Boron Letters (1984)*
- Magalog-format mixed bullet rhythms - *John Carlton, Kick-Ass Copywriting Secrets (2003)*
- The Scar / admitted-failure mechanic (primary lineage) - *Gary Halbert's "I'm not a copywriter, I'm just some guy who…" admitted-failure opening as direct-response credibility move (Boron Letters, 1984)* + *Claude Hopkins' "I have nothing to gain / here's why I can prove this" evidence-and-reason structure (Scientific Advertising, 1923)*. The direct-response Scar is older than psychology research on it; Halbert and Hopkins were running the mechanic in print decades before it had an academic frame.
- Secondary anchors (modern psychological context, not primary lineage) - *Robert Cialdini liking principle (Influence, 1984)* and *Brené Brown's vulnerability-as-trust-signal work (TED 2010 / Daring Greatly, 2012)*. Brown is downstream commentary on what direct-response copywriters had been shipping for 80+ years; cite as secondary, never as primary.
