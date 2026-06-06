---
name: convert-three-locks
slash_command: false
pack: business-conversion
family: donahoe_method
description: |
  Architect the Three Locks persuasion sequence: Lock 1 Want (sell the state), Lock 2 Trust (earn belief through proof + voice), Lock 3 Excuse (give the rational justification). Outputs the lock-by-lock blueprint that the rest of the asset writes against.
  Use when planning the persuasion architecture of a sales page, VSL, or long-form email before drafting copy.
  Not for writing the open (use convert-open) or the close (use convert-close) - this designs the middle architecture they bridge.
triggers:
  - architect the persuasion
  - three locks
  - donahoe three locks
  - want trust excuse
  - design the persuasion sequence
  - persuasion architecture
  - lock by lock plan
  - sell the state
negative_triggers:
  - write me a hook
  - write the close
  - audit my page
  - design the offer
tags: [conversion, copy, donahoe-method, three-locks, persuasion, architecture]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-four-questions, convert-open, convert-proof, convert-bullets, convert-close, convert-sales-page, convert-vsl]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references *Cialdini's six principles of influence (Influence, 1984)*, *Halbert's want-and-justify model (Boron Letters, 1984)*, and the *AIDA architecture (Lewis, 1898)*"
---

# Convert Three Locks - The Persuasion Architecture

> *"Three things must happen - roughly in this order - before someone buys. Think of them as three locks on a door. You need to open all three. Miss one and the door stays closed."* - The Donahoe Method, Framework 3

This skill produces the lock-by-lock blueprint for a conversion asset. Lock 1 (Want), Lock 2 (Trust), Lock 3 (Excuse). All three open or no sale.

The output is the **architecture** the asset writes against. The Open (`convert-open`) leads into Lock 1. The Close (`convert-close`) closes after Lock 3. Everything in between is the locks.

## When to Use

Trigger phrases: "architect the persuasion", "three locks", "donahoe three locks", "want trust excuse", "design the persuasion sequence", "persuasion architecture", "lock by lock plan", "sell the state", `/convert locks <product or brief>`.

Run this skill **after** `convert-four-questions` and `convert-temperature`, and **before** any page-builder. The locks become the section spine of the page.

Do NOT use for:
- Writing the opening hook (use `convert-open`)
- Writing the close itself (use `convert-close`)
- Designing the offer's value structure (use `funnels-offer` - different pack)
- Auditing existing persuasion arcs (use `convert-audit`)

## Inputs

Required:
1. **Four Questions output** (from `convert-four-questions`) - Why You feeds Want; Why Me feeds Trust; Why This + Why Now feed Excuse.
2. **Temperature** (from `convert-temperature`) - calibrates how much weight each lock carries (Cool audiences load Trust heavy; Hot audiences load Excuse heavy).
3. **Offer details** - what they're buying, the price, the guarantee, any bonuses, the format.

Optional:
- **Available proof** - anecdotes, receipts, namechecks (feeds Lock 2 specifically)
- **Section length budget** - how many words / minutes per lock
- **Competing alternatives the reader has considered** - affects how Lock 2 builds Trust around differentiation
- `out_path` - caller-controlled output. Defaults via `build_report_path`.

## The Three Locks (full method)

### Lock 1 - The Want

**Job:** Don't sell the product. Sell the state.

Nobody buys a course. They buy the version of themselves that exists after the course. Nobody buys a supplement. They buy the feeling of waking up with energy. Nobody buys a tool. They buy the result the tool creates.

Paint the state using sensory, visceral language. *"Imagine waking up, checking your phone, and seeing four new sales came in overnight"* is specific and physical. *"Achieve financial freedom"* is a bumper sticker that means nothing.

**The Want comes from specificity.** The more specific the vision, the more real it feels. The more real it feels, the more they want it. The more they want it, the easier everything else becomes.

Specifications:
- Sensory language - sight / sound / feel / motion
- Specific scenes, not abstract states
- Connected to *their* identity and current routine
- Anchors a "before/after" - without explicitly using those words
- Avoids bumper-sticker phrases ("financial freedom", "live your best life", "unlock your potential")

