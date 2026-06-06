---
name: convert-audit
slash_command: false
pack: business-conversion
family: conversion_audit
description: |
  Score existing direct-response copy against The Donahoe Method's 8 frameworks: Four-Layer Open, Conversational Proof, Three Locks, Bullet System, Cascade Close, Greased Chute, Voice Rules + Bullshit Filter, Market Temperature. Produces a 0-100 normalized score, dimension-by-dimension findings, and prioritized rewrite recommendations.
  Use when the user has existing copy (a sales page, VSL script, email, ad, opener) and wants a Method-grade audit with specific rewrite directions.
  Not for net-new copy generation (use /convert sales-page or /convert open) and not for live-URL CRO teardown (use /market landing).
triggers:
  - audit my copy
  - score my sales page
  - donahoe audit
  - method audit
  - audit this opener
  - score against the method
  - critique my copy
  - copy review against donahoe
  - is this copy good
negative_triggers:
  - write me new copy
  - generate a sales page
  - audit the page at this url
tags: [conversion, copy, audit, donahoe-method, scoring]
priority: 90
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-open, convert-proof, convert-three-locks, convert-bullets, convert-close, convert-chute, convert-voice, convert-bullshit-filter, convert-temperature, convert-package, convert-report]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system) - full 8-framework scoring rubric; no further lineage needed beyond the Method itself"
---

# Convert Audit - The Donahoe Method Audit

> *"Would I actually say this to someone I'm trying to help?"* - The Donahoe Method, Bullshit Filter

This skill takes existing copy and scores it against all eight frameworks of The Donahoe Method. The output is a defensible scoring rubric: each dimension graded 0-10, total normalized to 0-100, plus prioritized rewrite recommendations tied to the specific framework that failed.

## When to Use

Trigger phrases: "audit my copy", "score my sales page", "donahoe audit", "method audit", "audit this opener", "score against the method", "critique my copy", "copy review against donahoe", "is this copy good", `/convert audit <copy-or-path>`.

Use when:
- The user has existing copy and wants to know what's working / what's broken
- A draft has been written and needs a Method gate before shipping
- A page underperforms and the user wants the diagnosis (which lock is closed? which framework failed?)
- An audit is needed *before* a rewrite - to focus the rewrite on the right dimensions

Do NOT use for:
- Generating new copy from scratch - use `/convert sales-page`, `/convert open`, etc.
- Auditing a live URL's full conversion experience (page + funnel + traffic) - use `/market landing <url>`
- Auditing the offer construction itself - use `/funnel offer audit` (offer ≠ copy)
- Auditing visual design alone - use `/convert above-fold` for hero, `/convert proof-stack` for proof zones

## The 8 Frameworks (the Method, full)

This skill scores copy on the eight Method frameworks, plus the foundation (One Person Rule) and Voice Rules + Bullshit Filter. Eight scored dimensions; total 0-80; normalized to 0-100.

| # | Dimension | Framework source | Max |
|---|-----------|-------------------|-----|
| 1 | Open | Framework 1: The Four-Layer Open | 10 |
| 2 | Proof | Framework 2: Conversational Proof | 10 |
| 3 | Three Locks | Framework 3: The Three Locks | 10 (3 sub-scores) |
| 4 | Bullets | Framework 4: The Donahoe Bullet System | 10 |
| 5 | Close | Framework 5: The Cascade Close | 10 |
| 6 | Chute | Framework 6: The Greased Chute | 10 |
| 7 | Voice | Framework 7-equivalent: Voice Rules + Bullshit Filter | 10 |
| 8 | Temperature | Framework: Market Temperature | 10 |
| | **Total** | | **80** |

Normalized score = (raw / 80) × 100.

## Inputs

