---
name: convert-proof
slash_command: false
pack: business-conversion
family: donahoe_method
description: |
  Apply Conversational Proof to any claim: claim → evidence → reason → move-on pattern, with a library of 5 proof types (Anecdote, Receipt, Drive-By, Namecheck, Because). Outputs proof-blocks woven through copy, never an isolated proof section.
  Use when a draft makes claims that need to be believed and you want proof that reads like conversation, not a credentials wall.
  Not for designing testimonial graphics (use convert-proof-stack) and not for sourcing testimonials (that's a research task, not a copy task).
triggers:
  - add proof to this
  - conversational proof
  - donahoe proof
  - prove this claim
  - back this up
  - testimonial as conversation
  - drop the receipts
  - skin the claim
negative_triggers:
  - design testimonial layout
  - testimonial visual stack
  - find me testimonials
  - audit my proof section
tags: [conversion, copy, donahoe-method, conversational-proof, proof, evidence]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-open, convert-three-locks, convert-bullets, convert-close, convert-voice, convert-proof-stack]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references *Aristotle's three appeals - ethos, pathos, logos (Rhetoric, ~350 BCE)*, *Cialdini social proof (Influence, 1984)*, and *Halbert specificity-as-credibility canon (Boron Letters, 1984)*"
---

# Convert Proof - Conversational Proof

> *"Proof in Donahoe copy never announces itself. It doesn't feel like 'evidence.' It feels like conversation - like you're just telling them what happened, what you saw, what the numbers said."* - The Donahoe Method, Framework 2

This skill turns claims into believable, conversational proof using the four-step pattern (claim → evidence → reason → move on) and the five-type proof library (Anecdote, Receipt, Drive-By, Namecheck, Because).

The output is proof woven through copy - not a "proof section" with a logo bar.

## When to Use

Trigger phrases: "add proof to this", "conversational proof", "donahoe proof", "prove this claim", "back this up", "testimonial as conversation", "drop the receipts", "skin the claim", `/convert proof <claim or section>`.

Use whenever copy contains a claim that needs to be believed but currently reads as assertion. Works at any granularity - a single sentence, a single bullet, a section, or a full draft.

Do NOT use for:
- Designing the visual proof layout (logo bars, video grids, stat blocks) - that's `convert-proof-stack`
- Sourcing testimonials from customers (research task, not copy task)
- Auditing existing proof for Method-fit (use `convert-audit`)
- Generating bullets from scratch (use `convert-bullets` - though they import proof patterns)

## Inputs

Required:
1. **The claim(s)** - what does the copy assert that needs to be believed? "This system generates leads while you sleep." / "Most copywriting courses are wasting your time." / "I made $14k in 11 days." Each claim becomes a proof unit.
2. **Available evidence** - anecdotes (real customer stories), receipts (numbers, dates, screenshots), credentials (resume items the seller has), names (people willing to be quoted), mechanisms (the *why* behind the result).

Optional:
- **Asset type** and where the claim sits in the flow - affects which proof type leads
- **Temperature** of the reader (from `convert-temperature`) - Cool audiences need Because-heavy proof; Boiling audiences need single Receipt
- **Existing voice samples** - match tone
- `out_path` - caller-controlled output. Defaults via `build_report_path`.

## The Pattern (full method)

Every proof unit moves through four steps:

### 1. Make the claim - casually, like it's obvious

Don't announce the proof is coming. Just state the thing.

> *"This system generates leads while you sleep."*

The casualness IS part of the proof. Confidence comes from people who don't need to prep you for the claim.

### 2. Drop the evidence - wrapped in story or specific detail

Never a credential dump. Never a formal "proof section." The evidence comes through naturally, in the form a friend would tell another friend.

> *"Mike - a plumber from Ohio who'd never run an online ad in his life - set this up on a Thursday and woke up Saturday to 47 leads in his inbox. He actually called me because he thought something was broken."*

The evidence works because of the specificity (Mike, Ohio, plumber, Thursday→Saturday, 47, called me, thought it was broken). Each detail is a fingerprint of truth.

### 3. Give the reason - explain WHY this result is possible

People need the logic to justify the emotional decision they've already made. Give them the argument they'll use when someone asks *"why did you buy that?"*

> *"It works because the targeting is built on actual purchase behavior, not the interest-based nonsense that most platforms default to."*

The Reason makes the result feel logical, not miraculous. Skipping the Reason is why miracle-result copy reads as scammy even when the results are real.

### 4. Move on - don't oversell the proof

State it and keep going. Confidence means not needing to hammer the point.

> *"But the leads are actually the easy part. What matters is what happens next..."*

The move-on doubles as a transition into the next section - chute momentum (see `convert-chute`).

## The Five Types of Proof (priority order)

