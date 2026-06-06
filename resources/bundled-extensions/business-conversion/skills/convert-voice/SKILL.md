---
name: convert-voice
slash_command: false
pack: business-conversion
family: donahoe_method
description: |
  Apply The Donahoe Voice Rules: sentence mechanics, word choices, structural moves, and the Bullshit Filter as a checklist. Operating system for every piece of copy - every headline, email, sales page, ad - passes through these non-negotiable rules.
  Use when a draft exists in some voice (yours, AI default, marketing-bro) and you need to bring it to Donahoe Voice - first-person, contractions, specific, no marketing-speak, reads aloud natural.
  Not for engineering momentum (use convert-chute) and not for the standalone Bullshit Filter pass (use convert-bullshit-filter).
triggers:
  - apply donahoe voice
  - voice rules pass
  - donahoe voice
  - kill the marketing speak
  - rewrite in donahoe voice
  - voice check
  - make this sound like donahoe
  - sentence mechanics pass
negative_triggers:
  - score my conversion rate
  - audit my page
  - just generate a hook
  - momentum pass (use convert-chute)
tags: [conversion, copy, donahoe-method, voice-rules, voice]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-bullshit-filter, convert-fingerprint, convert-chute, convert-open, convert-bullets, convert-close, convert-sales-page]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references *Halbert plain-spoken canon (Boron Letters, 1984)*, *Ogilvy 'how to write' rules (Confessions of an Advertising Man, 1963)*, and *Strunk & White brevity doctrine (The Elements of Style, 1918)*"
---

# Convert Voice - The Donahoe Voice Rules

> *"These are non-negotiable. Every piece of copy - headline, email, sales page, webinar script, social post, ad - passes through these rules. They're not stylistic preferences. They're the operating system."* - The Donahoe Method, Voice Rules

This is the full Voice Rules pass: sentence mechanics, word choices, structural moves, and the Bullshit Filter on top. The output reads like one specific human telling another specific human about something that genuinely works.

The voice IS the method. Everything else is technique.

## When to Use

Trigger phrases: "apply donahoe voice", "voice rules pass", "donahoe voice", "kill the marketing speak", "rewrite in donahoe voice", "voice check", "make this sound like donahoe", "sentence mechanics pass", `/convert voice <draft>`.

Use when:
- A draft exists in default-AI voice or marketing-bro voice and needs Donahoe-fication
- A draft is structurally good but reads stiff
- The user wants a final voice pass before shipping
- A team-written draft has multiple voices and needs unification

Do NOT use for:
- Engineering momentum (use `convert-chute` - the Chute pass handles rhythm; Voice handles word choice and sentence mechanics)
- The standalone "would I actually say this?" filter (use `convert-bullshit-filter` - Voice runs the filter as one of several rules; the standalone version is the deeper isolated pass)
- Auditing for Method-fit (use `convert-audit`)
- Writing from scratch (use `convert-sales-page` / `convert-vsl` / `convert-open`)

## Inputs

Required:
1. **The draft** - paste in the section, page, or full asset
2. **Read-target** - sales page / email / VSL spoken / ad / headline-only - different read-targets have slightly different voice calibrations