Required:
1. **The copy to audit** - pasted text, file path, or asset reference. Can be a full sales page, an opener, an email, an ad, a VSL script. Audit dimensions adapt to asset type (a 200-word email won't have a Cascade Close to score; that dimension becomes N/A and the rubric reweights).
2. **Asset type** - sales page / VSL / email / ad / opener / squeeze / OTO / lead-magnet / bridge
3. **Stated audience temperature** - what the user *says* their audience is (Ice Cold / Cool / Warm / Hot / Boiling). Dimension 8 scores whether the copy actually matches the stated temperature.

Optional:
- **Stated target reader** - the One Person the copy is supposed to be written to (informs Voice / Bullshit Filter scoring)
- **Stated offer** - what's being sold (informs Want / Excuse lock scoring)
- **Prior Method skill outputs** - if `/convert open`, `/convert proof`, etc. ran on this product, their output can be cross-checked against the copy
- `out_path` - caller-controlled output. Defaults via `build_report_path("business-conversion", instruction)`

## The Scoring Rubric (full, defensible)

### Dimension 1 - The Open (0-10)

Framework 1: The Four-Layer Open. Layer 1 Nerve Strike + Layer 2 Side Door + Layer 3 Skin in the Game + Layer 4 Fingerprint, in 3-5 sentences.

**Sub-scores (each 0-2.5; total 10):**

| Sub-score | What it measures | 0-2.5 scale |
|-----------|-------------------|-------------|
| Layer 1 - Nerve Strike | Specific, names a pain the reader already feels, no marketing-speak softeners | 0=absent or vague; 1=present but generic; 2=specific; 2.5=hits the nerve cold |
| Layer 2 - Side Door | Casual tone, "I noticed something" feel, no pitch announcement | 0=announces the pitch; 1=neutral; 2=casual; 2.5=defenses-down conversation |
| Layer 3 - Skin in the Game | Within first 3-4 sentences, reader knows why YOU're telling them | 0=absent or credential dump; 1=hinted; 2=present with specific detail; 2.5=earned through scar/specific story |
| Layer 4 - Fingerprint | Distinctive voice / opinion / image that's only-you | 0=swappable for any competitor; 1=mild voice; 2=clear voice; 2.5=unmistakable |

**Total Layer score = sum of 4 sub-scores (out of 10).**

Diagnostic moves:
- Look at sentences 1-5 only. Mark which layer each sentence serves.
- If any layer is missing, the score drops by 2.5 directly.
- If Layer 4 (Fingerprint) is missing, treat it as the most diagnostic failure - Fingerprint is what makes copy *this* author's, not generic.

### Dimension 2 - Conversational Proof (0-10)

Framework 2: claim → proof → claim → proof rhythm. 5 proof types covered.

**Sub-scores:**

| Sub-score | What it measures | 0-2 scale |
|-----------|-------------------|-----------|
| Proof rhythm | Every major claim within 2-3 sentences of a proof | 0=no rhythm; 1=sporadic; 2=consistent throughout |
| 5-types coverage | Of Anecdote / Receipt / Drive-By / Namecheck / Because, how many appear at least once | 0=≤1 type; 1=2-3 types; 2=4-5 types |
| Specificity | Numbers / dates / names / places (not "thousands of customers" - "1,847") | 0=vague; 1=mixed; 2=specific |
| Conversational delivery | Proof feels like conversation, not a "Testimonials" section labeled as such | 0=marketing block; 1=neutral; 2=conversational |
| Verifiability | Each proof item is real and checkable (no anonymous testimonials, no invented logos) | 0=fake/anonymous detected; 1=mostly real; 2=fully verifiable |

**Total = sum of 5 sub-scores (out of 10).**

### Dimension 3 - The Three Locks (0-10)

Framework 3: Want / Trust / Excuse. Each lock 0-3.33 (rounded; total 10).

**Sub-scores:**

| Sub-score | What it measures | 0-3.33 scale |
|-----------|-------------------|----------------|
| Lock 1 - The Want | Sells the *state*, not the product; sensory, visceral, specific | 0=feature-list; 1=generic outcome; 2=specific state; 3.33=visceral painted picture |
| Lock 2 - The Trust | Built through Conversational Proof + voice authority + mechanism reveal | 0=no proof / hedged voice; 1=some proof; 2=clear proof rhythm; 3.33=mechanism + voice + proof aligned |
| Lock 3 - The Excuse | Logical justification for the emotional decision; math, comparisons, risk reversal | 0=absent; 1=hinted; 2=present; 3.33=mathematical, undeniable |

**Total = sum of 3 sub-scores (out of 10), rounded.**

Diagnostic move: A page that "feels off" but reads competently almost always has one specific Lock closed. Identify which Lock scored lowest - that's the rewrite target.

### Dimension 4 - Bullet System (0-10)

Framework 4: Keyhole / Flip / Snapshot / Scar - mixed for rhythm.

**Sub-scores:**

| Sub-score | What it measures | 0-2.5 scale |
|-----------|-------------------|-------------|
| Type variety | Of the 4 bullet types, how many appear | 0=one type only; 1=2 types; 2=3 types; 2.5=all 4 mixed |
| Specificity | "Page 14" / "$14,327" / "Module 3" - not "Inside you'll discover..." | 0=vague throughout; 1=mixed; 2=mostly specific; 2.5=specific in every bullet |
| Curiosity gaps | Each bullet creates a gap only the product resolves | 0=feature-list; 1=mild gap; 2=clear gaps; 2.5=irresistible gaps |
| No-marketing-speak voice | Each bullet sounds spoken, not advertised | 0=full marketing-speak; 1=mixed; 2=mostly spoken; 2.5=conversational |

**Total = sum of 4 sub-scores (out of 10).**

### Dimension 5 - The Cascade Close (0-10)

Framework 5: Stack → Vision → Math → Safety Net → Door + P.S. + P.P.S.

**Sub-scores (each 0-2):**

| Sub-score | What it measures | 0-2 scale |
|-----------|-------------------|-----------|
| Stack | Conversational value summary (not formal value-table inflation) | 0=formal/inflated; 1=present; 2=conversational |
| Vision Close | Paints the desired state at the close | 0=absent; 1=present; 2=specific & visceral |
| Math Close | Logical / arithmetic justification | 0=absent; 1=present; 2=undeniable math |
| Safety Net | Strong, specific guarantee | 0=absent or weak; 1=present; 2=so-strong-it's-almost-absurd |
| Door + P.S. / P.P.S. | Direct CTA + at least one P.S. + ideally P.P.S. | 0=no clear CTA / no P.S.; 1=CTA present, no P.S.; 2=full cascade including P.S. + P.P.S. |

**Total = sum of 5 sub-scores (out of 10).**

For asset types where the Cascade doesn't apply in full (short emails, ads, openers as standalone), score the closes that should be present and reweight. Note the reweight in the output.

### Dimension 6 - The Greased Chute (0-10)

Framework 6: paragraph rhythm + open loops + transitions + read-aloud test.

**Sub-scores:**

| Sub-score | What it measures | 0-2.5 scale |
|-----------|-------------------|-------------|
| Paragraph rhythm | 1-3 sentence paragraphs predominantly; varied sentence length | 0=walls of text; 1=some short; 2=mostly short + varied; 2.5=engineered rhythm |
| Open loops | Section endings tease, never conclude; threads pulled forward | 0=conclusions everywhere; 1=some teases; 2=most sections tease; 2.5=loops stack and resolve |
| Transitions | Use of Donahoe Transition System moves; no "here's the thing" filler | 0=clunky / filler; 1=neutral; 2=movement-driven; 2.5=transition arsenal deployed |
| Read-aloud naturalness | If read at speaking pace, no stumbles, no energy drops | 0=stumbles often; 1=some stumbles; 2=mostly natural; 2.5=fluid throughout |

**Total = sum of 4 sub-scores (out of 10).**

Diagnostic move: read aloud at speaking pace. Mark every place you stumbled, paused, or felt energy drop. Each marked spot is a Chute failure.

### Dimension 7 - Voice Rules + Bullshit Filter (0-10)

Framework: Donahoe Voice Rules (sentence mechanics + word choices + structural moves) + the Bullshit Filter.

**Sub-scores:**

| Sub-score | What it measures | 0-2 scale |
|-----------|-------------------|-----------|
| First-person + contractions | "I", "you", "you're", "don't" - not "we" / "customers" / "do not" | 0=corporate voice; 1=mixed; 2=consistently first-person + contracted |
| Specificity > generality | Numbers, names, dates, places - not abstractions | 0=abstract throughout; 1=mixed; 2=concrete throughout |
| Banned-word check | No "leverage", "optimize", "revolutionary", "unlock potential", "game-changing", "next level" | 0=multiple banned words; 1=1-2 hits; 2=clean |
| Visceral > abstract | "Stomach-churning" / "wake up and check your phone" / "cash hitting your account" | 0=abstract; 1=mixed; 2=visceral throughout |
| Bullshit Filter | Would you say this out loud to someone you're trying to help? | 0=fails (sounds like writing); 1=mixed; 2=passes (sounds like talking) |

**Total = sum of 5 sub-scores (out of 10).**

Banned-phrase Wayland TM grep: also flag any of these (zero hits required for a clean ship; deduct 1 point per hit, max -5):

```
"Perfect Webinar", "One Funnel Away", "ClickFunnels",
"Product Launch Formula", " PLF ", "Sideways Sales Letter",
"Grand Slam Offer", "$100M Offers", "$100M Leads",
"No B.S.", "Magnetic Marketing", "Don't Make Me Think",
"Mass Control", "DotCom Secrets", "Expert Secrets",
"Traffic Secrets", "Soap Opera Sequence", "Seinfeld Email"
```

### Dimension 8 - Market Temperature Match (0-10)

Framework: Market Temperature. Does the copy match the stated audience temperature?

**Sub-scores:**

| Sub-score | What it measures | 0-2.5 scale |
|-----------|-------------------|-------------|
| Length match | Ice Cold = long-form education; Boiling = short reminder. Length aligns with stated temp. | 0=wildly mismatched; 1=mild mismatch; 2=close; 2.5=ideal |
| Awareness assumption | Copy assumes the right level of awareness (Ice Cold = no problem awareness; Hot = product awareness) | 0=wrong assumption; 1=neutral; 2=mostly right; 2.5=perfectly calibrated |
| Tone match | Cold = pattern interrupt + education; Hot = persuasion + urgency; Boiling = reminder | 0=mismatched; 1=mild; 2=mostly matched; 2.5=ideal |
| Pitch placement | Cold = pitch buried late; Hot = pitch early; Boiling = pitch immediately | 0=wrong placement; 1=mild; 2=correct; 2.5=ideal |

**Total = sum of 4 sub-scores (out of 10).**

The most common failure: hot copy written for a cold audience (the #1 marketing mistake per the Method's Temperature framework).

## The 0-100 Normalized Score

```
raw_total = D1 + D2 + D3 + D4 + D5 + D6 + D7 + D8     # max 80
banned_penalty = sum of TM-banned-phrase hits, capped at 5
normalized = max(0, ((raw_total - banned_penalty) / 80) * 100)
```

**Score bands:**

| Band | Score | Interpretation |
|------|-------|----------------|
| Method-grade | 85-100 | Ship it. Minor polish only. |
| Strong | 70-84 | One or two dimensions need surgical rework. |
| Mid | 55-69 | Multiple dimensions weak; targeted rewrite required. |
| Weak | 40-54 | Method scaffolding mostly missing; substantial rewrite. |
| Off-method | 0-39 | This isn't Method copy. Treat as a brief and rerun the writing skills. |

## Workflow

### Step 1 - Ingest the copy

Receive the copy via paste, file path, or reference. Confirm:
- Asset type (informs which dimensions apply / N/A)
- Stated audience temperature
- Stated target reader (if available)
- Stated offer (if available)

If asset type is "opener only" or "email" or "ad," some dimensions (Cascade Close, full Chute) get reweighted or marked N/A. Note the reweight in the output.

### Step 2 - Score Dimension 1 (Open)

Read the first 3-5 sentences. Mark each sentence with its layer. Assign sub-scores. Justify each in one sentence.

### Step 3 - Score Dimension 2 (Proof)

Walk every claim. Check for proof within 2-3 sentences. Catalog the proof types used. Spot-check verifiability.

### Step 4 - Score Dimension 3 (Three Locks)

Identify which sentences open the Want, which build Trust, which deliver the Excuse. Score each lock independently.

### Step 5 - Score Dimension 4 (Bullets)

Find every bullet block. Classify each bullet by type (Keyhole / Flip / Snapshot / Scar). Score variety, specificity, curiosity, voice.

### Step 6 - Score Dimension 5 (Close)

Find each cascade layer. Score what's present, what's missing, what's strong / weak.

### Step 7 - Score Dimension 6 (Chute)

Read aloud at speaking pace (mentally simulate). Mark stumbles, energy drops, walls of text, conclusion-endings. Score paragraph rhythm + loops + transitions + naturalness.

### Step 8 - Score Dimension 7 (Voice + Bullshit Filter)

Grep for banned words. Check first-person + contractions. Check specificity. Run the Bullshit Filter mental check on representative passages. Apply TM-banned-phrase penalty.

### Step 9 - Score Dimension 8 (Temperature)

Cross-check the copy's length, awareness assumption, tone, and pitch placement against the stated audience temperature.

### Step 10 - Compute totals + prioritize fixes

Sum dimensions. Apply banned penalty. Normalize to 0-100. Identify the lowest-scoring dimensions; those drive the rewrite recommendations. Order recommendations by impact (which dimension would lift the score most if fixed?).

### Step 11 - Emit the audit report

## Output Template

```markdown
# Donahoe Method Audit: <Asset name / topic>

**Asset type:** <sales page / VSL / email / ad / opener / etc.>
**Stated audience temperature:** <Ice Cold / Cool / Warm / Hot / Boiling>
**Stated target reader:** <one specific person, if provided>
**Stated offer:** <if provided>

---

## Headline score

**Total: X / 100** - <Method-grade / Strong / Mid / Weak / Off-method / FILTER-FAILED>

| Dimension | Score | Of |
|-----------|-------|-----|
| 1. Open (Four-Layer) | X.X | 10 |
| 2. Proof (Conversational + 5 types) | X.X | 10 |
| 3. Three Locks (Want / Trust / Excuse) | X.X | 10 |
| 4. Bullets (Keyhole / Flip / Snapshot / Scar) | X.X | 10 |
| 5. Close (Cascade) | X.X | 10 |
| 6. Chute (Greased Chute) | X.X | 10 |
| 7. Voice + Bullshit Filter | X.X | 10 |
| 8. Temperature match | X.X | 10 |
| **Raw subtotal** | **X.X** | **80** |
| TM banned-phrase penalty | -X | -5 max |
| **Normalized** | **X / 100** | |

### Bullshit Filter HARD-GATE OVERRIDE (mandatory, applied AFTER normalization)

The Donahoe Method spec calls the Bullshit Filter *"the single most important question in the Method."* Without this override the rubric allows copy to score 97/100 while failing the Filter - which violates the spec.

**Rule:** if the Bullshit Filter sub-score within Dimension 7 is **0 (FAIL)**, cap the normalized score at **39 / 100** regardless of other dimension scores, and stamp the verdict **FILTER-FAILED - do NOT ship this copy until the Bullshit Filter passes.**

| Bullshit Filter sub-score | Action |
|---------------------------|--------|
| 0 (FAIL - sounds like writing, not talking) | Cap normalized score at 39/100. Tag verdict **FILTER-FAILED**. Refuse to proceed to fix-priority output until copy passes the Filter. |
| 1 (MIXED - some lines fail) | No cap. Flag as **FILTER-WARNING**. Output must include the worst 3 lines + 3 forced rewrites for each. |
| 2 (PASS - sounds like talking) | No cap. Score normally. |

Why: a beautifully-structured AI-flavored sales letter (high Open / Locks / Bullets / Close scores) but failing the Filter is *worse than a structurally weak human-written piece that passes the Filter.* The Filter is the gate to which no other dimension is allowed to be a substitute. This override aligns the rubric with the Method spec.

**The Filter sub-score must be a separate human/coach pass.** The audit skill itself cannot grade the Filter on its own copy - see `convert-bullshit-filter` for the adversarial coaching pass that produces the Filter sub-score.

---

## Dimension-by-dimension findings

### Dimension 1 - Open (X / 10)

- Layer 1 Nerve Strike (X / 2.5): <evidence + verdict>
- Layer 2 Side Door (X / 2.5): <evidence + verdict>
- Layer 3 Skin in Game (X / 2.5): <evidence + verdict>
- Layer 4 Fingerprint (X / 2.5): <evidence + verdict>

**What's working:** <specific>
**What's broken:** <specific>
**Top fix:** <action>

### Dimension 2 - Proof (X / 10)

- Proof rhythm (X / 2): <verdict>
- 5-types coverage (X / 2): <which types appear / missing>
- Specificity (X / 2): <verdict + examples>
- Conversational delivery (X / 2): <verdict>
- Verifiability (X / 2): <flagged anonymous / fake items>

**What's working:** <specific>
**What's broken:** <specific>
**Top fix:** <action>

### Dimension 3 - Three Locks (X / 10)

- Lock 1 The Want (X / 3.33): <verdict>
- Lock 2 The Trust (X / 3.33): <verdict>
- Lock 3 The Excuse (X / 3.33): <verdict>

**Closed lock:** <which lock failed; this is the diagnostic priority>
**Top fix:** <action>

### Dimension 4 - Bullets (X / 10)

- Type variety (X / 2.5): <which types present / missing>
- Specificity (X / 2.5): <evidence>
- Curiosity gaps (X / 2.5): <evidence>
- Voice (X / 2.5): <evidence>

**What's working:** <specific>
**What's broken:** <specific>
**Top fix:** <action>

### Dimension 5 - Close (X / 10)

- Stack (X / 2): <verdict>
- Vision Close (X / 2): <verdict>
- Math Close (X / 2): <verdict>
- Safety Net (X / 2): <verdict>
- Door + P.S. + P.P.S. (X / 2): <verdict>

**Missing layers:** <list>
**Top fix:** <action>

### Dimension 6 - Chute (X / 10)

- Paragraph rhythm (X / 2.5): <verdict>
- Open loops at section endings (X / 2.5): <verdict>
- Transitions (X / 2.5): <verdict - mention any "here's the thing" filler>
- Read-aloud naturalness (X / 2.5): <verdict + flagged stumbles>

**Stumble points:** <list of specific lines>
**Top fix:** <action>

### Dimension 7 - Voice + Bullshit Filter (X / 10)

- First-person + contractions (X / 2): <verdict>
- Specificity (X / 2): <verdict>
- Banned-word grep (X / 2): <hits if any>
- Visceral language (X / 2): <verdict>
- Bullshit Filter pass (X / 2): <verdict>

**Banned-word hits:** <list, e.g., "leverage" appears 4 times>
**TM banned-phrase hits (penalty):** <list>
**Top fix:** <action>

### Dimension 8 - Temperature match (X / 10)

- Length match (X / 2.5): <verdict - copy is too long/short for stated temp?>
- Awareness assumption (X / 2.5): <verdict>
- Tone match (X / 2.5): <verdict>
- Pitch placement (X / 2.5): <verdict>

**Diagnosis:** <hot-copy-cold-audience? cold-copy-hot-audience? matched?>
**Top fix:** <action>

---

## Prioritized rewrite recommendations

Ordered by impact (which fix moves the score most):

### 1. <Highest-impact fix>
- **Dimension affected:** <which one>
- **Current score lift potential:** <X → Y>
- **Specific action:** <concrete rewrite direction>
- **Sub-skill to deploy:** `/convert <skill>`

### 2. <Second-highest fix>
... (3-5 total recommendations)

---

## Method audit footer

```
Method audit:
  Open: <verdict per layer>
  Locks: <Want ✓/✗  Trust ✓/✗  Excuse ✓/✗>
  Close: <Stack ✓/✗  Vision ✓/✗  Math ✓/✗  Safety Net ✓/✗  Door ✓/✗  P.S. ✓/✗  P.P.S. ✓/✗>
  Bullets: <types present>
  Chute: <verdict>
  Voice: <first-person ✓/✗  contractions ✓/✗  no marketing-speak ✓/✗>
  Bullshit Filter: <PASS / FAIL>
  Temperature: <stated <temp> - copy <matches/mismatches>>
```

---

## Recommended next moves

- If score < 70: rerun the writing skills most affected. Examples:
  - Dim 1 < 6 → `/convert open` regenerate
  - Dim 3 (Lock 2) < 5 → `/convert proof` regenerate + `/convert three-locks` rebalance
  - Dim 5 < 5 → `/convert close` rebuild Cascade
  - Dim 6 < 5 → `/convert chute` engineer momentum + `/convert transition` rewrite section breaks
  - Dim 8 < 5 → `/convert temperature` reclassify and reframe
- If score 70-84: surgical rewrites on the lowest 1-2 dimensions only; re-audit.
- If score 85+: ship it. Run `/convert audit` again post-launch on any further iteration.
```

## Pitfalls

- **Scoring without context.** Rate-of-conversion problems often live in the *offer*, not the copy. If the offer is weak, even Method-grade copy will underperform. Note the boundary: this skill audits *copy*, not *offer construction*. Refer to `/funnel offer audit` when offer issues are suspected.
- **Asset-type mismatch.** A 200-word email cannot have a full Cascade Close. Don't deduct points for what doesn't apply; mark N/A and reweight transparently.
- **Banned-phrase false flags.** Some banned phrases appear in canon references for legitimate pedagogy reasons; the banned list is for *user-facing copy*, not internal lineage notes. The audit deducts only for hits in the audited copy's user-facing text - quotations of the list itself do not trigger the penalty.
- **Subjective drift on Fingerprint.** Layer 4 is the most subjective sub-score. Anchor it: would this paragraph read identical with the byline swapped to a competitor? If yes, low score.
- **Anchoring on a single read.** Read the copy twice - once for content, once aloud at speaking pace. The second read catches Chute failures the first misses.
- **Confirmation bias.** If the user clearly loves their copy, the temptation is to score generously. Resist. The audit's value is calibration; soft scores produce shipped weak copy.
- **Length-biased scoring.** A short, sharp page can score 90+ if the Method elements that *apply* are sharp. Don't penalize brevity on asset types where brevity is correct (Boiling-temp pages, follow-up emails).
- **Treating the rubric as the product.** The recommendations matter more than the score. Lead with the prioritized fix list; the score is the diagnostic anchor.

## Lineage

This audit is built entirely on **The Donahoe Method** (Wayland-owned operating system). All eight dimensions trace directly to the Method's eight frameworks plus the foundation (One Person Rule), Voice Rules, and Bullshit Filter. No external lineage required beyond the Method itself.

Source document: `.planning/research/conversion-pack-2026-05-03/the-donahoe-method.md`.

## Notes

- This skill produces a *defensible* score. Each sub-score has explicit criteria; each dimension has a documented sub-score breakdown. Reproducibility is high if the rubric is followed.
- The rubric is *gradable by an external auditor* - meaning a second pass of `/convert audit` on the same copy (different session) should produce a score within ~5 points if the rubric is followed faithfully.
- The audit is upstream of `/convert package`'s phase 5 and feeds `/convert report` for client-ready aggregation.
- The TM banned-phrase grep is non-negotiable. Any hit in the audited copy's user-facing text triggers the penalty.
- The audit can be applied iteratively: audit → rewrite → re-audit. Treat scores climbing 5-10 points per iteration as healthy progress.
- The score is a diagnostic anchor, not a verdict. The prioritized fix list is the actual deliverable.
