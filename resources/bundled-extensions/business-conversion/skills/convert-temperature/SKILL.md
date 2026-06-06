---
name: convert-temperature
slash_command: false
pack: business-conversion
family: donahoe_diagnostic
description: |
  Classify reader temperature on the 5-level scale: Ice Cold / Cool / Warm / Hot / Boiling. Sets length, depth, education burden, and approach for every other Method primitive that follows.
  Use when starting a new asset and you need to calibrate how much teaching, proof, and persuasion to load before writing.
  Not for auditing an existing asset's tone (use convert-audit) and not for designing the offer (use funnels-offer).
triggers:
  - what temperature is this audience
  - market temperature
  - awareness level
  - is this audience hot or cold
  - ice cold cool warm hot boiling
  - calibrate the copy length
  - temperature read
  - how aware is this reader
negative_triggers:
  - audit my page
  - rewrite this copy
  - design the offer
  - score my conversion rate
tags: [conversion, copy, donahoe-method, market-temperature, diagnostic]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-four-questions, convert-open, convert-three-locks, convert-sales-page, convert-vsl, convert-bridge-page]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); 5-temperature scale extends *the 5 awareness levels (popularized by Eugene Schwartz, Breakthrough Advertising, 1966)* and Bob Stone's traffic-temperature canon (Successful Direct Marketing Methods, 1975)"
---

# Convert Temperature - Market Temperature Read

> *"Before you write a word of copy, you need to know where your reader is. Not demographically - psychologically. How much do they already know? How much do they already believe? How much have they already heard?"* - The Donahoe Method, Framework 7

The same product needs completely different copy at every temperature. An Ice Cold audience needs a 3,000-word education piece. A Boiling audience needs a 3-line email. Writing hot copy for a cold audience is the most common reason campaigns fail.

This skill classifies your reader on the 5-level temperature scale and outputs a calibration brief that every downstream Method skill uses.

## When to Use

Trigger phrases: "what temperature is this audience", "market temperature", "awareness level", "is this audience hot or cold", "ice cold cool warm hot boiling", "calibrate the copy length", "temperature read", "how aware is this reader", `/convert temperature <audience description>`.

Run this skill in the diagnostic phase, alongside `convert-four-questions`. Both feed the brief that the page-builders work from.

Do NOT use for:
- Auditing an existing live page's tone or fit (use `convert-audit`)
- Picking an offer (offers are temperature-agnostic - see `funnels-offer`)
- Writing actual copy (this is a calibration; the writers come next)

## Inputs

Required:
1. **Traffic source** - where is this reader coming from? Cold ad, retargeting pixel, email list, repeat customer, abandoned cart, organic search, podcast guest spot, friend referral. Source determines temperature more than any other variable.
2. **What the reader already believes** - three short statements: do they believe they have a problem? do they believe a solution exists? do they believe *you* can deliver it?
3. **What the reader has already seen** - have they consumed the seller's content before? Have they seen competitor pitches? How sophisticated is the market they live in?

Optional:
- **Asset type** being calibrated (sales page / VSL / email / ad / squeeze page)
- **Sample of past copy that worked / flopped** for this audience
- `out_path` - caller-controlled output. Defaults via `build_report_path`.

## The Five Temperature Levels (full method)

### Ice Cold - They Don't Know They Have a Problem

