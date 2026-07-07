---
name: convert-four-questions
slash_command: false
pack: business-conversion
family: donahoe_diagnostic
description: |
  Run the Four Questions diagnostic before any copy is written: Why You / Why Me / Why This / Why Now answered from the customer's perspective in one specific sentence each. Produces the briefing the rest of the Method writes against.
  Use when starting a new sales page, VSL, email, or any direct-response asset and you need a customer-perspective brief before drafting a single sentence.
  Not for auditing existing copy (use convert-audit) and not for writing the page itself (use convert-sales-page after this diagnostic).
triggers:
  - run the four questions
  - four questions
  - donahoe diagnostic
  - why you why me why this why now
  - brief me on the customer
  - what should this copy do
  - diagnostic before writing
  - customer perspective brief
negative_triggers:
  - score my page
  - audit my sales page
  - rewrite this headline
  - just give me a hook
tags: [conversion, copy, donahoe-method, four-questions, diagnostic, brief]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-temperature, convert-open, convert-three-locks, convert-sales-page, convert-vsl]
attribution:
  lineage: 'The Donahoe Method (Wayland-owned operating system); diagnostic posture echoes Schwartz market sophistication audit (Breakthrough Advertising, 1966) and Halbert customer-research-first canon (Boron Letters, 1984)'
---

# Convert Four Questions - The Donahoe Diagnostic

> _"Before you write a single word of copy, you need to answer four questions - from the customer's perspective. Not your perspective. Theirs."_ - The Donahoe Method

Four Questions. Four answers. Each in one sentence. From the customer's chair, not yours.

This is the diagnostic that runs **before** any other Method skill. Skip it and the rest of the Method has nothing to write against.

## When to Use

Trigger phrases: "run the four questions", "four questions", "donahoe diagnostic", "why you why me why this why now", "brief me on the customer", "what should this copy do", `/convert four-questions <product>`.

Run this skill **first** - before `convert-open`, before `convert-bullets`, before any page-builder. The Four Questions output becomes the brief the rest of the Method writes against.

Do NOT use for:

- Scoring an existing page (use `convert-audit` for Method-scored teardown)
- Direct copy generation (this produces a _brief_, not a draft)
- Offer design itself (use `funnels-offer` - different pack)
- Awareness-level classification alone (use `convert-temperature` - paired but distinct)

## Inputs

Required:

1. **Product / offer** - what's being sold? One concrete description. Not "a course on marketing" - _"an 8-week program that teaches plumbers how to run their own Google Local Service Ads, $1,997, includes done-with-you setup."_
2. **Reader** - one specific person (the One Person Rule). Not "small business owners" - _"Mike, runs a 3-truck plumbing crew in Akron, has tried two SEO agencies and one Facebook ads guy in the last 18 months, none of it produced calls he could measure."_
3. **Author / seller** - who's the "I" telling them this? Their qualification needs to be Skin-In-The-Game qualification, not credential dump.

Optional:

- **Asset type** - sales page / VSL / email / ad. Tunes how aggressively each answer needs to land.
- **Existing brand voice notes** - vocabulary, signature phrases.
- `out_path` - caller-controlled output path. Defaults via `build_report_path`.

## The Four Questions (full method)

### 1. Why You?

Why should THIS person care? Not "why is this important" in the abstract - why does it matter to THEM, right now, today? What's it costing them to NOT have this? What's the specific pain, frustration, or missed opportunity that makes this relevant to their Tuesday?

**Test:** if you can't answer in one sentence that would make Mike nod and say _"yeah, that's exactly my problem"_ - you haven't done enough research.

Specifications:

- One sentence
- Names the specific cost of inaction (money / time / opportunity / sanity)
- Tied to _their_ current week, not a hypothetical pain
- Specific enough that the wrong reader self-deselects

Examples:

- ✓ _"Every week you don't have a system for landing inbound plumbing calls, you're losing roughly $4,800 in jobs to whoever's running ads against your zip code."_
- ✗ _"Marketing is important for growing your business."_ (abstract, generic, zero nerve)
- ✗ _"You should care about leads."_ (a directive, not a diagnosis)