Examples:
- ✓ *"Picture this: it's 7am Tuesday. You're still in bed. You roll over, check your phone, and there are six new sales notifications from the overnight - three of them at the higher tier you didn't think anyone would actually buy. You haven't even brushed your teeth yet and you've already cleared what your last job paid you in a week."*
- ✗ *"Achieve financial freedom and live the lifestyle you deserve."* (zero sensory, dead phrasing)

### Lock 2 - The Trust

**Job:** They want it. Now they need to believe it's actually possible - and that YOU'RE the person to deliver it.

Trust is built through Conversational Proof (`convert-proof`). But it's also built through **voice**. The reader trusts you because you sound like someone who's actually done it. Not reading from a script. Not hedging with qualifiers. Not *"some people have found that..."* - just stating what happened with the quiet certainty of someone who was there.

**Conversational authority IS a trust-building mechanism.** When you speak without hedging, the reader's brain categorizes you as credible. You sound like someone who knows. That's half the work done before you present a single piece of evidence.

Specifications:
- Anchored to specific past results (Receipts) and specific past customers (Anecdotes / Namechecks)
- Drive-By credentials slipped in, never announced
- Voice is unhedged - declarative, first-person, no "some people have found"
- The Because mechanism explains *why* the result is possible, so it doesn't feel miraculous

Trust loads cumulatively:
1. **Skin in Game** (already established in the Open by `convert-open`) - opens the trust account
2. **Anecdote layer** - third-party proof that the same approach works for people like the reader
3. **Receipt layer** - specific numbers that anchor belief
4. **Mechanism layer** - the Because that makes it logical, not magical

### Lock 3 - The Excuse

**Job:** They want it. They believe it. Now they need the logical argument they'll use to explain the purchase to themselves. Or to their spouse. Or to their business partner at the next meeting.

The Excuse is the rational justification for an emotional decision that's already been made.

Specifications:
- Reads almost mathematical
- Reframes the price as small relative to a comparison they accept
- Often lists three alternatives the price equals, to anchor against
- Acknowledges the reader's skepticism explicitly, then solves for it

The Excuse pattern menu:
- **The Already-Spent compare:** *"Think about how much you've already spent on stuff that didn't work..."*
- **The Cost-of-Not compare:** *"This pays for itself if you land even one client from it..."*
- **The Trivial-Equivalent compare:** *"For less than the cost of one client dinner..."*
- **The Hourly Math compare:** *"At your hourly rate, this saves you in week one..."*
- **The Risk-Reversal Math:** *"The guarantee means the worst case is you spend zero..."*

Give them the math. Let the math close the gap between *"I want this"* and *"I bought this."*

## Workflow

### Step 1 - Inherit the brief