**State:** Not looking for a solution because they don't know there's a problem worth solving.
**Job of copy:** Wake them up. Don't sell - pattern-interrupt. Show them something they haven't considered.
**Enemy:** Apathy, not skepticism.
**Length signal:** Long. 2,500-4,000 words on a sales page. 25+ minute VSL with extended education. Bridge pages and advertorials carry the weight before any pitch lands.
**Open posture:** Layer 1 Nerve Strike must surface a *latent* pain. Layer 2 Side Door is critical - pitchy openers get scrolled past on the first sentence.
**Three Locks weight:** Heavy on **Want** (you're building it from zero), light on Excuse (no one is at the buy line yet).
**Proof posture:** Anecdote-heavy and Receipt-heavy. They need to see other people's problem-discovery moments before they accept their own.
**Close posture:** Soft CTA - usually to consume more content, not to buy. "Watch the next video" / "Read this" / "Get the free thing." The buy comes later in the sequence.

Examples of Ice Cold traffic:
- Cold Facebook / TikTok / YouTube ad audiences targeted by demographic only
- New blog readers via SEO long-tail
- Podcast audiences hearing the seller's name for the first time

### Cool - They Know the Problem, Not the Solution

**State:** Frustrated but don't know what to do about it. Searching, comparing, lurking.
**Job of copy:** Name the problem so precisely they feel understood, then introduce the *category* of solution. Don't pitch your specific product yet - sell the approach.
**Enemy:** Confusion and search fatigue.
**Length signal:** Long-medium. 1,800-2,800 words. 18-minute VSL.
**Open posture:** Layer 1 Nerve Strike hits the problem they've already named in their own head. Skin in the Game lands hard - they want someone who's been in their seat.
**Three Locks weight:** Balanced. **Want** is partially built (they want *out*); **Trust** carries the most weight because they're shopping for someone they can believe.
**Proof posture:** Anecdote + Because. They need the *mechanism* explained, not just results.
**Close posture:** Direct but with full Cascade. The Vision Close + Math Close together close most of this segment.

Examples of Cool traffic:
- Search-intent traffic on long-tail problem queries ("why are my Facebook ads not converting")
- Lead-magnet opt-ins from problem-aware content
- Audiences from podcast guest spots where the problem was named

### Warm - They Know Solutions Exist, Haven't Picked One

**State:** Shopping. Comparing. They've tried at least one thing that didn't work.
**Job of copy:** Differentiate. Why This and not the other options? Your unique mechanism does the heavy lifting here.
**Enemy:** Past disappointment and decision paralysis.
**Length signal:** Medium. 1,200-2,000 words. 12-15 minute VSL.
**Open posture:** Layer 1 Nerve Strike often takes the form of *"You've tried X. Here's why X didn't work."* Fingerprint must be sharp - you're being compared.
**Three Locks weight:** Heavy on **Trust** (they're skeptical from past failures) and on the differentiation in **Want** (your version of the result is better/faster/different).
**Proof posture:** Receipts + Drive-By + the Because mechanism. Show, name the credential in passing, explain why it works.
**Close posture:** Full Cascade. Safety Net carries unusually heavy weight - they've been burned and the guarantee removes the last objection.

Examples of Warm traffic:
- Retargeting pixel from a Cool-temp page
- Email list of past lead-magnet downloaders
- Audiences who've consumed 2-3 pieces of seller content
- Affiliate traffic from a complementary seller

### Hot - They Know About You, Haven't Decided

**State:** On the fence about *your* specific offer. They've consumed your content, may have been on past sales pages, may have abandoned cart once.
**Job of copy:** Pure persuasion. Proof, value stacking, risk reversal, real urgency. They don't need education - they need a reason to act now.
**Enemy:** Procrastination and "I'll come back to it."
**Length signal:** Medium-short. 800-1,500 words. 8-12 minute VSL. Email can carry full close in 400 words.
**Open posture:** Layer 1 Nerve Strike skips problem education and goes straight to outcome anchoring. *"You already know what this can do. Here's what's different about right now."*
**Three Locks weight:** Heavy on **Excuse** - they want it, they trust it, they need permission and a justification. Math Close is the heavy lifter.
**Proof posture:** Specific numbers, recent receipts, testimonials with names attached.
**Close posture:** Cascade compressed. P.S. and P.P.S. are critical - those are where Hot buyers convert.

Examples of Hot traffic:
- Abandoned-cart audiences
- Past customers seeing a new offer from same seller
- Active email subscribers receiving a launch sequence
- Retargeting pixel from the buy page itself

### Boiling - They're Ready, Just Need a Push

**State:** They've decided. They just haven't clicked yet. Past customers, repeat visitors, people who literally had the cart open last week.
**Job of copy:** Remove the last friction. Short, direct, often just a reminder.
**Enemy:** Distraction, not doubt.
**Length signal:** Short. 200-600 words on a page. 3-line email. Single SMS. *"You left something in your cart. Still want it?"*
**Open posture:** No four-layer open needed. One sentence - confirming, not selling.
**Three Locks weight:** All three already opened. Just need the **Door** of the Cascade Close.
**Proof posture:** Single receipt or single testimonial. Don't re-pitch.
**Close posture:** Just the Door. *"Click here. Done."*

Examples of Boiling traffic:
- Cart abandoners within 24 hours
- Past customers on a sequel offer they've already asked about
- Repeat purchasers of related products

## Workflow

### Step 1 - Source-trace the temperature

Where is this reader coming from? The traffic source produces 70% of the temperature read on its own.

| Source | Default temperature |
|--------|--------------------|
| Cold paid ad, demographic targeting | Ice Cold |
| SEO long-tail, problem keyword | Cool |
| Retargeting pixel, content visitor | Warm |
| Email list, content consumer | Warm-to-Hot |
| Active launch sequence | Hot |
| Cart abandoner, past customer | Boiling |

### Step 2 - Belief audit (three quick questions)

For the specific reader, score:
- Do they believe the problem is real *for them*? (yes / sort-of / no)
- Do they believe a solution category exists? (yes / sort-of / no)
- Do they believe *you* are the seller for them? (yes / sort-of / no)

Three "no"s → Ice Cold. Three "yes"es → Boiling. Mixed pattern → use the table above to position.

### Step 3 - Sophistication overlay

Schwartz's market sophistication overlay: how many times has this audience seen *this kind of pitch* before? Even a Hot audience, in a hyper-saturated category, may need a Cool-temperature mechanism explanation because they've heard the standard pitch a thousand times.

If sophistication is high (5+ competitor pitches consumed), bump the length up by one notch and load the differentiation mechanism heavier in Why This.

### Step 4 - Calibrate the brief

Output the calibration brief - the rest of the pack writes against it.

### Step 5 - Bullshit Filter

Last check: did you assume the audience was hotter than they actually are? Most copy fails because writers project their *own* belief about the offer onto the reader. Cold-temperature copy on a hot audience is rare; hot-copy on a cold audience is the most common failure mode. Bias the call cooler than your gut says, and watch what happens.

## Output template

```markdown
# Temperature Read - <Audience / Asset>

**Traffic source:** <where they came from>
**Asset being calibrated:** <sales page / VSL / email / ad>

---

## Classification: <Ice Cold | Cool | Warm | Hot | Boiling>

**Confidence:** <High / Medium / Low>
**Sophistication overlay:** <Low / Medium / High - how many competitor pitches they've seen>

### Belief audit
- Believes problem is real for them: <yes / sort-of / no>
- Believes a solution category exists: <yes / sort-of / no>
- Believes you can deliver it: <yes / sort-of / no>

---

## Calibration brief (downstream primitives use this)

| Lever | Calibrated value |
|-------|------------------|
| Asset length | <words / minutes> |
| Open posture | <Layer 1 angle, Side Door priority> |
| Three Locks weight | <Want X% / Trust Y% / Excuse Z%> |
| Proof type priority | <Anecdote / Receipt / Drive-By / Namecheck / Because - ranked> |
| Close posture | <full Cascade / compressed / Door-only> |
| Education burden | <heavy / medium / light / none> |
| Urgency framing | <real reason / honest compounding cost / none - confirm-only> |

---

## What the rest of the Method should do with this

- **convert-open** → <specific Open guidance for this temperature>
- **convert-three-locks** → <which lock carries the most weight>
- **convert-proof** → <which proof types lead, which trail>
- **convert-bullets** → <how many, how dense, which 4 types lead>
- **convert-close** → <full Cascade vs compressed vs Door-only>
- **convert-chute** → <pacing - long-form chute vs short-form snap>

---

## Bullshit Filter
- [ ] Classification matches traffic source default (or has a documented reason for diverging)
- [ ] Belief audit was answered honestly, not optimistically
- [ ] Sophistication overlay considered - am I underestimating how much they've seen?
- [ ] I biased cooler when in doubt
```

## Notes

- Most failed campaigns show as Ice Cold or Cool audiences receiving Hot or Boiling copy - the writer assumed the audience was further along than it was. When in doubt, classify cooler.
- Temperature is **per traffic segment**, not per audience-as-a-whole. The same product might need an Ice Cold sales page for cold ads, a Hot email sequence for the list, and a Boiling abandoned-cart sequence for cart pixels - three different assets, one offer.
- Sophistication overlay matters most in saturated categories (weight loss, business opportunity, dating). Even a Hot audience in those categories may need Cool-temperature mechanism explanation because the standard pitches no longer move them.
- For marketplace tests, when temperature is genuinely unknown, default to one notch cooler than your gut says. The downside of slightly-too-long-too-educational copy is small. The downside of pitching to people who don't know they have a problem is total.

## Lineage

Market Temperature is part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:
- The 5-level scale extends *the 5 awareness levels (popularized by Eugene Schwartz, Breakthrough Advertising, 1966)*
- Source-traced temperature reading from *Bob Stone's traffic-classification canon (Successful Direct Marketing Methods, 1975)*
- Sophistication overlay - *Schwartz market sophistication stages, Breakthrough Advertising 1966*
- Belief-audit framing - informed by *Cialdini's commitment-and-consistency mechanics (Influence, 1984)*