### 2. Why Me?

Why should they listen to YOU? Not your resume. Not your certifications. Why are you specifically qualified to help THEM with THIS problem?

The answer is almost always: _"Because I've been where you are, I figured it out, and I have the results to prove it."_

This isn't about being the most credentialed person in the room. It's about being the most credible. Credibility comes from experience, specificity, and the ability to describe their situation so accurately that they feel like you're reading their mind.

Specifications:

- One sentence
- First-person, specific past situation that mirrors theirs
- Concrete result attached (numbers, dates, before/after)
- No credential dump - credentials drop in passing if they appear at all

Examples:

- ✓ _"I ran a service business for nine years before I figured out the Local Services Ads angle that took my own crew from $11k months to $38k months in under a year - and now I show other operators how to do it without the $80k of mistakes I made first."_
- ✗ _"As a leading expert in digital marketing for service businesses..."_ (credential-dump opener - fails Skin-In-The-Game)
- ✗ _"I've helped many businesses grow."_ (vague, no proof, no shared experience)

### 3. Why This?

Why this specific solution and not the hundred other options they've already seen? What makes this approach fundamentally different? Not "better" - different. What's the mechanism that makes this work when other things haven't?

This is the hardest question to answer, and most copy fails here. _"It's better"_ isn't an answer. _"It works differently because [specific mechanism]"_ is.

Specifications:

- One sentence
- Names the _mechanism_, not the benefit
- Differentiates from at least one named alternative the reader has tried
- Specific enough that you couldn't swap it onto a competitor's page

Examples:

- ✓ _"Unlike Facebook ads - which front-load you with $3,000 of testing before any phone rings - Google Local Service Ads charge you only when a verified-intent caller lands on your line, which is why our students see real bookings inside week one instead of week ten."_
- ✗ _"Our system is better than the others."_ (no mechanism, no differentiation)
- ✗ _"We use a proprietary AI-powered framework."_ (buzzword salad - fails the Bullshit Filter)

### 4. Why Now?

Why should they act today instead of bookmarking this and forgetting about it? The answer must be REAL. If there's no genuine reason to act now, don't manufacture one. Fake urgency kills the trust you've built.

But if there IS a real reason - limited capacity, a price change, a bonus that's going away, a market window that's closing - state it plainly.

Specifications:

- One sentence
- Real reason - verifiable, not invented
- If no real urgency exists, the answer is: "the cost of _not_ doing it keeps compounding" - and the copy reflects that honestly
- No fake countdown timers, no "only 3 spots left" if it isn't true

Examples:

- ✓ _"Google opened LSA verification to plumbing trades in 14 new metros last quarter - being one of the first three verified providers in your zip code is worth roughly 10x what being the seventeenth is, and that window closes the moment the local market saturates."_
- ✓ _"There's no fake deadline here - just the math: every month you wait costs you ~$4,800, so the real question is when you stop bleeding it."_
- ✗ _"Limited time offer! Act now!"_ (fake urgency - fails)
- ✗ _"Don't wait!"_ (no reason - fails)

## Workflow

### Step 1 - Lock the One Person

If the user gave you a segment ("plumbers", "agency owners", "moms"), don't proceed. Re-ask once: _"Pick one. Describe Mike specifically - his city, his crew size, the last marketing thing that didn't work for him. The Method requires it."_

The diagnostic is worthless without one specific human in the chair.

### Step 2 - Answer Why You from their chair

Sit in the reader's seat. What's costing them money / time / sanity _right now_? Write the answer as if you were them describing the problem to a friend.

Test: read the answer aloud. Would the reader nod? If they'd shrug, the answer is too generic. Sharpen it.

### Step 3 - Answer Why Me with one specific past

Find the moment in the seller's history that mirrors the reader's current moment. Not the credential. The mirror moment.

Test: does the answer describe a specific scene with numbers / dates / a concrete before-and-after? If it reads like a bio block, rewrite as a moment.

### Step 4 - Answer Why This with the mechanism

What's the underlying _thing_ that makes this approach work where others haven't? Pin the mechanism, not the marketing.

