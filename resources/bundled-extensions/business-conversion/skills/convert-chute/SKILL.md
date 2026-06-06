---
name: convert-chute
slash_command: false
pack: business-conversion
family: donahoe_method
description: |
  Engineer the Greased Chute: open loops, paragraph length, sentence rhythm, transition curiosity, read-aloud test. Makes every sentence pull the reader into the next so the asset feels frictionless to read end-to-end.
  Use when a draft exists and you need to engineer momentum - kill friction at scroll-points, install open loops, vary rhythm, fix energy drops.
  Not for writing a draft from scratch (use convert-sales-page or convert-vsl) and not for transition-line generation alone (use convert-transition).
triggers:
  - grease the chute
  - greased chute
  - donahoe chute
  - momentum pass
  - read aloud test
  - install open loops
  - fix the rhythm
  - kill friction
  - flow pass on this
negative_triggers:
  - write a sales page from scratch
  - design the offer
  - audit my page (use convert-audit)
  - score my conversion
tags: [conversion, copy, donahoe-method, greased-chute, momentum, rhythm]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-open, convert-transition, convert-voice, convert-bullshit-filter, convert-sales-page, convert-vsl]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references *Sugarman 'slippery slide' principle (AdWeek Copywriting Handbook, 1998)*, *Halbert short-paragraph canon (Boron Letters, 1984)*, and *Robert Bly's varied-rhythm doctrine (The Copywriter's Handbook, 1985)*"
---

# Convert Chute - The Greased Chute

> *"Every sentence in your copy has one job: make the next sentence impossible not to read. This isn't about 'flow' in the literary sense. It's about engineering momentum. The reader should feel like they're sliding down a chute - once they start, friction is zero and they can't stop until they hit the bottom."* - The Donahoe Method, Framework 6

This skill takes an existing draft and engineers momentum - installing open loops, varying paragraph length, fixing sentence rhythm, sharpening transitions, and applying the read-aloud test until the whole piece reads like one continuous thought.

If they stop reading, nothing else matters. The Greased Chute is non-optional.

## When to Use

Trigger phrases: "grease the chute", "greased chute", "donahoe chute", "momentum pass", "read aloud test", "install open loops", "fix the rhythm", "kill friction", "flow pass on this", `/convert chute <draft>`.

Use this skill on a draft that is structurally complete but reads stiff, dense, or laggy. The Chute pass is a *post-draft* engineering pass - it doesn't replace any of the writers (`convert-open`, `convert-bullets`, `convert-close`); it makes their output unstoppable.

Do NOT use for:
- Writing the asset from scratch (use `convert-sales-page` / `convert-vsl`)
- Generating individual transition lines (use `convert-transition` for the 10-move library)
- Auditing for Method-fit (use `convert-audit`)
- Scoring conversion rate (use `convert-audit`)

## Inputs

Required:
1. **The draft** - paste in the full asset, or specific sections that feel sticky. The Chute pass works on any size - paragraph, section, or full page.
2. **Read-target** - what's the target read mode (skim from mobile / focused on desktop / spoken aloud as a VSL script)? Different read-modes need different rhythms.

Optional:
- **Friction notes** - if the user knows where they stumble, mark it (*"section 3 feels boring"*, *"I lose energy after the bullets"*)
- **Asset type and length budget**
- `out_path` - caller-controlled output. Defaults via `build_report_path`.

## The Five Chute Levers (full method)

### 1. Open Loops

Start a thought and don't finish it yet. The reader HAS to keep reading to close the loop.

**The technique:**
- Drop a thread that won't be resolved until 2-5 paragraphs later: *"But that's not even the interesting part - and I'll get to that in a second."*
- Stack open loops so there's *always* an unresolved thread pulling the reader forward
- Close earlier loops as you open new ones

Specifications:
- Each major section opens at least one loop into the next section
- A long-form sales page should have 3-7 active loops at any moment
- Every loop must eventually close - orphaned loops break trust

Examples:
- ✓ *"...and I'll show you the exact email I sent in a minute. But before that, you need to understand why everyone else's version of this fails first."*
- ✓ *"That part's important - but it's not the part that actually moved the needle. We'll get to the real lever in section three."*
- ✗ *"Now let's discuss our next topic."* (announces the next section, kills the open loop)

### 2. Short Paragraphs

One to three sentences max. White space is your friend. A wall of text creates friction. Short paragraphs create the feeling of speed - the reader's eye keeps moving because the next paragraph is RIGHT THERE.

Specifications:
- Mobile read-target: 1-2 sentence paragraphs throughout
- Desktop read-target: 1-3 sentence paragraphs, occasional 4-sentence paragraph for variety
- VSL script read-target: 1 sentence per paragraph, treated as a beat
- Single-line paragraphs (one short sentence alone) are *emphasis tools* - use sparingly, and they hit hard

### 3. Varied Rhythm

Short sentence. Short sentence. Then a slightly longer one that flows and breathes and lets them absorb. Then short again. The variation creates a pulse that keeps the reader's brain engaged.

**Uniform sentence lengths are monotonous - monotony is friction.**

