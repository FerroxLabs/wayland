---
name: convert-transition
slash_command: false
pack: business-conversion
family: donahoe_method
description: |
  Apply the Donahoe Transition System: 10 moves (Comparison Bomb, Escalation, Aside Bomb, Interrupt, Dismiss, Diagnostic, Assumed Agreement, Internal Moment, Admission, Energy Drop) that move copy through energy and momentum, never through filler phrases.
  Use when a draft has clunky transitions or "here's the thing" / "let me be straight with you" filler that signals the writer ran out of ideas.
  Not for full-draft momentum engineering (use convert-chute) and not for opening hooks (use convert-open).
triggers:
  - fix my transitions
  - donahoe transitions
  - transition system
  - kill the connector phrases
  - kill heres the thing
  - write a comparison bomb
  - write an aside bomb
  - move between sections
negative_triggers:
  - rewrite my whole page
  - write a hook
  - write the close
  - momentum engineering pass (use convert-chute)
tags: [conversion, copy, donahoe-method, transition-system, transitions]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills:
      [convert, convert-chute, convert-open, convert-voice, convert-bullshit-filter, convert-sales-page, convert-vsl]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references *Robert McKee's scene-transition theory (Story, 1997)*, *Sugarman's slippery-slide momentum doctrine (AdWeek Copywriting Handbook, 1998)*, and *Bly's transition mechanics (The Copywriter's Handbook, 1985)*"
---

# Convert Transition - The Donahoe Transition System

> _"Transitions are where most copy dies. The writer runs out of momentum, drops in a clunky connector, and the reader checks out. In Donahoe copy, transitions happen through energy and movement, not announcement phrases."_ - The Donahoe Method, Framework 8

This skill replaces clunky filler transitions ("here's the thing", "look", "let me be straight with you") with the 10 Donahoe transition moves that work through energy and movement.

You either accelerate, decelerate, redirect, or detonate. The movement itself is interesting enough that the reader follows.

## When to Use

Trigger phrases: "fix my transitions", "donahoe transitions", "transition system", "kill the connector phrases", "kill here's the thing", "write a comparison bomb", "write an aside bomb", "move between sections", `/convert transition <draft section>`.

Use when:

- A draft has clunky filler transitions
- A specific section break feels stiff or breaks momentum
- You're inside a Chute pass (`convert-chute`) and need a specific transition move to deploy
- The writer used the same kind of transition 3+ times in a row

Do NOT use for:

- Engineering full-draft momentum (use `convert-chute`)
- Writing the asset's opening hook (use `convert-open`)
- Writing the close (use `convert-close`)
- Auditing the page (use `convert-audit`)

## Inputs

Required:

1. **The draft section(s)** - paste in the specific section break(s) where the transition needs work
2. **Direction of energy** - what are we moving from / to? (problem → solution / story → mechanism / proof → bullets / bullets → close / etc.)

Optional:

- **Voice samples / signature phrases** so transitions match the seller's voice
- **Reader temperature** (Cool audiences absorb Diagnostic well; Hot audiences love Escalation; Boiling audiences just need a Dismiss)
- `out_path` - caller-controlled output. Defaults via `build_report_path`.

## The Banned Filler Phrases

These are the connectors that signal you ran out of ideas. The reader feels the gear-grind. Kill on sight:

- "Here's the thing..." (apology for transitioning)
- "Look..." (defensive; signals coming pushback)
- "Let me be straight with you..." (hedge - implies you weren't being straight before)
- "Now, in this next section..." (announces structure, kills momentum)
- "Moving on..." (gives up entirely)
- "But wait!" (1990s infomercial energy)
- "Don't worry, because..." (reassurance no one asked for)
- "Believe me when I say..." (begging trust)
- "As I mentioned earlier..." (slows the read; treat the reader as if they're paying attention)
- "In conclusion..." / "To wrap up..." (kills momentum at the close)

When you find these, replace with one of the 10 moves below.

## The Transition Arsenal (10 moves)

### 1. The Comparison Bomb

Vivid, instant, no setup. Anchors a complex idea in one image.

**Pattern:** _"Think [familiar thing] on crack."_ / _"It's like [X] but [Y]."_ / _"[X], except for grown-ups."_

Examples:

- ✓ _"Think a webinar funnel - except the webinar is a 6-minute story and the funnel is a single page."_
- ✓ _"It's like cold-calling, but the customer makes the call."_
- ✓ _"Picture an agency retainer, except you keep all the margin."_

When to use: when you need to anchor a new concept fast and the reader has a familiar reference.

### 2. The Escalation

Dismisses what you just built up to build something bigger.

**Pattern:** _"And that's not even the good part..."_ / _"That's the floor, not the ceiling..."_ / _"Wait until you hear what happened on day eight..."_

Examples:

- ✓ _"And the leads in week one - that's the easy part. The thing that actually changed the business showed up in week three."_
- ✓ _"That $14k in 11 days? That was the proof of concept. The proof itself came six months later."_

When to use: when you've built up something impressive and want to set up something more impressive without seeming to oversell.

### 3. The Aside Bomb

Makes the most important point sound like an afterthought. The casual delivery IS the emphasis.

**Pattern:** _"Oh, and one more thing..."_ / _"Almost forgot - [the load-bearing thing]"_ / _"(Side note that's actually the whole point...)"_

Examples:

- ✓ _"Oh, and the part I almost forgot - Mike's revenue actually doubled the next month, not the same month. The system kept compounding after the first 30 days."_
- ✓ _"Side note that's actually the whole point: the only people this didn't work for were the ones who skipped Module 2."_

When to use: when the most important data point would land flat if you announced it. Aside makes it land harder.

### 4. The Interrupt

Creates urgency by stopping yourself. The reader thinks _"what's so important that he stopped mid-thought?"_

**Pattern:** _"Wait. Before I go any further..."_ / _"Actually - hold on. Something I need to clarify before we continue..."_

Examples:

- ✓ _"Wait - before I keep going, I need to be honest about something. This doesn't work if you're not actively servicing customers right now. If you're pre-revenue, this is the wrong play. Different conversation. Now, assuming you ARE servicing customers..."_
- ✓ _"Hold on. I'm getting ahead of myself. Let me back up to the part where this actually clicked."_

When to use: when the reader needs to digest before the next claim, or when you want to disqualify wrong-fit readers without breaking the chute.

### 5. The Dismiss

A tangent deliberately planted as a teaser. You're opening a loop you won't close yet.

**Pattern:** _"But that's a whole other thing..."_ / _"That's a different rabbit hole - we'll get to it later..."_ / _"More on that in a minute."_

Examples:

- ✓ _"There's actually a second mechanism that compounds this - but that's a whole other conversation. We'll get there later."_
- ✓ _"And yes, there's a way to run this without paid traffic at all. More on that in section four."_

When to use: when you want to plant an open loop the reader carries forward.

### 6. The Diagnostic

Cuts from possibility to reality. No transition phrase needed. Just a direct question that shifts the frame.

**Pattern:** _"So what's the problem?"_ / _"So why doesn't everyone do this?"_ / _"What changed?"_

Examples:

- ✓ _"So what's the actual problem with most of these systems?"_
- ✓ _"So why does almost no one do this - even though it works?"_
- ✓ _"What broke?"_

When to use: when the reader has been in possibility-mode (here's what could be) and you need to snap back to reality (here's what's blocking it).

### 7. The Assumed Agreement

Positions the next point as something the reader already knows. They nod along because disagreeing would mean they're behind.

**Pattern:** _"Obviously this means..."_ / _"You already know..."_ / _"Anyone running a service business already gets this..."_

Examples:

- ✓ _"Obviously the math here is brutal - every week you wait, the cost compounds."_
- ✓ _"You already know what happens next: the slow operators get priced out, the fast ones consolidate the market."_
- ✓ _"Anyone who's run a launch knows the second day is where most of them die."_

When to use: when you want to establish a premise as a foregone conclusion without arguing for it. Use carefully - overuse reads as condescending.

### 8. The Internal Moment

Pulls the reader inside a specific moment. Time-stamps the transition.

**Pattern:** _"I was sitting there and it hit me..."_ / _"It was a Tuesday, around 6pm, and I remember exactly..."_ / _"That's the moment everything clicked."_

Examples:

- ✓ _"It was a Tuesday in March 2019. I was at my kitchen table looking at the dashboard, and it hit me: every campaign that had ever worked for me had one thing in common. Every campaign that flopped didn't have it. That's the moment everything clicked."_
- ✓ _"I remember exactly where I was - Sarah's third-floor walkup in Brooklyn, late August, ceiling fan barely working. That's where the real version of this was born."_

When to use: when you're about to deliver the most important insight and want to anchor it in scene rather than abstract claim.

### 9. The Admission

Vulnerability as a trust pivot. Not a confession - a calculated reveal that deepens credibility.

**Pattern:** _"I have to be honest about something..."_ / _"I'm going to admit something I usually don't tell people..."_ / _"This is the part I'm not proud of."_

Examples:

- ✓ _"I have to admit something. The first version of this didn't work. I got my first three students fired by an angry employer because I gave them the wrong sequence. I rebuilt the whole framework after that, and what you're getting now is version four."_
- ✓ _"This is the part I'm not proud of: I spent two years selling the wrong version of this before I figured out the version that actually worked."_

When to use: when the reader is about to encounter a claim that might trigger skepticism. Admitting an earlier failure makes the current claim more credible, not less.

### 10. The Energy Drop

Lower the intensity. Get quiet. When everything has been high-energy, a sudden drop in volume is the most powerful transition of all. The reader leans in.

**Pattern:** A short sentence after a long energetic stretch. A simple statement after escalating claims. _"Look, here's the truth."_ / _"This is the part that matters."_ / _"Just listen."_

Examples:

- ✓ _"...so the leads pile up, the revenue compounds, the system starts running on its own._
  > _That's all real._
  >
  > _And that's also not the point. The point is what it lets you stop doing."_
- ✓ _"And here's the part nobody likes to admit._
  > _None of this works if you don't ship."_

When to use: after 3+ paragraphs of high energy, drop into quiet for the most important beat. The contrast IS the emphasis.

## Workflow

### Step 1 - Find the friction transitions

Read the draft. Mark every:

- Banned filler phrase (the 10-item kill list above)
- Section break that summarizes the prior section ("In conclusion...")
- Section break that announces the next section ("Now let's discuss...")
- Three+ adjacent same-type transitions (e.g., three Diagnostics in a row reads as a quiz)

### Step 2 - Decide the energy direction

For each marked transition, what's the energy direction?

- Accelerate (build to bigger thing → Escalation, Comparison Bomb)
- Decelerate (need the reader to digest → Energy Drop, Internal Moment)
- Redirect (snap from possibility to reality → Diagnostic, Interrupt)
- Detonate (drop a load-bearing point unexpectedly → Aside Bomb, Admission)

### Step 3 - Pick the move and write the transition

Match move to energy direction. Write the transition in the seller's voice.

### Step 4 - Variety check

Across the full draft, no transition move should be used more than 30% of the time. If you're stacking Comparison Bombs section-after-section, swap to other moves.

### Step 5 - Read-aloud test

Read the transition aloud in context with the surrounding paragraph. If it stumbles, rewrite. If it sounds like writing instead of talking, rewrite.

### Step 6 - Bullshit Filter

Final pass: would I actually say this transition out loud? If a transition sounds like it came from a copywriter cookbook, kill it.

## Examples (before / after)

### Before - banned filler

> _"...so that's how the system works._
>
> _Here's the thing - most people who try this end up failing because they don't understand the second mechanism..."_

### After - Diagnostic

> _"...so that's how the system works._
>
> _So why do most people fail when they try it?_
>
> _They miss the second mechanism..."_

---

### Before - announces structure, kills momentum

> _"In the next section we will discuss pricing strategies."_

### After - Escalation

> _"And the system itself - that's the easy part. The thing that actually decides whether you're charging $99 or $1,997 is what we're getting to next."_

---

### Before - apologetic / hedging

> _"Look, let me be straight with you. This won't work for everyone."_

### After - Admission

> _"I have to admit something. This doesn't work for everyone - and I've watched enough of the people it didn't work for to know exactly who they are."_

---

### Before - exclamation-mark "but wait"

> _"But wait! There's even more value!"_

### After - Aside Bomb

> _"Oh - and one more thing. The bonus that almost slipped my mind, which honestly might be the most useful piece of all this."_

## Output template

```markdown
# Transition Pass - <Asset / Section>

**Read-target:** <mobile / desktop / VSL spoken>
**Reader temperature:** <Ice Cold / Cool / Warm / Hot / Boiling>

---

## Friction inventory (pre-pass)

| #   | Location          | Friction type       | Banned phrase used            |
| --- | ----------------- | ------------------- | ----------------------------- |
| 1   | Section 1 → 2     | Banned filler       | "here's the thing"            |
| 2   | Section 2 → 3     | Announces structure | "in the next section"         |
| 3   | Section 3 → 4     | Banned filler       | "let me be straight with you" |
| 4   | Section 5 → close | Summary ending      | "in conclusion"               |

---

## Replacements

| #   | Energy direction | Move chosen | Transition copy                                                                                                                                        |
| --- | ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Redirect         | Diagnostic  | _"So why do most people fail when they try it?"_                                                                                                       |
| 2   | Accelerate       | Escalation  | _"And the system itself - that's the easy part. What actually decides whether you're charging $99 or $1,997 is next."_                                 |
| 3   | Detonate         | Admission   | _"I have to admit something. This doesn't work for everyone - and I've watched enough of the people it didn't work for to know exactly who they are."_ |
| 4   | Decelerate       | Energy Drop | _"That's the system._<br><br>_Here's what it lets you stop doing."_                                                                                    |

---

## Variety check

| Move used       | Count | % of total |
| --------------- | ----- | ---------- |
| Comparison Bomb | 1     | 12%        |
| Escalation      | 2     | 25%        |
| Aside Bomb      | 1     | 12%        |
| Diagnostic      | 2     | 25%        |
| Admission       | 1     | 12%        |
| Energy Drop     | 1     | 12%        |

**No move >30%:** ✓

---

## Bullshit Filter

- [ ] No banned filler phrases remain
- [ ] No section announces structure ("in this section", "moving on")
- [ ] No section ends with summary ("in conclusion", "to wrap up")
- [ ] Variety check passes (no move >30% of total)
- [ ] Read-aloud test - every transition sounds like someone talking, not writing
```

## Notes

- The 10 moves cover ~95% of transition jobs. If you find yourself reaching for a move that's not in this library, the simpler answer is usually "remove the transition entirely" - direct paragraph-to-paragraph movement with no connector often reads cleaner than any move.
- The Energy Drop is the most underused move and the most powerful when used correctly. Most copywriters never decelerate. Drop into quiet once per long-form page and it lands like a hammer.
- The Comparison Bomb has the highest variance - it lands hardest when the reference is _exact_ (specific, vivid, mutually understood). Vague comparisons ("it's like Netflix for X") read as cliché.
- The Admission move requires honesty. Inventing a fake past failure to use as an Admission is a credibility-collapse risk. Only Admit things that actually happened.
- This skill composes with `convert-chute` (which uses the Transition System inside its Pass 4) and `convert-bullshit-filter` (the final filter).

## Lineage

The Donahoe Transition System is part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:

- Energy-direction transitions (accelerate/decelerate/redirect/detonate) - _Robert McKee, Story (1997)_: scene-transition theory adapted from screenwriting
- Slippery-slide momentum behind transitions - _Joseph Sugarman, AdWeek Copywriting Handbook (1998)_
- Connector-phrase elimination - _Robert Bly, The Copywriter's Handbook (1985)_: kill words that don't earn their space
- The Diagnostic-as-section-pivot - common in _Halbert sales-letter teardowns (Boron Letters, 1984)_
- The Admission as trust-deepener - _Cialdini liking principle (Influence, 1984)_ and _Brené Brown vulnerability research (Daring Greatly, 2012)_
