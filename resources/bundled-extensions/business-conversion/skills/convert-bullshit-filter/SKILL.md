---
name: convert-bullshit-filter
slash_command: false
pack: business-conversion
family: donahoe_diagnostic
description: |
  Coach a draft toward voice integrity - quotes the 3 weakest lines from the input draft, forces 3 alternative rewrites of each, diagnoses the dominant voice failure pattern, and returns a coaching artifact (no PASS / FAIL verdict).
  Use when running a final coaching pass on copy before shipping - sales pages, VSL scripts, emails, ads, headlines.
  Not for full Voice Rules pass (use convert-voice - Bullshit Filter is one rule of many in Voice; this is the deeper standalone coaching pass) and not for Method audit scoring (use convert-audit).
triggers:
  - bullshit filter
  - run the filter
  - donahoe filter
  - would i say this to a friend
  - read aloud test
  - kill anything that sounds fake
  - final voice gate
  - last pass before shipping
  - find the weakest lines
  - rewrite the worst sentences
negative_triggers:
  - score my page
  - method audit (use convert-audit)
  - rewrite from scratch
  - design the offer
tags: [conversion, copy, donahoe-method, bullshit-filter, diagnostic, voice]
priority: 100
version: 2.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-voice, convert-fingerprint, convert-chute, convert-audit, convert-sales-page, convert-vsl]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references *Halbert plain-spoken canon (Boron Letters, 1984)*, *Ogilvy 'never write what you wouldn't say' (Confessions of an Advertising Man, 1963)*, and *Orwell's six rules of plain English ('Politics and the English Language', 1946)*"
---

# Convert Bullshit Filter - The Adversarial Coaching Pass

> *"Would I actually say this to someone I'm trying to help?"* - The Donahoe Method, Voice Rules

The Bullshit Filter is one question. It's also the single most important question in the Method.

This skill runs the Filter as an **adversarial coaching pass** - not a verdict. It refuses to grade copy as "passed" or "failed." Instead, it forces three concrete actions on every draft:

1. **Quote the 3 weakest lines** in the draft, even if the draft seems strong. There is always a worst sentence; this skill identifies it.
2. **Produce 3 alternative rewrites** of each weakest line, so the writer sees the actual menu of voicing choices instead of accepting an AI's first take.
3. **Diagnose the dominant voice failure pattern** in one paragraph (e.g., softeners, marketing-speak, abstract language, hedged claims, performative urgency).

The output is a **coaching artifact**. The user decides whether to ship after seeing the 3 weakest lines + 9 rewrites + the diagnosis. There is no PASSED, no FAILED, no boolean stamp. AI cannot grade its own work; this skill stops trying.

## When to Use

Trigger phrases: "bullshit filter", "run the filter", "donahoe filter", "would I say this to a friend", "read aloud test", "kill anything that sounds fake", "final voice gate", "last pass before shipping", "find the weakest lines", "rewrite the worst sentences", `/convert bullshit-filter <draft>`.

Use this skill as the **last coaching pass** before shipping. Run it AFTER:
- `convert-open` has produced the open
- `convert-three-locks` has architected the persuasion
- `convert-bullets`, `convert-proof`, `convert-close` have produced the body and close
- `convert-chute` has engineered momentum
- `convert-voice` has applied the Voice Rules

Do NOT use for:
- The full Voice Rules pass with sentence mechanics, banned words, structural moves (use `convert-voice` - Bullshit Filter is one rule among several in Voice; this is the *deeper standalone coaching* applied as a final pass)
- Method audit on existing live copy (use `convert-audit`)
- Writing from scratch (use the page-builders)
- Architecture or persuasion design (use `convert-three-locks`, `convert-four-questions`)

## Inputs

Required:
1. **The draft** - full asset or specific section. Run this on what the writer intends to ship.
2. **Read-target** - sales page / VSL spoken / email / ad / headline. Calibrates the coaching (a VSL script that reads stiff aloud needs harder rewrites than a sales page that reads stiff in print).

