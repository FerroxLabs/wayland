---
name: convert-open
slash_command: false
pack: business-conversion
family: donahoe_method
description: |
  Generate Four-Layer Opens for any direct-response asset: Layer 1 Nerve Strike + Layer 2 Side Door + Layer 3 Skin in the Game + Layer 4 Fingerprint. Produces 5 ranked opens with section-by-section breakdown.
  Use when authoring a sales page, VSL, email, ad, or any opener that must make the reader physically unable to stop reading.
  Not for headline-only generation (this is a 3-5 sentence multi-layer open, not a single headline) - sub-skill of /convert sales-page when called as part of full Method deployment.
triggers:
  - write me an opener
  - four-layer open
  - donahoe open
  - opening for my sales page
  - hook for cold traffic
  - lead-in for my email
  - nerve strike opener
  - how should I open this
negative_triggers:
  - just write a headline
  - score my existing opener
  - rewrite my hook (use convert-rewrite)
tags: [conversion, copy, donahoe-method, four-layer-open, hook, opener]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-fingerprint, convert-three-locks, convert-voice, convert-bullshit-filter]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references Halbert long-form open + Caples 35 headline formulas + Schwartz awareness levels"
---

# Convert Open - The Four-Layer Open

> *"Your opening has one job: make them keep reading. Not impress them. Not 'build rapport.' Make them physically unable to stop."* - The Donahoe Method, Framework 1

This skill generates openings using all four layers of The Donahoe Method's signature open. Four layers, 3-5 sentences, every word load-bearing.

## When to Use

Trigger phrases: "write me an opener", "donahoe open", "opening for my sales page", "hook for cold traffic", "nerve strike opener", "how should I open this", `/convert open <topic-or-product>`.

Use for any direct-response asset that needs to capture a reader inside the first 3-5 sentences: sales pages, VSL scripts, email leads, ad copy, article intros, webinar opens, presentation hooks.

Do NOT use for:
- Standalone headlines without context (the Open is multi-sentence; a single headline lives inside Layer 1)
- Rewriting an existing opener (use `convert-rewrite` instead - it preserves voice while applying the Method)
- Auditing an existing opener (use `convert-audit` for full Method scoring)

## Inputs

