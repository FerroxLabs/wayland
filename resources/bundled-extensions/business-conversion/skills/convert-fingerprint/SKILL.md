---
name: convert-fingerprint
slash_command: false
pack: business-conversion
family: donahoe_method
description: |
  Develop the Fingerprint - the only-you POV / contrarian take / vivid voice moment that lives inside the Four-Layer Open and recurs across the asset. Outputs a fingerprint pack: signature moments, contrarian takes, vivid images, and seller-specific phrases that make copy unswappable.
  Use when copy reads "fine" but generic - when swapping the seller's name for a competitor's wouldn't change anything - and you need the distinctly-this-person voice layer.
  Not for the full Four-Layer Open generation (use convert-open) and not for the Voice Rules pass (use convert-voice).
triggers:
  - find my fingerprint
  - donahoe fingerprint
  - develop the only you voice
  - contrarian take
  - vivid image
  - what makes this sound like me
  - distinctive voice moment
  - layer 4 fingerprint
negative_triggers:
  - write me a hook
  - write a sales page
  - audit my page
  - voice rules pass (use convert-voice)
tags: [conversion, copy, donahoe-method, four-layer-open, fingerprint, voice]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-open, convert-voice, convert-bullshit-filter, convert-three-locks, convert-bullets, convert-sales-page]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references *Schwartz market sophistication doctrine (Breakthrough Advertising, 1966)* requiring a unique angle, *Carlton 'big idea' tradition (Kick-Ass Copywriting Secrets, 2003)*, and *Ogilvy 'every advertisement should contribute to the brand image' (Confessions of an Advertising Man, 1963)*"
---

# Convert Fingerprint - The Only-You POV

> *"Something in the opening that could only come from YOU. An opinion. A contrarian take. A vivid image. A way of seeing the situation that's distinctly yours. This is the moment they decide you're worth their time - because you don't sound like everyone else."* - The Donahoe Method, Layer 4 of the Four-Layer Open

The Fingerprint is the hardest layer in the Method to teach. It's also the one that decides whether a reader bookmarks you or scrolls on. This skill develops the only-you voice - contrarian takes, vivid images, signature comparisons, dismissive asides, opinion shrapnel - and outputs a Fingerprint pack the rest of the asset deploys throughout.

The test: if you swap the seller's name for a competitor's, would anyone notice? If yes, the Fingerprint is missing. This skill makes sure the answer is no.

## When to Use

Trigger phrases: "find my fingerprint", "donahoe fingerprint", "develop the only-you voice", "contrarian take", "vivid image", "what makes this sound like me", "distinctive voice moment", "layer 4 fingerprint", `/convert fingerprint <topic or seller>`.

Use when:
- A draft is structurally clean and Voice-rule-compliant but reads generic
- You're standing up a new seller's voice and need the distinctive layer before any asset ships
- A long-form asset has the Open Fingerprint but no Fingerprint moments downstream - and the middle reads flat
- Multiple drafts from different writers need a single seller voice unified

Do NOT use for:
- Full Four-Layer Open generation (use `convert-open` - Fingerprint is Layer 4 of that skill; this standalone develops Fingerprint *across the whole asset*)
- The full Voice Rules pass (use `convert-voice` - Voice handles mechanics; Fingerprint handles distinctiveness)
- Auditing existing copy (use `convert-audit`)
- Brand strategy / positioning (different problem; use `funnels-pull-authority` if available)

## Inputs

Required:
1. **Seller** - who is the "I" of the asset? Real human, real history, real opinions.
2. **Seller's actual opinions** - what do they actually believe about the topic that *most* people in the field don't? List 3-5 contrarian takes the seller would defend over coffee, not from a script.
3. **Seller's signature observations** - what do they notice that no one else does? Specific, vivid moments from their work.

Optional:
- **Existing samples of seller voice** - emails, podcasts, off-the-cuff videos. Off-the-cuff is gold; produced content is often Fingerprint-stripped.
- **Competitive landscape** - who else writes about this topic? The Fingerprint differentiates against them specifically.
- **Topic or asset the Fingerprint is being developed for**
- `out_path` - caller-controlled output. Defaults via `build_report_path`.

## The Fingerprint (full method)

The Fingerprint comes through five expression types. A strong asset deploys 3-5 across its length.