### 1. The Anecdote

The most natural proof in conversation. Nobody tells their friends *"studies show."* They say *"my buddy tried this and..."* Stories are how humans have transferred credible information for thousands of years.

Specifications:
- A specific person (named or vividly described)
- A specific moment in time
- A specific outcome
- A small detail that makes it feel real (the thing they did wrong, the moment they realized, the thing they said)

Example:
> *"Mike - a plumber from Ohio who'd never run an online ad in his life - set this up on a Thursday and woke up Saturday to 47 leads in his inbox. He actually called me because he thought something was broken."*

### 2. The Receipt

Numbers. Dates. Exact amounts. **Specificity IS credibility.** Not *"I made money"* but *"I pulled $14,327 in 11 days from a list of 2,200 people."* The reader's brain automatically does the math - and specific numbers feel true in a way that round numbers never do.

Specifications:
- Non-round numbers ($14,327 not $15,000)
- Real dates or durations (11 days, last March, Q2)
- Counts, not estimates (2,200 not "thousands")
- Optionally: source ("from the campaign dashboard, screenshot below")

Example:
> *"I pulled $14,327 in 11 days from a list of 2,200 people - most of whom hadn't bought from me in over a year."*

### 3. The Drive-By

Your credentials mentioned in passing, never announced. *"...which I figured out after running campaigns for about 15 years"* hits ten times harder than a bio block that says *"With 15 years of industry experience."*

The Drive-By works because it signals you don't NEED the credential to prop you up. You just have it.

Specifications:
- Slipped into a sentence with another purpose
- Never the *headline* of a sentence - always the supporting clause
- Casual phrasing ("I've been doing this since 2008", not "industry veteran since 2008")

Example:
> *"...which is the same hypothesis I tested at my last agency, where we ran about $40 million in spend across e-comm clients between 2017 and 2022."*

### 4. The Namecheck

Social proof delivered as conversation, not as a testimonial block. *"A guy named Mike sent me an email last week saying..."* - conversational, real, human. Not a formatted quote box with a stock photo.

Specifications:
- Named or vividly described person
- Quoted as if you're recounting them, not displaying them
- Reads like conversation, not a customer reference card

Example:
> *"Sarah - runs an interior design studio in Austin - wrote me last Tuesday: 'I had to read your email three times because I thought it was a typo. We booked $32,000 in new design contracts in nine days.'"*

### 5. The Because

The logical explanation that makes the mechanism believable. People need the logic to justify the emotional decision.

Specifications:
- Names the *mechanism*, not the benefit
- One concrete reason, not three vague ones
- Often introduced with "because", "the reason is", "what this means is"

Example:
> *"The reason this works is the targeting is keyed off actual purchase behavior - not the interest-based proxies that 90% of media buyers default to."*

## The Proof Rhythm

Proof in Donahoe copy isn't isolated to a "proof section." It's woven throughout. Every major claim gets at least one layer of proof within 2-3 sentences.

```
Claim → proof → claim → proof → claim → proof
```

The rhythm builds until the reader stops questioning and starts nodding.

## Workflow

### Step 1 - Inventory the claims

Read the draft (or the brief) and list every claim that needs to be believed. Examples:
- "This system generates leads while you sleep."
- "Most copywriting courses waste your time."
- "I made $14k in 11 days."
- "It works for service businesses, not just info marketers."

Each claim is a proof target.

### Step 2 - Inventory available evidence

For each claim, what do we have?
- Anecdote available? (Specific person, specific moment, specific outcome)
- Receipt available? (Real numbers, dates, screenshots)
- Drive-By available? (A credential the seller can drop in passing)
- Namecheck available? (A real person willing to be quoted)
- Because available? (The mechanism explanation)

### Step 3 - Match proof type to claim

Use the priority order: Anecdote first if available - it's the most conversational and lowest-friction. Layer in Receipt for hard numbers. Drop Drive-By when establishing seller authority on a section break. Use Namecheck for social proof. Use Because to explain mechanism whenever the result might feel miraculous.

A claim should usually get one type, sometimes two. Three or more types on the same claim feels like overselling.

### Step 4 - Write the proof unit (4-step pattern)

For each claim:
1. State it casually
2. Drop the evidence (Anecdote / Receipt / Drive-By / Namecheck)
3. Give the reason (Because)
4. Move on (transition forward)

### Step 5 - Apply the rhythm

Across the full asset, vary which proof type leads. Two Anecdotes back-to-back blur together. Anecdote → Receipt → Anecdote → Namecheck creates rhythm.

### Step 6 - Bullshit Filter

Read every proof unit aloud. Does it sound like writing or like talking? Anything that smells like a "proof section" or a logo wall fails - rewrite as conversation.