Specifications:
- Aim for sentence-length variation of at least 3:1 across any section (some sentences 3-5 words, others 15-25 words)
- After 2 long sentences, drop a short one
- After 3 short sentences, write one breath-sentence
- Listen for the *pulse* when reading aloud - if the rhythm flatlines, rewrite

Examples:

✓ Donahoe rhythm:
> *"Most copywriting advice is built on a lie.*
> *The lie is that you need to sound polished and professional and use big words to be taken seriously, when actually the opposite is true - the most-converting copy on the internet sounds exactly like one person talking to another over coffee, with all the broken sentences and asides and casual little jokes that real conversation contains.*
> *Sound polished? You sound like a press release.*
> *Sound real? You sound like someone they trust."*

✗ Monotone rhythm (kills momentum):
> *"Most copywriting advice is wrong. You should sound conversational. People trust real voices. Polished copy doesn't convert. Casual copy converts better. This is the secret."*

### 4. Curiosity at Transitions

**Never end a section with a conclusion. End with a tease.**

The reader crosses every section boundary because you've made the next section irresistible.

Specifications:
- Final sentence of every section opens a loop into the next section
- Avoid summarizing what you just said (summary kills momentum)
- Use the moves from `convert-transition` - Comparison Bomb, Escalation, Aside Bomb, Diagnostic, etc.

Examples:

✓ Section ending that pulls forward:
> *"Now, that's a solid approach. But what I'm about to show you in the next section makes that look like a warmup."*

✓ Diagnostic transition (cuts forward without filler):
> *"So what's the actual problem?"*

✗ Section ending that stalls:
> *"In summary, we've covered the basics of lead generation. Now let's move on to the next topic."* (announces the move, kills momentum)

### 5. The Read-Aloud Test

**Read your copy out loud at speaking pace.** Every place you stumble, every place you'd naturally pause and check your phone, every place the energy drops - that's friction. That's where you're losing people. Fix it until the whole piece reads like one continuous thought.

Specifications:
- Read at conversational pace, not declamatory
- Mark every stumble with `[FRICTION]` and rewrite
- Mark every energy drop with `[ENERGY]` and rewrite
- Mark every place you'd naturally check your phone with `[CHECK-OUT]` and rewrite

The read-aloud test is the final filter. If you wouldn't say it that way across a coffee table, rewrite it.

## Workflow

### Step 1 - Inventory the friction

Read the draft once at speaking pace. Mark every stumble. Mark every wall of text. Mark every section ending that summarizes instead of teases. Mark every monotone stretch of sentence rhythm.

### Step 2 - Open Loop pass

Walk through the draft section by section. For each section break, ask: does the last sentence pull the reader into the next section?

If no, rewrite the last sentence to open a loop. Use the `convert-transition` library if needed.

Verify: at any point in the draft, are there 3+ active open loops the reader is waiting on?

### Step 3 - Paragraph-length pass

Hunt for paragraphs > 4 sentences. Break them. Hunt for stretches of 5+ identical-length paragraphs in a row. Break that monotony with a one-line paragraph for emphasis.

### Step 4 - Sentence-rhythm pass

Run through each section reading just for rhythm. Mark sections where 4+ consecutive sentences are the same length.

Rewrite to achieve at least 3:1 length variation. If a section is all short, add a breath-sentence. If all long, drop a punchy short one.

### Step 5 - Transition curiosity pass

For every section ending, replace any "conclusion" / "summary" / "in this section we covered" / "now let's discuss" with a curiosity tease.

Use specific moves from the Transition System:
- Comparison Bomb
- Escalation
- Aside Bomb
- Interrupt
- Dismiss
- Diagnostic
- Assumed Agreement
- Internal Moment
- Admission
- Energy Drop

(See `convert-transition` for the full library.)

### Step 6 - Final read-aloud test

Read the entire draft aloud, end to end, at speaking pace. Mark every:
- Stumble
- Energy drop
- Place you'd check your phone
- Place that sounds like writing instead of talking

Rewrite each. Then read aloud again. Continue until the read is clean.

### Step 7 - Bullshit Filter

A draft that sounds smooth but reads like marketing-speak still fails. Apply the Bullshit Filter on the final version: would I actually say this to someone I'm trying to help? If any sentence answers "no", kill it.

## Examples (before / after)

### Before - sticky paragraph

> *"In today's competitive marketplace, it has become increasingly important for entrepreneurs to develop a strong online presence in order to reach their target audience effectively. Many business owners struggle to navigate the complex landscape of digital marketing. They often find themselves overwhelmed by the multitude of options available and unsure where to focus their efforts. This is where our comprehensive system comes in to provide clarity and direction."*

Friction: marketing-speak, monotone rhythm, no open loop, abstract.

### After - Chute pass