### 1. The Contrarian Take

An opinion most of the field disagrees with - that the seller can defend.

Specifications:
- A specific, named common belief (not "common wisdom")
- The seller's specific, named alternative
- Defensible - not contrarian for the sake of edge

Examples:
- ✓ *"Most of the advice out there about email frequency is - and I'm being generous here - complete horseshit. The 'don't email more than once a week' rule was invented by people who never actually built a list that paid them. I email five times in 24 hours during a launch and the unsubscribes are nothing compared to the revenue."*
- ✓ *"Everyone tells you to find your niche. I think that's exactly backward. Pick the niche that finds you back - the one that pays you for the work you'd do anyway."*
- ✗ *"I disagree with conventional wisdom."* (vague, no specifics, no defensible alternative)

### 2. The Signature Comparison

A vivid image or analogy that anchors a complex idea instantly. Comparison Bombs from the Transition System turned into seller signature moves.

Specifications:
- Specific reference (not "it's like Netflix" but "it's like a Sunday afternoon at the DMV, but the line moves")
- Pulled from the seller's actual life, not from cultural cliché
- Reusable - strong enough that the seller can come back to it across multiple assets

Examples:
- ✓ *"It's like cold-calling, except the customer makes the call - and they already have your service in their search history."*
- ✓ *"Picture an agency retainer, except you keep all the margin and the customer never asks for a status meeting."*
- ✓ *"Think of a launch like a cargo plane: you can load anything you want into it, but if the runway isn't long enough, you crash. Most people pack the plane perfectly and skip the runway entirely."*

### 3. The Vivid Image

A specific, sensory moment that reads like film, not copy. Often from the seller's actual life.

Specifications:
- Sensory (sight / sound / feel / time-of-day)
- Specific (named place, real moment)
- Anchors a claim with film-like detail

Examples:
- ✓ *"It was a Tuesday in March 2019. I was at my kitchen table - the one with the chip in the corner from when my kid threw a Lego at it - staring at a dashboard that said zero. That's when I figured out the mechanism that pulled $84k out of nothing in the next 90 days."*
- ✓ *"The text came in at 11:47 on a Tuesday night. Sarah had just pulled $32k in design contracts in nine days using nothing but the script in Module 6. Her message was three words: 'Holy. Shit. Mike.'"*

### 4. The Dismissive Aside

A throwaway line that signals "I don't even need to argue this." High-status, calm, dismissive.

Specifications:
- One sentence, often parenthetical
- Conveys certainty without raising voice
- Rejects a competitor or alternative without naming names