Optional:
- **Existing seller voice samples** - if the seller has a signature voice, the Voice pass keeps Donahoe Voice Rules as the floor and layers seller voice on top
- **Banned-words list** specific to the seller (some sellers don't use profanity; some have specific words they avoid)
- `out_path` - caller-controlled output. Defaults via `build_report_path`.

## The Voice Rules (full method)

### Sentence Mechanics

These are the structural rules. Non-negotiable on every line.

**1. First person. Always.**
- "I" not "we"
- "you" not "customers" or "clients" or "users"
- The voice is one specific person to one specific person

✓ *"I learned this the hard way in 2019."*
✗ *"Our team has discovered through extensive research..."*

**2. Short paragraphs. 1-3 sentences.**
- White space isn't wasted space - it's pacing
- A wall of text creates friction
- Single-line paragraphs are emphasis tools - use sparingly, hit hard

**3. Mixed sentence lengths.**
- Short punch. Then a longer one that flows and breathes and gives the reader room to absorb. Then short again.
- Never uniform. The variation creates a pulse.
- See `convert-chute` for the rhythm engineering rules.

**4. Contractions.**
- "You're" not "you are"
- "Don't" not "do not"
- "It's" not "it is"
- Writing without contractions sounds like a terms-of-service agreement

**5. Read it out loud. Every time.**
- If you stumble, rewrite
- If it feels weird, rewrite
- If you wouldn't say it that way across a table, rewrite

### Word Choices

These are the word-level rules.

**6. Specificity over generality.**
- "$14,327 in 11 days" - not "significant revenue"
- "Tuesday morning at 6am" - not "soon"
- "Mike, a plumber from Akron" - not "a service business owner"
- Numbers, names, dates, places. Always.

✓ *"I pulled $14,327 in 11 days from a list of 2,200 people."*
✗ *"I generated significant revenue from a substantial list."*

**7. Visceral over abstract.**
- "Stomach-churning" - not "concerning"
- "Cash hitting your account" - not "revenue generation"
- "Wake up and check your phone" - not "monitor your results"
- Make them FEEL it.

✓ *"You wake up, you roll over, you check your phone, and there are four new sales notifications."*
✗ *"Customers experience improved revenue metrics through optimized conversion funnels."*

**8. Profanity as a precision tool.**
- Used for emphasis at key emotional moments, never as filler
- Signals "I'm being so real with you right now that I'm not even filtering myself"
- One well-placed "bullshit" hits harder than a paragraph of polite disagreement
- Used every other sentence, it's just noise - and signals the opposite of confidence
- Match the seller's voice - if the seller doesn't curse, don't insert it

✓ *"Most of the advice out there is - and I'm being generous here - complete horseshit."*
✗ Profanity sprinkled in every paragraph for "edge"

**9. Kill every word that sounds like marketing.**

Banned-on-sight word list (replace or delete on every encounter):

| Banned | Why it fails | Replace with |
|--------|--------------|--------------|
| Leverage | Corporate filler verb | Use / apply / pull / run |
| Optimize | Buzzword | Improve / fix / make better |
| Revolutionary | Empty intensifier | (Specific result instead) |
| Game-changing | Cliché | (Specific result instead) |
| Unlock your potential | Self-help cliché | (Specific outcome instead) |
| Take your business to the next level | Dead phrase | (Specific upgrade instead) |
| Cutting-edge | Empty intensifier | (Specific mechanism instead) |
| Best-in-class | Corporate filler | (Specific differentiation instead) |
| Synergy | Press-release filler | Delete |
| Robust | Empty | (Specific feature instead) |
| Streamline | Buzzword | Simplify / cut |
| Holistic | Marketing word | Whole / complete |
| Scalable | Overused | (Specific scaling fact instead) |
| Solution(s) | Replaces specifics | The actual thing it is |
| Empower | Cliché verb | (Specific capability instead) |
| Transform | Vague verb | (Specific change instead) |

If a word would appear in a corporate press release, delete it.

### Structural Moves

These are the optional voice moves that make Donahoe copy feel like Donahoe and not just clean prose.

**10. Questions to the reader.** Rhetorical and genuine, mixed.
- *"Sound familiar?"*
- *"You know what happened next?"*
- *"Want to know the weird part?"*

**11. Micro-stories.** Even 1-2 sentences.
- *"I tried this myself last March. Worked the first time."*
- These tiny stories ground abstract claims in concrete reality.

**12. Break the fourth wall.** Acknowledge you're selling.
- *"Yeah, I'm about to pitch you something. But hear me out first."*
- Nobody does this. That's why it works - transparency is so rare in marketing that it becomes a weapon.

**13. Humor from personality, not jokes.**
- Comes from observation, specificity, and a slightly irreverent way of seeing things
- Never forced - if it doesn't come naturally in the moment, don't manufacture it
- Forced humor is worse than no humor

**14. The aside.** Parenthetical thoughts, brief tangents that feel off-script but are calculated.
- *"(And honestly, this surprised me too.)"*
- These make the reader feel like they're getting the unedited, backstage version

### The Bullshit Filter (as a Voice Rule)

Before any line ships, apply the single filter:

> **"Would I actually say this to someone I'm trying to help?"**

If the answer is no - if it sounds like writing instead of talking, if it sounds like "copy" instead of conversation - rewrite it until it sounds like you're sitting across from one person, telling them about something that genuinely works.

If you'd be embarrassed to read it out loud to a friend, it fails the filter. Kill it. Rewrite it. Make it real.

(For a deeper standalone pass on the filter alone, see `convert-bullshit-filter`.)

## Workflow

### Step 1 - Inventory the voice violations

Read the draft and mark every:
- Third-person reference ("our team", "our customers")
- Lack of contractions ("do not", "you are", "it is")
- Banned marketing word (the table above)
- Abstract phrase that should be specific
- Wall of text (paragraph >4 sentences)
- Section without structural variety (no question, no aside, no micro-story across 600+ words)

### Step 2 - Sentence Mechanics pass

Walk the draft top-to-bottom:
- Replace every "we / our / customers" with "I / you"
- Add contractions everywhere they're missing
- Break paragraphs > 4 sentences
- Read each sentence aloud at speaking pace

### Step 3 - Word Choices pass

Walk the draft again with the banned word list active. For each banned word found:
- Delete the sentence and rewrite
- Replace with a specific equivalent
- Replace abstract claims with visceral / sensory equivalents
- Replace generic numbers with non-round specifics

### Step 4 - Structural Moves pass

Once the voice is clean, layer in personality:
- Add 2-4 reader questions across a long-form draft
- Add 2-3 micro-stories
- Drop one fourth-wall break ("look, I'm pitching you, but...")
- Add 1-3 parenthetical asides if the seller voice supports it
- Don't overuse - these are seasoning, not main course

### Step 5 - Bullshit Filter pass

For every paragraph, ask: would I say this to someone I'm trying to help? Mark every "no" answer with `[BS]` and rewrite.

### Step 6 - Final read-aloud

Read the entire draft aloud, end to end. Mark every stumble, every cringe, every place that sounds like writing. Rewrite. Read again. Continue until clean.

## Examples (before / after)

### Before - third-person, no contractions, marketing-speak

> *"Our team has developed a revolutionary lead-generation solution that empowers entrepreneurs to optimize their customer acquisition strategies. With our cutting-edge methodology, you will be able to take your business to the next level and unlock your true potential."*

### After - Donahoe Voice

> *"Look - I built this because I was bleeding $4,800 a week in jobs to whoever else was running ads against my zip code. I tried five different things first. Four of them flopped. The one that worked is the system you're about to see, and the reason it worked has nothing to do with funnel tricks. It works because it charges per verified-intent caller, not per impression. That's it. That's the whole mechanism."*

Voice fixes: first-person, contractions throughout, specific numbers ($4,800, five things, four flopped), visceral ("bleeding"), banned words removed (revolutionary / empower / cutting-edge / unlock / next level), structural variety (short → longer → short rhythm), Bullshit Filter passes.

---

### Before - abstract, monotone, no fingerprint

> *"Many entrepreneurs struggle with consistent lead generation. This is a common challenge that can significantly impact business growth. We have created a comprehensive system to address this challenge effectively."*

### After

> *"You know that feeling - Tuesday morning, you check the dashboard, and the lead count is the same as it was Friday?*
>
> *Yeah. Most service operators live there.*
>
> *I lived there for nine years before I figured out the LSA mechanism that took me from $11k months to $38k months. I'll show you exactly how in a minute. But first, here's why everything else is failing you."*

---

### Before - banned phrase salad

> *"Leverage our proven methodology to optimize your funnel and unlock revolutionary results. Take advantage of this game-changing opportunity to transform your business today."*

### After

> *"This is the same play I ran on my own crew last quarter - went from 4 calls a week to 23 in 31 days. Not theory. Same system, same template, same one-page setup. I'll walk you through it now."*

## Output template

```markdown
# Voice Pass - <Asset / Section>

**Read-target:** <sales page / email / VSL spoken / ad / headline>
**Pre-pass voice profile:** <AI default / marketing-bro / corporate / mixed / Donahoe-adjacent>

---

## Pre-pass violation inventory

| Rule violated | Count | Examples |
|---------------|-------|----------|
| Third-person / "we / our" | 12 | "our team", "our customers", "we offer" |
| Missing contractions | 18 | "do not", "you are", "it is" |
| Banned marketing words | 9 | leverage, unlock, revolutionary, optimize, transform |
| Abstract instead of specific | 7 | "significant revenue", "many clients", "various industries" |
| Wall of text (>4 sentences) | 4 | sections 2, 3, 5, 7 |
| No structural variety (no question / aside / micro-story) | section 4 | (600+ words straight prose) |

---

## Pass 1 - Sentence Mechanics fixes

| # | Before | After | Rule |
|---|--------|-------|------|
| 1 | "Our team has developed..." | "I built this because..." | First-person |
| 2 | "You are going to discover..." | "You're going to see..." | Contraction |
| 3 | (5-sentence paragraph) | (broken into three) | Paragraph length |
| ... | | | |

---

## Pass 2 - Word Choices fixes

| # | Before | After | Banned word killed |
|---|--------|-------|--------------------|
| 1 | "leverage our methodology" | "use the system" | leverage |
| 2 | "revolutionary results" | "23 calls in 31 days" | revolutionary |
| 3 | "significant revenue" | "$14,327 in 11 days" | abstract → specific |
| ... | | | |

---

## Pass 3 - Structural moves added

| Move | Where | Copy |
|------|-------|------|
| Reader question | Section 1 | "Sound familiar?" |
| Micro-story | Section 2 | "I tried this myself last March. Worked the first time." |
| Fourth-wall break | Section 4 | "Yeah, I'm about to pitch you something. Hear me out first." |
| Aside | Section 3 | "(And honestly, this surprised me too.)" |

---

## Pass 4 - Bullshit Filter

| Paragraph | Filter result | Action |
|-----------|--------------|--------|
| Section 1, paragraph 2 | PASS | Keep |
| Section 2, paragraph 4 | FAIL - sounded like writing | Rewrote: "<new line>" |
| ... | | |

---

## Final draft

> <The Donahoe Voice version of the full draft>

---

## Bullshit Filter (final)

- [ ] First-person throughout (I / you, never we / customers / users)
- [ ] Contractions everywhere they fit
- [ ] Paragraph max 3-4 sentences (mostly 1-3)
- [ ] Sentence rhythm varied at least 3:1
- [ ] No banned marketing words remain
- [ ] Specifics replace abstractions throughout
- [ ] At least one reader question per long-form section
- [ ] At least one micro-story per long-form section
- [ ] At least one structural variety move (question / aside / fourth-wall)
- [ ] Read-aloud passes - no stumbles, no cringes, no "this sounds like writing"
- [ ] Filter: would I say this to someone I'm trying to help? - YES on every paragraph
```

## Notes

- This is the rulebook. Every other skill in this pack (`convert-open`, `convert-bullets`, `convert-close`) writes inside it by default - but on a multi-author draft, voice drifts. One writer keeps it tight, the next slips into corporate. This is the cleanup pass before the bell.
- The most common Voice failure: keeping abstract phrases. AI defaults to abstract because abstract feels safe. Donahoe Voice is unsafely specific. *"$4,800 a week"* and *"Tuesday at 6am"* and *"Mike, Akron, plumber"* are the texture.
- The second most common failure: dropping the structural moves. Without questions, asides, micro-stories, and fourth-wall breaks, even clean Donahoe-rules copy can read flat. The structural moves are what give it personality.
- For B2B / enterprise contexts where the seller voice is more formal, keep the Voice Rules as the floor (first-person, contractions, no marketing-speak, specifics) but tone down profanity and lighten the irreverence. The rules don't change; the seasoning does.
- For headline-only generation, only Sentence Mechanics + Word Choices + Bullshit Filter apply. Structural moves don't fit a single headline.
- Pair this with `convert-fingerprint` (which develops the only-you POV that makes Donahoe Voice not just clean but *distinctive*) and `convert-bullshit-filter` (the deeper isolated final pass).

## Lineage

The Donahoe Voice Rules are part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:
- Plain-spoken first-person mandate - *Gary Halbert, the Boron Letters (1984)*: "write like one person to one person"
- Banned-marketing-word list - extends *David Ogilvy's "how to write" rules (Confessions of an Advertising Man, 1963)* and *George Orwell's "Politics and the English Language" (1946)* for direct-response context
- Brevity / contractions / read-aloud test - *Strunk & White, The Elements of Style (1918)*
- Specificity-as-credibility - *Halbert specificity canon (Boron Letters, 1984)*
- Structural moves (questions, asides, fourth-wall) - common across *Halbert / Carlton / Sugarman* sales-letter tradition