Required:
1. **Product / topic / offer** - what are we selling or saying?
2. **Target reader** - one specific human (Donahoe Voice Rule #1: The One Person Rule). NOT "marketers" - *"Mike, an agency owner in Ohio who's burned through $40k on Facebook ads with nothing to show"*. If the user gives a vague audience, ask for specificity in one short prompt: *"Describe the one person you're writing this for."*
3. **The Nerve** - what's the specific raw pain? Not "they're frustrated with X". *"They woke up this morning, opened their dashboard, saw zero leads, and felt that sick feeling because rent's due Tuesday."*

Optional:
- **Asset type** - sales page / VSL / email / ad / article (calibrates length and rhythm)
- **Author voice notes** - tone, vocabulary, signature phrases. If absent, default to The Donahoe Voice Rules.
- `out_path` - caller-controlled output. Defaults via `build_report_path("business-conversion", instruction)`.

## The Four Layers (full method)

### Layer 1 - The Nerve Strike

The first sentence hits a nerve that's already raw. The thing that bothered them this morning. The thing they're quietly frustrated about but haven't admitted to anyone.

**You're not introducing a problem. You're naming one they already have.** That's the difference between *"here's why you should care"* and *"I know exactly what's going on with you."*

Specifications:
- One sentence
- Specific (numbers, scenarios, sensory detail) - never abstract
- Names the pain *they already feel*, not pain you're convincing them they have
- No marketing-speak, no "Are you struggling with...?" softeners

Examples (Donahoe-style):
- ✓ *"If you made less than $10K last month from your online business, there's a specific reason - and it's probably not what you think."*
- ✓ *"You woke up this morning, checked your inbox, and counted seventeen unread emails from clients all wanting the same thing - and you still don't know how to say no."*
- ✗ *"Are you struggling to grow your business?"* (vague, performative, no nerve)
- ✗ *"In this comprehensive guide, we'll explore..."* (corporate stock opener)

### Layer 2 - The Side Door

You don't walk in through the front door announcing *"I'M HERE TO SELL YOU SOMETHING."* You come in through the side door. Casual. Like you're mentioning it in passing.

Specifications:
- 1-2 sentences
- Conversational tone - like a friend mentioning something
- Tone says "I noticed something you should probably know about"
- Defenses stay down because it doesn't sound like a pitch

Examples:
- ✓ *"I was going through some numbers the other day and noticed something weird about the way most of these courses are priced..."*
- ✓ *"A buddy of mine - runs a chiropractic clinic in Tampa - sent me a screenshot last week that I haven't been able to get out of my head."*
- ✗ *"Today I want to introduce you to a revolutionary breakthrough..."*
- ✗ *"Let me share with you the secrets that the gurus don't want you to know..."*

### Layer 3 - Skin in the Game

Within the first 3-4 sentences, the reader must know **why you're telling them this**. Not "because I'm an expert" - because you've been there. You went through it. You discovered something. You nearly missed it. You fucked it up first.

Specifications:
- 1-2 sentences
- First-person, specific scenario from your past
- Answers the unconscious question: *"Why is this person telling me this?"*
- The answer can never be "because they want my money"

Examples:
- ✓ *"Three years ago I was staring at the same dashboard, trying to figure out why my $12K/month copywriting business felt like it was running on fumes - and what I figured out changed everything."*
- ✓ *"I learned this the hard way in 2019 when I burned through $84,000 in ad spend on a launch that flatlined - and the post-mortem revealed something I'd been doing wrong for five years."*
- ✗ *"As a leading expert in direct-response marketing..."* (credential dump, not Skin in the Game)

### Layer 4 - The Fingerprint

Something in the opening that could only come from YOU. An opinion. A contrarian take. A vivid image. A way of seeing the situation that's distinctly yours.

This is the moment they decide you're worth their time - because **you don't sound like everyone else.**

Specifications:
- One distinct moment of voice - could be a single phrase, a comparison, an opinion
- Test: if you swap your name for a competitor's, would anyone notice? If yes, the Fingerprint is missing.
- Often comes through: contrarian take, signature comparison, profanity-as-precision (if matches user voice), vivid image, dismissive aside

Examples:
- ✓ *"Most of the advice out there is - and I'm being generous here - complete horseshit."*
- ✓ *"It hit me like a slap from someone who actually liked me: every funnel guru is selling you the *machine* and forgetting the *bait*."*
- ✓ *"This is the part where I'm supposed to tell you my system is the secret. It's not. The secret is so much dumber than that."*
- ✗ *"I'm passionate about helping entrepreneurs succeed."* (zero distinctive voice)

## Workflow

### Step 1 - Establish the One Person

If the user hasn't given you a specific reader, ask once. *"Describe the one person you're writing this for. Not a segment - one specific human. What's their name, what's their day look like, what's keeping them up at night?"*

If they give you a segment ("agency owners"), don't proceed - re-ask with: *"Pick one. Describe Mike specifically - his city, his stack, his last failed campaign. The Method requires it."*

### Step 2 - Identify the Nerve

What's the specific, raw, this-morning pain? Test:
- Is it a feeling, not an abstraction? ("That sick stomach feeling" not "frustration with results")
- Is it specific enough that the reader would nod and say "yeah, that's exactly my problem"?
- Is it something they've felt this week, not something hypothetical?

If the nerve isn't sharp enough, the Open will fail. Push for sharpness.

### Step 3 - Generate 5 Open candidates

Each candidate = all 4 layers, 3-5 sentences total. Mix the layer construction across candidates so the user sees range:
- Candidate 1: Direct Nerve Strike → Side Door anecdote → first-person Skin → contrarian Fingerprint
- Candidate 2: Question-form Nerve Strike → casual observation → "I learned this the hard way" → vivid metaphor
- Candidate 3: Specific-number Nerve Strike → friend-of-mine Side Door → vulnerable admission → dismissive Fingerprint
- Candidate 4: Sensory Nerve Strike → industry-observation Side Door → past-mistake Skin → opinion Fingerprint
- Candidate 5: Pattern-interrupt Nerve Strike → off-handed Side Door → discovery-moment Skin → signature comparison Fingerprint

### Step 4 - Apply Voice Rules

Every candidate must pass The Donahoe Voice Rules baseline:
- First person ("I", "you" - never "we" or "customers")
- Contractions throughout
- Mixed sentence length (short punch, longer breath, short again)
- No marketing-speak ("leverage", "optimize", "revolutionary", "unlock potential" - banned)
- Reads natural out loud (read it; if you stumble, rewrite)

### Step 5 - Bullshit Filter

Final pass: would I actually say this to someone I'm trying to help? If a candidate sounds like writing instead of talking, kill it and rewrite.

## Output template

```markdown
# Four-Layer Open: <Topic / Product>

**Reader:** <One specific person - name, city, situation>
**Nerve:** <The specific raw pain>
**Asset type:** <sales page / VSL / email / ad>

---

## Candidate 1 - <one-line variant descriptor>

> <The full 3-5 sentence open, written as it would appear>

**Layer breakdown:**
- **Nerve Strike:** "<the first sentence quoted>"  → <why it strikes the nerve>
- **Side Door:** "<the next 1-2 sentences quoted>" → <how it slips defenses>
- **Skin in Game:** "<the personal moment quoted>" → <what it earns>
- **Fingerprint:** "<the distinctive moment quoted>" → <what makes it only-you>

**Voice check:** First person ✓ | Contractions ✓ | No marketing-speak ✓ | Reads aloud natural ✓
**Bullshit Filter:** run separately via `convert-bullshit-filter` (coaching pass - no inline pass/fail stamp)

---

## Candidate 2 - <variant>
... (same structure)

## Candidate 3 - <variant>
...

## Candidate 4 - <variant>
...

## Candidate 5 - <variant>
...

---

## My pick

Recommended: **Candidate <n>** because <reason - connects most directly to the stated Nerve / fits the asset type / has the strongest Fingerprint>.

**Use this if:** <when this candidate is right>
**Swap to Candidate <m> if:** <when the alt is better>

---

## How to deploy this Open

1. Drop the recommended candidate into the asset's first 3-5 sentences.
2. Pair with `convert-three-locks` to architect what comes next (Want → Trust → Excuse).
3. Pair with `convert-chute` to engineer momentum into the next section.
4. Run `convert-bullshit-filter` on the full draft before shipping.

## Lineage

The Four-Layer Open is part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:
- Layer 1 (Nerve Strike) - Halbert's "lead with the pain" canon (Boron Letters, 1984)
- Layer 1 sub-formulas - Caples 35 headline formulas (Tested Advertising Methods, 1932)
- Layer 4 (Fingerprint) - informed by Schwartz's "market sophistication" requiring a unique angle (Breakthrough Advertising, 1966)
```

## Notes

- Layer 1 should make them stop scrolling. Layer 2 should keep them reading without realizing they're being sold to. Layer 3 should make them trust you. Layer 4 should make them remember you.
- If the user pushes back on a Nerve Strike for being "too aggressive," that's usually because the nerve isn't actually their target reader's nerve - they're projecting their own discomfort. Push back gently: *"This isn't aggressive - it's specific. Specific is what works on this audience. Want me to find a different specific?"*
- The Fingerprint is the hardest layer to teach an AI. If your Fingerprint candidates feel generic, return to the One Person Rule: what would *you* say to *them* over coffee? That's the Fingerprint.
- This is the Open. Pair it with `convert-proof`, `convert-three-locks`, `convert-bullets`, `convert-close`, `convert-chute`, and `convert-voice` to build full assets.