Examples:
- ✓ *"(I know - I used to fall for that pitch too.)"*
- ✓ *"Yeah. Same energy as those 'manifest your dream business' courses. We're not doing that here."*
- ✓ *"Anyway."*  (used after a digression - signals the seller's confidence to drop a thread mid-sentence)

### 5. The Opinion Shrapnel

Short, sharp opinions dropped through the body - not load-bearing claims, just texture.

Specifications:
- Short (5-15 words usually)
- Specific opinion stated as fact
- Adds personality without slowing the read

Examples:
- ✓ *"Most webinars are too long, by the way."*
- ✓ *"The price doesn't matter. The mechanism matters. The price is just a bill."*
- ✓ *"Everybody overthinks the headline. Underthink the headline. Overthink the bullets."*
- ✓ *"Most copywriters don't understand that 'short copy' isn't about word count."*

## The Fingerprint Test

The single test for whether a draft has Fingerprint or not:

> **If I swap the seller's name for a competitor's, does anyone notice?**

If no - Fingerprint is missing. Find it.
If yes - Fingerprint is working.

Apply this test at the asset level (does the *whole page* have Fingerprint moments scattered?) and at the section level (does *this specific section* have at least one Fingerprint moment?).

## Workflow

### Step 1 - Mine the seller's actual opinions

The Fingerprint can't be invented. It has to come from the seller. Interview-mode questions:

- *"What's something most people in your space believe that you think is wrong?"* (Contrarian Take seed)
- *"What's a moment in your work you'd describe scene-by-scene to a friend?"* (Vivid Image seed)
- *"What's an analogy you find yourself using over and over?"* (Signature Comparison seed)
- *"What do you find yourself rolling your eyes at in your industry?"* (Dismissive Aside seed)
- *"Three opinions you'd defend at a dinner party."* (Opinion Shrapnel seed)

If the seller can't answer these, the Fingerprint can't be developed yet - push them to do real reflection first. Don't fabricate.

### Step 2 - Sort raw inputs into the 5 types

Categorize every seller answer into one of the five expression types. Most sellers will naturally produce 2-3 strong items per type.

### Step 3 - Sharpen each into Fingerprint-ready form

Take each raw seller answer and sharpen:
- Add the specific common belief being contradicted (Contrarian Takes)
- Add the time-stamp / sensory detail (Vivid Images)
- Make the analogy concrete and specific (Signature Comparisons)
- Drop intensifiers and let the dismissive land flat (Dismissive Asides)
- Compress to 5-15 words (Opinion Shrapnel)

### Step 4 - Apply the Fingerprint Test on each item

For each sharpened Fingerprint item: could this come from a competitor? If yes, it's not Fingerprint - it's a generic line dressed up. Discard or sharpen further.

### Step 5 - Map deployment across the asset

Plan where each Fingerprint moment lands:
- Layer 4 of the Four-Layer Open: 1 high-impact moment (usually a Contrarian Take or Dismissive Aside)
- First proof section: 1 Vivid Image
- Mechanism / story section: 1 Signature Comparison + 1 Opinion Shrapnel
- Bullet section transitions: 1-2 Opinion Shrapnel
- Pre-close section: 1 Vivid Image or Internal Moment
- P.S. or P.P.S.: 1 Dismissive Aside

### Step 6 - Bullshit Filter

Read each Fingerprint moment aloud. Does it sound like *this specific seller*? If it could come out of any influencer in the niche, kill it.

## Examples - building a Fingerprint pack

### Seller: Mike Donovan, ex-plumber turned LSA-for-trades coach

**Raw seller input:** *"I think most of the marketing for tradespeople is built by people who've never held a wrench. They sell $3k Facebook ads packages to plumbers like it's the same play as DTC e-commerce."*

**Sharpened Contrarian Take:**
> *"Most of the marketing being sold to tradespeople is built by people who've never held a wrench. They sell $3k Facebook ads packages to plumbers like it's the same play as e-commerce - except plumbers don't sell impulse buys at 11pm. Plumbers sell to people whose pipes just burst on a Tuesday at 6am. Different mechanism. Different platform. Different everything."*

---

**Raw seller input:** *"There was a moment when I realized LSA was going to change my business - I was at the kitchen table looking at the dashboard."*

**Sharpened Vivid Image:**
> *"It was a Wednesday in October. I was at the kitchen table at 5:47am, drinking coffee from the mug my daughter painted that has a chip in the rim, looking at the LSA dashboard. Eleven verified-intent calls had come in overnight. I'd been in this business nine years and never had eleven calls in a single Tuesday, let alone overnight while I was asleep. That's the moment I knew."*

---

**Raw seller input:** *"I always say it's like the trucks have their own salesman now."*

**Sharpened Signature Comparison:**
> *"It's like every truck in your fleet got its own salesman - except the salesman never sleeps, never asks for a raise, and only talks to people who already have your service in their search history."*

---

**Raw seller input:** *"Don't get me started on the 'mindset' coaches."*

**Sharpened Dismissive Aside:**
> *"(I'm not going to do the 'mindset' bit. You don't need a mindset coach. You need ten more booked jobs this month.)"*

---

**Raw seller input:** *"Most operators overprice their first jobs."*

**Sharpened Opinion Shrapnel:**
> *"Most operators overprice their first ten jobs. Underprice them. Bank the reviews. Reviews compound - your prices don't, until they have to."*

## Output template

```markdown
# Fingerprint Pack - <Seller>

**Seller:** <name + role>
**Topic / niche:** <where the Fingerprint is being developed>
**Asset(s) this pack feeds:** <sales page / VSL / email sequence / brand voice>

---

## The 5 Expression Types - Fingerprint inventory

### Contrarian Takes (2-4)

1. > <Sharpened take 1 - names the common belief, names the alternative, defensible>
2. > <Take 2>
3. > <Take 3>

### Signature Comparisons (2-3)

1. > <Sharpened comparison 1 - specific reference, from seller's life>
2. > <Comparison 2>

### Vivid Images (2-3)

1. > <Image 1 - sensory, time-stamped, film-like>
2. > <Image 2>

### Dismissive Asides (3-5)

1. > <Aside 1>
2. > <Aside 2>
3. > <Aside 3>

### Opinion Shrapnel (5-10)

1. > <One-line opinion>
2. > <One-line opinion>
3. > <One-line opinion>
4. > <One-line opinion>
5. > <One-line opinion>

---

## Deployment plan

| Asset section | Fingerprint moment | Type | Function |
|---------------|--------------------|----- |----------|
| Open Layer 4 | <quote> | Contrarian Take | Lock the reader's attention |
| Problem agitation | <quote> | Vivid Image | Anchor the cost-of-not in scene |
| Story / mechanism | <quote> | Signature Comparison | Make the mechanism click instantly |
| Pre-bullets | <quote> | Opinion Shrapnel | Texture |
| Bullet block transition | <quote> | Dismissive Aside | Reset energy |
| Pre-close | <quote> | Vivid Image | Re-anchor in scene |
| P.S. | <quote> | Dismissive Aside | Final personality moment |

**Fingerprint density check:** <one moment per 200-400 words of body copy is target>

---

## Fingerprint Test (apply to each moment)

| # | Moment | Could a competitor have written it? | Verdict |
|---|--------|------------------------------------|---------|
| 1 | <Contrarian Take 1> | No - names a specific belief and a defensible alternative grounded in seller's actual operator history | KEEP |
| 2 | <Signature Comparison 1> | No - pulls from kitchen-table moment specific to this seller | KEEP |
| 3 | <Opinion Shrapnel 4> | Maybe - sounds like generic copywriting advice | SHARPEN |

---

## Bullshit Filter

- [ ] Every Fingerprint moment is something the seller would actually say at dinner
- [ ] No moment is "edgy for the sake of edge"
- [ ] Every Contrarian Take is defensible, not provocation
- [ ] Every Vivid Image has time / place / sensory detail
- [ ] Fingerprint Test passes on every retained moment
- [ ] Read aloud - every moment sounds like this specific seller, not a writer impersonating
```

## Notes

- The Fingerprint cannot be invented. The closer the AI tries to fabricate Fingerprint without seller input, the more the output will read as "AI-trying-to-be-edgy" - which fails harder than no Fingerprint at all. Always insist on real seller input first.
- The most common Fingerprint failure: cultural-cliché Comparisons. *"It's like Netflix for X"* / *"Uber for Y"* / *"Tesla for Z"* are all dead. Pull comparisons from the seller's specific life, not from tech-industry templates.
- The second most common failure: Contrarian Takes that are contrarian for the sake of attention rather than defensible from real experience. The reader can smell the difference. *"Everyone is wrong"* without specifics reads as posturing; *"Everyone is wrong about X because of Y, and here's what I learned in 2019"* reads as wisdom.
- Fingerprint density matters. One moment per 200-400 words of body copy is the target for a long-form sales page. Less is generic; more is exhausting. Front-load slightly heavier in the Open and Close, lighter in the middle.
- For sellers with strong existing voice (podcasts, off-the-cuff video, social posts), pull Fingerprint material from those rather than from interviews - off-the-cuff content captures the unfiltered version.
- This skill composes upstream from `convert-open` (Layer 4 specifically uses one Fingerprint moment) and upstream from `convert-voice` (the Voice pass enforces the *rules*; Fingerprint provides the *distinctive content* the rules wrap around).

## Lineage

The Fingerprint is part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:
- The need for a unique angle in saturated markets - *Eugene Schwartz, market sophistication stages, Breakthrough Advertising (1966)*
- The "Big Idea" tradition - *John Carlton, Kick-Ass Copywriting Secrets (2003)*: every winning sales letter has one distinct angle
- Voice-as-brand-equity - *David Ogilvy, Confessions of an Advertising Man (1963)*: "every advertisement should be thought of as a contribution to the brand image"
- Sensory-image construction - *Joseph Sugarman, AdWeek Copywriting Handbook (1998)*: "use specific words to create specific pictures"
- Vulnerability and contrarianism as trust mechanisms - *Robert Cialdini, Influence (1984)* (liking) + *Brené Brown, Daring Greatly (2012)* (vulnerability research)