Test: could you swap the seller's name onto a competitor's page and have the answer still read true? If yes, the mechanism isn't specific enough. Find the differentiator.

### Step 5 - Answer Why Now honestly

Is there a real urgency? If yes, state it. If no, write the honest "compounding cost" version.

Test: would you defend this urgency claim under direct questioning? If you'd hedge or backpedal, kill it and write the honest version.

### Step 6 - Bullshit Filter pass

Read all four answers aloud as if telling Mike across the table. If any of them sound like writing instead of talking, rewrite. The Method requires this filter on every output.

## Output template

```markdown
# Four Questions Diagnostic - <Product / Offer>

**Reader (one person):** <Name, situation, last failed attempt>
**Seller (the I):** <Name, the mirror moment from their past>
**Asset this brief feeds:** <sales page / VSL / email / ad>

---

## 1. Why You?

> <One sentence - specific cost of inaction, tied to their current week>

**The nerve this names:** <what they already feel that this answer surfaces>
**Cost of inaction:** <quantified - $/week, hours/month, opportunity>

---

## 2. Why Me?

> <One sentence - first-person mirror moment with concrete result>

**Skin-in-the-Game evidence:** <the specific past scenario>
**Result attached:** <numbers / before-after / dates>

---

## 3. Why This?

> <One sentence - names the mechanism, differentiates from named alternative>

**The mechanism:** <the underlying why-this-works>
**Contrasted against:** <named alternative the reader has likely tried>

---

## 4. Why Now?

> <One sentence - real urgency or honest compounding-cost version>

**Real urgency (if any):** <verifiable reason>
**If no real urgency:** <the honest compounding-cost framing>

---

## How to deploy this brief

These four answers become the spine of every other Method skill that follows:

- **convert-open** - the Nerve Strike pulls from Why You; Skin in Game pulls from Why Me; Fingerprint comes from the contrarian framing in Why This
- **convert-three-locks** - Want pulls from Why You; Trust pulls from Why Me + Why This; Excuse pulls from Why This + Why Now
- **convert-proof** - every claim in the body must trace back to evidence already implied by Why Me / Why This
- **convert-close** - the Math Close uses Why You's cost-of-inaction; the Vision Close paints the inverse of Why You; Why Now becomes the close-page reason

If any of the four answers is weak, the asset built on top of it will be weak. Sharpen here before writing.

---

## Bullshit Filter

- [ ] Each answer is one sentence
- [ ] Each is specific enough the wrong reader self-deselects
- [ ] Why You is a problem they already feel, not one I'm convincing them they have
- [ ] Why Me is a mirror moment, not a credential dump
- [ ] Why This names the mechanism, not the marketing
- [ ] Why Now is real or honestly framed as compounding cost
- [ ] Read aloud - none of it sounds like writing instead of talking
```

## Notes

- The Four Questions are a **diagnostic**, not copy. Don't paste the answers into a sales page verbatim - let them brief the writers (the other Method primitives).
- If the user hands you four bad answers ("we help businesses grow", "we have 20 years experience", "our system is unique", "act now while supplies last"), don't smooth them. Push back hard. Bad inputs produce bad pages.
- The hardest question is consistently **Why This**. If the user can only answer "we're better", that's a flag the offer itself needs work - consider routing to `funnels-offer` to design the differentiated mechanism before continuing.
- For Boiling-temperature audiences (`convert-temperature` returns Boiling), the Four Questions can compress to one sentence each in a confirming-not-selling tone. For Ice Cold audiences, each question may need an entire copy section to develop properly.

## Lineage

The Four Questions are part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:

- Customer-perspective-first stance - _Halbert's research-before-writing canon (Boron Letters, 1984)_
- Why-You / Why-Me audit posture - informed by _Schwartz's market sophistication audit (Breakthrough Advertising, 1966)_
- Why-This mechanism focus - informed by _Ogilvy's "unique selling proposition" tradition (Confessions of an Advertising Man, 1963)_
- Why-Now honest-urgency frame - informed by _Cialdini scarcity principle, used responsibly (Influence, 1984)_