Optional:
- **Seller voice samples** - so the rewrites can match the seller's actual conversational voice
- **Scope** - full asset / specific section / specific paragraphs to audit
- `out_path` - caller-controlled output. Defaults via `build_report_path`.

## The Adversarial Mechanism

The standard Bullshit Filter asks: *"Would I actually say this to someone I'm trying to help?"*

This skill never lets the AI answer that question on the writer's behalf. Instead, it forces the AI to:

- **Find the 3 worst lines** even when the draft seems clean. The forced quota is the gate. AI grading its own work returns "all clear" too often; the quota stops that failure mode.
- **Write 3 different rewrites of each weakest line.** Three voicings forces the AI to demonstrate range instead of stamping approval. The writer sees options, picks one, and ships.
- **Name the dominant failure pattern in one paragraph.** This is the diagnosis the writer can carry into the next draft - not a stamp on this one.

### What "weakest line" means

A line is a candidate for "weakest" if any of the following is true:

- Sounds like writing, not talking ("It is essential to recognize that...")
- Sounds like marketing copy, not conversation ("Unlock your true potential...")
- Embarrassing to read aloud ("ARE YOU READY TO TRANSFORM YOUR LIFE?!")
- Treats the reader as a segment ("Many of our customers have found...")
- Abstract instead of specific ("significant revenue growth")
- Hedged ("Some have suggested that...", "Studies have shown..." without naming the study)
- Performative urgency or scarcity ("DON'T MISS OUT! ACT NOW!" when there's no real reason)
- Uses softeners ("Note that...", "Specifically...", "It's worth noting that...", "Importantly...")
- Uses LLM connectors ("Moreover...", "Furthermore...", "Additionally...", "In essence...")
- Uses showroom adjectives ("carefully crafted", "meticulously designed", "comprehensive", "robust")

If 0 lines feel weak, pick the 3 *least strong*. There is always a worst sentence in any draft. The skill finds it.

## Workflow

### Step 1 - Read the entire draft, end to end

At speaking pace. Don't fix anything yet. Mark candidate weak lines as you go.

### Step 2 - Force-rank the candidates

From all marked candidates, pick the **3 weakest lines**. Even if the draft seems clean, force-rank to 3. Ties broken by:
- Line that appears earliest in the draft (a weak line up top hurts more)
- Line in a load-bearing section (Open, close, P.S.)
- Line with the most layers of failure (e.g., a hedged + abstract + LLM-connector line beats a single-failure line)

### Step 3 - For each weakest line, produce 3 alternative rewrites

The 3 rewrites must demonstrate **range**, not refinement. Aim for:
- **Rewrite A** - closest to the original intent, but plain-spoken (the conservative rewrite)
- **Rewrite B** - punchier, more specific, more named-and-dated (the aggressive rewrite)
- **Rewrite C** - different angle entirely, possibly killing the line and routing the meaning elsewhere (the structural rewrite)

Each rewrite must answer YES to *"Would I actually say this to someone I'm trying to help?"* - but the three rewrites pick different things to say.

### Step 4 - Diagnose the dominant voice failure pattern

Read all 3 weakest lines together. Name the single most common voice failure pattern in one paragraph (3-5 sentences). Examples:

- *"Softeners - every weak line opens with 'Note that' or 'Importantly' or 'Specifically.' The writer is hedging at the start of every paragraph, which signals lack of conviction. Strip the openers; the lines underneath are mostly fine."*
- *"Marketing-speak - every weak line uses showroom adjectives ('carefully crafted', 'comprehensive') instead of specifics. The fix is replacing every adjective with a number, name, date, or place."*
- *"Abstract language - every weak line names a category instead of a person. 'Many entrepreneurs' / 'today's busy professionals' / 'modern business owners.' The reader doesn't see themselves in any of these. Rewrite as one specific person doing one specific thing."*
- *"Hedged claims - every weak line wraps a real claim in four hedges. 'Some studies have suggested that...' becomes 'Mike, Akron, plumber: 4 calls a week to 23 in 31 days.' Either defend the claim with proof or delete it."*
- *"Performative urgency - every weak line manufactures pressure that doesn't exist. The fix is either find the real reason or remove the urgency entirely."*

The diagnosis is the **transferable lesson** the writer carries into the next draft. The 3 rewrites fix this draft; the diagnosis fixes the writer.

### Step 5 - Output the coaching artifact

The output is a structured markdown file (template below). It contains:
- The 3 weakest lines (quoted verbatim from the draft)
- 3 rewrites per weakest line (9 rewrites total)
- One paragraph of diagnosis
- A decision prompt for the writer (not a verdict from the skill)

There is no PASSED. There is no FAILED. The writer reads the artifact and decides.

## Examples (failure → 3 rewrites)

### Example 1 - softener pattern

**Weakest line (verbatim from draft):**
> *"It's worth noting that lead generation in today's competitive marketplace requires a multifaceted approach to consistently outperform competitors."*

**Rewrite A (conservative):**
> *"Lead generation right now needs three plays running at once, not one. The operators who grow run all three. The ones who don't run one and hope."*

**Rewrite B (punchier, specific):**
> *"Mike was running one play - Facebook ads. Same campaign for 14 months. Last quarter he added LSA + a referral bump. 4 calls a week became 23 in 31 days. One play loses to three plays. Every time."*

**Rewrite C (structural - kill the abstraction, route to story):**
> Delete the line entirely. The next paragraph already does this work with the Mike anecdote. The "competitive marketplace" framing was a wind-up the body didn't need.

---

### Example 2 - marketing-speak

**Weakest line:**
> *"Our revolutionary system empowers entrepreneurs to unlock their true potential and take their business to the next level."*

**Rewrite A:**
> *"This is the same play I ran on my own crew last quarter. Same template you're getting today. Worked then, works now."*

**Rewrite B:**
> *"$11k-a-month service business to $38k-a-month service business in 91 days. Same operator, same crew, one new play. That play is in Module 3."*

**Rewrite C (route through proof):**
> *"You don't need a 'system.' You need the one thing that's been working for the people who are 6-12 months ahead of you. That's what's in here."*

---

### Example 3 - performative urgency

**Weakest line:**
> *"DON'T MISS OUT! THIS LIMITED-TIME OFFER ENDS SOON! ACT NOW BEFORE IT'S TOO LATE!"*

**Rewrite A (real reason if one exists):**
> *"Price goes to $2,497 on the 17th because we're adding the live cohort element. Before the 17th, you're getting current price + the calls."*

**Rewrite B (honest framing if no real reason):**
> *"There's no fake deadline. The cost of waiting is whatever you're losing each week without this. Run that math; that's your deadline."*

**Rewrite C (structural - let the close carry weight):**
> Delete the urgency block. The Cascade Close already does the work. False urgency at the end of a real close drags the whole close down.

---

## Output Template

```markdown
# Bullshit Filter - Adversarial Coaching Pass

**Read-target:** <sales page / VSL spoken / email / ad / headline>
**Scope:** <full asset / specific sections>
**Pre-pass impression:** <Donahoe-adjacent / partly-Donahoe / generic / sales-bro / multiple voices>

This is a coaching artifact, not a verdict. The skill identifies the 3 weakest lines, proposes 3 rewrites of each, and diagnoses the dominant voice failure pattern. The writer decides whether to ship.

---

## The 3 weakest lines

### Weakness 1 - <Location, e.g., "Section 3, paragraph 2">

**Quoted verbatim:**
> "<exact line from the draft>"

**Why it's weak:** <one sentence: which failure pattern, what specifically falls apart>

**Rewrite A (conservative - same intent, plain-spoken):**
> "<rewrite>"

**Rewrite B (aggressive - punchier, named-and-dated):**
> "<rewrite>"

**Rewrite C (structural - kill the line or route the meaning elsewhere):**
> "<rewrite or instruction>"

---

### Weakness 2 - <Location>

**Quoted verbatim:**
> "<exact line from the draft>"

**Why it's weak:** <one sentence>

**Rewrite A:**
> "<rewrite>"

**Rewrite B:**
> "<rewrite>"

**Rewrite C:**
> "<rewrite or instruction>"

---

### Weakness 3 - <Location>

**Quoted verbatim:**
> "<exact line from the draft>"

**Why it's weak:** <one sentence>

**Rewrite A:**
> "<rewrite>"

**Rewrite B:**
> "<rewrite>"

**Rewrite C:**
> "<rewrite or instruction>"

---

## Diagnosis - the dominant voice failure pattern

<One paragraph (3-5 sentences). Name the single most common voice failure across the 3 weakest lines. Make it transferable: a lesson the writer carries into the next draft, not a stamp on this one. Examples: softeners, marketing-speak, abstract language, hedged claims, performative urgency, LLM-connectors, showroom adjectives.>

---

## What the writer does next

This skill does not declare PASS or FAIL. The writer's call:

- **If the 3 weakest lines + diagnosis match what the writer already felt:** pick a rewrite for each (or write a 4th that combines elements) and ship.
- **If the 3 weakest lines surprise the writer:** that's the coaching value. Re-read the diagnosis paragraph. Apply the lesson across the rest of the draft, not just the 3 quoted lines.
- **If the writer disagrees with the rankings:** that disagreement is itself useful. The writer knows the seller's voice better than the skill. But check: is the disagreement craft-grounded, or is it the AI's own reluctance to flinch at its own work? When in doubt, ship the rewrite.

The Filter does not ship copy. The writer ships copy. This skill makes the writer's call easier by surfacing what to look at.
```

## Notes

- The Bullshit Filter as written here refuses to give a "ship it / don't ship it" answer. That's the design. AI is biased toward declaring its own work clean; the boolean stamp is the diagnostic AI-tell. Force-quoting 3 weakest lines + 9 rewrites + 1 diagnosis paragraph is harder to fake than a checkmark.
- The 3-rewrite quota matters. One rewrite is the AI's first instinct, often a refinement of the original failure. Three rewrites force range - conservative / aggressive / structural - so the writer sees the actual menu of choices.
- The diagnosis paragraph is the **transferable artifact**. The 9 rewrites fix this draft; the diagnosis paragraph fixes the writer. Carry it into the next brief.
- For VSL scripts, the Filter doubles in weight - anything that reads stiff in print reads catastrophically stiff when spoken aloud. Run the Filter on the spoken cadence, not just the written page.
- The Filter is also a meta-test on the rest of the Method: if the asset has gone through `convert-open` + `convert-three-locks` + `convert-bullets` + `convert-proof` + `convert-close` + `convert-chute` + `convert-voice` and the 3 weakest lines all share the same failure pattern, the failure is upstream - most often in the Four Questions diagnostic (`convert-four-questions`). Inputs were wrong; outputs read wrong. Re-run the diagnostic.
- This skill is the final coaching pass for `convert-sales-page`, `convert-vsl`, `convert-package`, and the `/convert audit` flow. Every asset built by this pack should pass through this coaching pass before delivery - and the writer (not the skill) makes the ship call.

## Lineage

The Bullshit Filter is part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:
- "Write what you'd say" doctrine - *Gary Halbert, the Boron Letters (1984)*: "imagine one person reading this letter at the kitchen table"
- "Never write what you wouldn't say" - *David Ogilvy, Confessions of an Advertising Man (1963)*
- Plain-English mandate (kill jargon, kill fluff, prefer concrete over abstract) - *George Orwell's six rules, "Politics and the English Language" (1946)*
- The forced-rewrite-of-3-worst-lines mechanism - adversarial debate methodology applied to copy review
- The read-aloud test as a coaching mechanism - common across *Halbert / Ogilvy / Bly / Sugarman* canon