Pull from `convert-four-questions`:
- Why You → Lock 1 Want anchor (the specific cost-of-inaction is the inverse of the wanted state)
- Why Me → Lock 2 Trust anchor (the seller's mirror moment)
- Why This → Lock 2 Trust + Lock 3 Excuse (the mechanism is the Trust Because, the differentiation is part of the Excuse compare)
- Why Now → Lock 3 Excuse (real urgency or honest compounding cost)

If `convert-four-questions` hasn't been run, run it now or push back. The locks have nothing to write against without it.

### Step 2 - Calibrate lock weights by temperature

Pull from `convert-temperature`:

| Temperature | Want weight | Trust weight | Excuse weight |
|-------------|------------|--------------|---------------|
| Ice Cold | 50% | 35% | 15% |
| Cool | 35% | 45% | 20% |
| Warm | 25% | 45% | 30% |
| Hot | 20% | 30% | 50% |
| Boiling | 10% | 15% | 75% (just the Door) |

These are starting points, not laws. Adjust for sophistication overlay.

### Step 3 - Architect Lock 1 Want

Write the *state* description. Not the offer. Not the bullet list. The version of themselves that exists after the result lands.

Then identify which sensory details it pivots on (sight / sound / feel / motion / time-of-day).

### Step 4 - Architect Lock 2 Trust

Build the trust load order:
1. Drive-By credential (slipped, not announced)
2. Lead Anecdote (the customer story that mirrors the reader's situation most closely)
3. Receipt (the hardest, most specific number)
4. Mechanism Because (why this approach produces the result while alternatives don't)
5. Optional second Anecdote / Namecheck for breadth

### Step 5 - Architect Lock 3 Excuse

Pick the Excuse pattern that fits:
- Hot-temperature audiences usually need the Already-Spent compare
- Cool-temperature audiences usually need the Cost-of-Not compare
- B2B audiences usually need the Hourly Math + Risk-Reversal Math combined

Pre-write the math. Make sure it's defensible - fake math at this stage destroys all earlier trust.

### Step 6 - Map locks to section breakdown

For a sales page, typical lock-to-section map:

| Section | Lock |
|---------|------|
| Hero / above-fold | (Open from `convert-open`) |
| Problem agitation | Lock 1 Want (the inverse - the cost of *not* having the state) |
| Solution intro | Lock 1 Want (the state itself) |
| Story / mechanism | Lock 2 Trust |
| Bullets / what's inside | Lock 1 Want re-anchored + Lock 2 Trust |
| Proof block | Lock 2 Trust |
| Pricing / stack | Lock 3 Excuse |
| Guarantee | Lock 3 Excuse |
| FAQ | Lock 3 Excuse |
| Final close | (Cascade Close from `convert-close`) |

### Step 7 - Bullshit Filter

Read each lock plan aloud. Lock 1 Want - does it paint a state someone could film? Lock 2 Trust - does it earn the belief through specific evidence? Lock 3 Excuse - would the reader say this math out loud to their spouse without flinching?

If any lock fails the read-aloud test, rewrite it.

## Examples (good vs anti-pattern)

### Lock 1 - Want

**Donahoe-style (sells the state):**
> *"Here's what your Tuesday looks like 90 days from now: you wake up at 7. You check your phone before you stand up. There are four new bookings from the overnight, two of them in the higher tier you weren't sure anyone would buy. You haven't done anything yet today. You haven't sent an email. You haven't run an ad. The system did its work while you were asleep, exactly the way a system is supposed to."*

**Anti-pattern (sells the product):**
> *"Our comprehensive 8-week program teaches you everything you need to know about generating leads online. With 47 video lessons, 12 templates, and a private community, you'll have all the tools to succeed."*

### Lock 2 - Trust

**Donahoe-style (earned through proof + voice):**
> *"This isn't theory. I ran my own service business for nine years and spent the first six of them losing to whoever was running ads against my zip code - until I figured out the LSA mechanism that took my book from $11k months to $38k months in under a year. Mike, a plumber from Akron, ran the same play last quarter and went from 4 calls a week to 23. The reason it works has nothing to do with funnel tricks - it's because LSA charges per verified-intent caller, not per impression."*

**Anti-pattern (announces credentials, hedges):**
> *"As an industry-leading authority with 20+ years of experience, I've helped countless entrepreneurs achieve breakthrough results. Some clients have found significant improvement in their lead generation efforts."*

### Lock 3 - Excuse

**Donahoe-style (mathematical, defensible):**
> *"This is $1,997. I know that sounds like a number. So let's do the math on what you've already spent: $4,400 on the Facebook agency last summer, $2,100 on the SEO retainer the year before, and roughly six months of your own time you can't get back. This pays for itself the first booked job. And if it doesn't, you get every dollar back - no forms, no calls, no 'retention specialist'. Worst case, you're down zero. Best case, you have a system that pays for itself by next month."*

**Anti-pattern (no math, fake urgency):**
> *"Special pricing today only! Get this incredible system at a fraction of the regular price. Don't miss out!"*

## Output template

```markdown
# Three Locks Architecture - <Product / Asset>

**Source brief:** <link to convert-four-questions output>
**Temperature:** <Ice Cold / Cool / Warm / Hot / Boiling>
**Asset:** <sales page / VSL / email / ad>
**Lock weights:** Want <%> / Trust <%> / Excuse <%>

---

## Lock 1 - The Want

**The state being sold:**
> <Sensory paragraph painting their Tuesday morning 90 days from now>

**Pivot details:** <sight / sound / feel / motion / time-of-day>
**Their identity-anchor:** <how the state ties to who they want to be>
**Inversion (problem agitation framing):** <the cost-of-not-having-this version, used in the problem section>

---

## Lock 2 - The Trust

**Load order:**
1. Drive-By credential - *"<the slipped-in line>"*
2. Lead Anecdote - <named person, mirror situation, specific outcome>
3. Receipt - <hardest non-round number with date/source>
4. Mechanism Because - <one-sentence why this works>
5. (Optional) Second Anecdote / Namecheck - <for breadth>

**Trust voice posture:** <unhedged, first-person, declarative>
**Conversational authority cues:** <specific phrases that signal "I was there">

---

## Lock 3 - The Excuse

**Excuse pattern selected:** <Already-Spent / Cost-of-Not / Trivial-Equivalent / Hourly Math / Risk-Reversal Math>

**The math (pre-written):**
> <The full math walkthrough, defensible, mathematical, no fake numbers>

**Spouse-test phrasing:** <"if my reader had to explain this to their spouse, they'd say...">
**Why this pattern for this temperature:** <one-line reason>

---

## Section map (locks → sections)

| Section | Lock served | Word/min budget | Lead element |
|---------|------------|-----------------|--------------|
| Above-fold | (Open) | 80-120 words | Nerve Strike |
| Problem agitation | Lock 1 (inverse) | 250-400 words | Sensory cost-of-not |
| Solution intro | Lock 1 | 200-300 words | The state painted |
| Story / mechanism | Lock 2 | 350-500 words | Mirror moment + Because |
| Bullets | Lock 1 re-anchor + Lock 2 | (see convert-bullets) | Mixed bullet types |
| Proof block | Lock 2 | 200-400 words | Lead Anecdote |
| Stack / pricing | Lock 3 | 200-350 words | Excuse pattern math |
| Guarantee | Lock 3 | 100-200 words | Risk-Reversal Math |
| FAQ | Lock 3 | 150-300 words | Common objections + Excuses |
| Final close | (Cascade) | (see convert-close) | The Door |

---

## Bullshit Filter

- [ ] Lock 1 sells the state, not the product
- [ ] Lock 1 has sensory pivot details (sight / sound / feel / motion)
- [ ] Lock 1 avoids bumper-sticker phrases entirely
- [ ] Lock 2 builds trust through Anecdote + Receipt + Because (not credential dump)
- [ ] Lock 2 voice is unhedged
- [ ] Lock 3 has defensible math, not fake urgency
- [ ] Lock 3 spouse-test passes
- [ ] All three locks read aloud naturally
```

## Notes

- The locks are roughly sequential but they overlap. Lock 2 Trust loads gradually across the entire body - every Anecdote is a Trust deposit. Lock 1 Want gets re-painted in the bullet section. Lock 3 Excuse begins building the moment the price appears and continues through the close.
- The most common architecture failure: skipping Lock 1 and going straight to Lock 2 + 3. Pages that are all proof and pricing without painting the state never convert because the reader hasn't been shown what they're buying *into*.
- The second most common failure: stacking Lock 2 with credentials but no Anecdotes. Credentials without stories build authority without belief - and belief is what closes.
- For sequel offers to past customers, the Three Locks compress dramatically because Lock 2 Trust is mostly already opened. A 200-word email can carry a full Three Locks pass.
- This skill composes upstream with `convert-four-questions` (input) and `convert-temperature` (calibration), and downstream with `convert-open` (sets up Lock 1 with Skin in Game), `convert-proof` (does most of the Lock 2 lifting), `convert-bullets` (re-anchors Want, deepens Trust), and `convert-close` (closes after Lock 3 has done its work).

## Lineage

The Three Locks is part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:
- The want-then-justify pattern - *Halbert, the Boron Letters (1984)*: "give them what they want, give them the reason"
- Trust as social-proof + authority + liking - *Cialdini's Influence (1984)*
- Excuse as rational-justification - *Cialdini's commitment-and-consistency principle (Influence, 1984)*
- Architectural sequencing (attention → interest → desire → action) - *AIDA model (E. St. Elmo Lewis, 1898)*, with the Donahoe revision substituting Want / Trust / Excuse for Interest / Desire