> *"Most service businesses are getting outspent by people who don't even know what they're doing.*
>
> *That's not an insult - it's just what happens when one operator has the system and the other one's running on instinct. The system always wins.*
>
> *And here's the part nobody tells you: the system doesn't have to be complicated. The version that worked for me, and for the operators I've shown it to, is dead simple. Three components. One mechanism.*
>
> *I'll show you what it is in a minute. But first, the failure pattern that almost everyone falls into - including me, in 2017 - and why it costs about $4,800 a week in jobs lost to whoever's better positioned in your zip code."*

Fixes: short paragraphs, varied rhythm, two open loops (the system reveal + the failure pattern), conversational voice, transition pulls forward.

### Before - section ending that stalls

> *"In conclusion, we have explored the basics of lead generation in this section. We will now move on to discuss pricing strategies."*

### After - Chute-pass section ending

> *"And that's the easy part of the system - the bones of it. The harder part - the part that actually decides whether you're charging $99 or $1,997 - is what we're getting to next."*

## Output template

```markdown
# Chute Pass - <Asset / Section>

**Read-target:** <mobile skim / desktop focus / VSL spoken / email>
**Length before:** <words>
**Length after:** <words>

---

## Friction inventory (pre-pass)

| Location | Friction type | Severity |
|----------|--------------|----------|
| Section 1 closing | No open loop, summary ending | High |
| Bullets → proof | Monotone rhythm | Medium |
| Section 4 paragraph 3 | Wall of text (7 sentences) | High |
| Mid-page transition | "Now let's discuss" filler | Medium |

---

## Pass 1 - Open Loops installed

| # | Location | Loop opened | Loop closes at |
|---|----------|-------------|----------------|
| 1 | Open → Problem | "the reason this fails" | Section 3 mid |
| 2 | Story → Bullets | "the actual mechanism" | Section 5 |
| 3 | Bullets → Close | "the price isn't the price" | Math Close |

**Active loops at deepest mid-point:** <number - should be 3+>

---

## Pass 2 - Paragraph lengths

- Walls broken: <n>
- Single-line emphasis paragraphs added: <n>
- Average paragraph length: <before n.n sentences → after n.n sentences>

---

## Pass 3 - Sentence rhythm

| Section | Pre-pass length variation | Post-pass length variation |
|---------|--------------------------|----------------------------|
| 1 | 1.4:1 (monotone) | 4.2:1 (varied) |
| 2 | 1.8:1 | 3.9:1 |
| ... | | |

---

## Pass 4 - Transition curiosity

| Section break | Before | After (tease) | Move used |
|---------------|--------|---------------|-----------|
| Open → Problem | "Let's look at the problem." | "And that's where the real failure pattern starts." | Diagnostic |
| Story → Bullets | "Here's what I learned." | "What I'm about to show you costs me about an hour to teach and saved me $84k of mistakes." | Comparison Bomb |
| ... | | | |

---

## Pass 5 - Read-aloud results

**Stumbles fixed:** <n>
**Energy drops fixed:** <n>
**"Check phone" moments fixed:** <n>
**Sentences rewritten because they sounded like writing not talking:** <n>

---

## Final draft

> <The full Chute-passed copy goes here>

---

## Bullshit Filter

- [ ] At every mid-point, 3+ active open loops are running
- [ ] No paragraph runs longer than 4 sentences (1-3 sentence default)
- [ ] Sentence-length variation is at least 3:1 in every section
- [ ] Every section ends with a curiosity tease, not a summary
- [ ] Read-aloud passes - no stumbles, no energy drops, no check-out points
- [ ] Final pass: every sentence is something I'd say across a table to one person
```

## Notes

- The Chute pass is *engineering*, not rewriting from scratch. It works on existing structure. If the underlying architecture is broken (no Open, no Three Locks, no Close), don't Chute-pass - fix the architecture first.
- The most common Chute failure: monotone rhythm. Writers default to medium-length sentences because medium feels safe. Medium is friction. Pulse is what reads.
- The second most common failure: orphaned open loops. Writers love teasing the next thing but forget to close earlier loops. Every loop opened must close. A trail of unresolved teases reads as gimmicky.
- For VSL scripts (spoken read-target), paragraph "lengths" become *beats*. Each one-sentence beat = one breath the speaker takes. Read the script aloud at speaking pace and time it; if it's longer than your stated VSL length, cut beats, not words within beats.
- This skill composes with `convert-transition` (which provides the 10-move library the Chute pass uses for section endings) and `convert-bullshit-filter` (the final filter run on the Chute-passed draft).

## Lineage

The Greased Chute is part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:
- The "slippery slide" - *Joseph Sugarman, the AdWeek Copywriting Handbook (1998)*: "the sole purpose of every sentence is to get you to read the next sentence"
- Short-paragraph doctrine - *Gary Halbert, the Boron Letters (1984)*: white space as pacing
- Sentence-rhythm variation - *Robert Bly, The Copywriter's Handbook (1985)*
- Open-loop / curiosity-gap mechanics - drawn from screenwriting (*Robert McKee, Story, 1997*) and applied to direct response by *John Carlton, Kick-Ass Copywriting Secrets (2003)*
- The read-aloud test - *David Ogilvy, Confessions of an Advertising Man (1963)*: "if it doesn't sound natural when spoken, it doesn't read natural either"