## Examples (good vs anti-pattern)

### Claim: "This system generates leads while you sleep."

**Donahoe-style proof unit:**
> *"This system generates leads while you sleep. Mike - a plumber from Ohio who'd never run an online ad in his life - set it up on a Thursday and woke up Saturday morning to 47 leads in his inbox. He actually called me because he thought something was broken. It works because the targeting is built on actual purchase behavior, not the interest-based nonsense that most platforms default to. But the leads are actually the easy part. What matters is what happens next..."*

**Anti-pattern (announces itself, performs evidence):**
> *"This system generates leads while you sleep. Don't take our word for it - see the testimonials below from our amazing community of successful entrepreneurs. With proven results across multiple industries, our methodology delivers consistent outcomes for those who put in the work."*

### Claim: "I made $14k in 11 days."

**Donahoe-style:**
> *"I pulled $14,327 in 11 days from a list of 2,200 people - most of whom hadn't bought from me in over a year. The numbers came in mostly on day three and day eight, and the rest trickled in around the close. The reason it worked has nothing to do with the offer itself - it's because the sequence assumed they'd already decided, instead of trying to convince them. That's the part nobody teaches. Anyway -"*

**Anti-pattern:**
> *"My proven email marketing strategy has helped me generate over $14,000 in just 11 days. With my expert techniques, you too can unlock the power of email marketing."*

## Output template

```markdown
# Conversational Proof - <Asset / Section / Claim>

**Claims being proved:** <list>
**Reader temperature (from convert-temperature):** <Ice Cold / Cool / Warm / Hot / Boiling>
**Available evidence inventory:**
- Anecdotes: <list>
- Receipts: <list>
- Drive-Bys: <list>
- Namechecks: <list>
- Becauses: <list>

---

## Proof Unit 1 - Claim: "<the claim>"

**Type used:** <Anecdote / Receipt / Drive-By / Namecheck / Because - usually 1-2>

> <Full proof unit, 3-5 sentences, written exactly as it would appear in copy. Includes claim → evidence → reason → move-on.>

**Why this proof type for this claim:** <one-line reason>
**Move-on transition:** "<the sentence that hands off to next section>"

---

## Proof Unit 2 - Claim: "<the next claim>"

(same structure)

---

## Proof Rhythm Check

| Unit | Claim | Type | Lead detail |
|------|-------|------|-------------|
| 1 | <claim> | Anecdote | <Mike, Ohio plumber> |
| 2 | <claim> | Receipt | <$14,327 / 11 days> |
| 3 | <claim> | Because | <mechanism: purchase-behavior targeting> |
| 4 | <claim> | Namecheck | <Sarah, Austin designer> |

**Rhythm verdict:** <varied - no two adjacent same-type / monotone - break up>

---

## Bullshit Filter
- [ ] Each unit reads as conversation, not as evidence display
- [ ] Each unit has the full 4-step pattern (claim → evidence → reason → move-on)
- [ ] No proof unit oversells with 3+ stacked types
- [ ] No "as our customers have said" connector phrases
- [ ] Every Receipt is non-round and specific
- [ ] Every Anecdote has a named or vivid person + specific moment + specific outcome
- [ ] Reads aloud naturally
```

## Notes

- The four-step pattern (claim → evidence → reason → move-on) is the structural core. Skipping any step weakens the proof. Skipping the move-on is the most common error - writers oversell because they don't trust the proof.
- For Boiling-temperature audiences, compress to claim → single Receipt → move-on. They've already bought-in; over-proving feels condescending.
- For Ice Cold audiences, lead with Anecdote - they need to *meet* a person who had the problem before they'll accept they have it. Receipts on Ice Cold lands as cold and clinical.
- The Namecheck has a special trust-cost: if the named person turns out not to be real, or if the quote is fabricated, the entire asset's credibility collapses. Only use real Namechecks. If you don't have one, use Anecdote with vivid description instead.
- This skill composes with `convert-bullets` (Snapshot bullets ARE compressed Anecdotes), `convert-three-locks` (Trust lock is built almost entirely from proof units), and `convert-close` (the Math Close uses a Because to justify the price, the Safety Net uses a Receipt to back the guarantee).

## Lineage

Conversational Proof is part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:
- Three-appeals architecture (claim/evidence/reason ≈ logos / ethos / pathos) - *Aristotle's Rhetoric (~350 BCE)*
- Social proof as a persuasion class - *Cialdini, Influence (1984)*
- Specificity-as-credibility doctrine - *Halbert, the Boron Letters (1984)*
- Story-as-evidence transfer - *Sugarman triggers, AdWeek Copywriting Handbook (1998)*
- Mechanism-justification (the Because) - *Langer photocopier study, 1978*
