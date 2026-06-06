---
name: convert-close
slash_command: false
pack: business-conversion
family: donahoe_method
description: |
  Build the Cascade Close: Stack → Vision → Math → Safety Net → Door, with P.S. and P.P.S. that close again from new angles. Catches every type of buyer (vision-driven, logic-driven, risk-averse, action-ready) by closing from multiple sides.
  Use when writing the closing block of a sales page, VSL, long-form email, OTO page, or any conversion point where the reader is being asked to act.
  Not for opening hooks (use convert-open) and not for offer design itself (use funnels-offer for value structuring).
triggers:
  - write me a close
  - donahoe close
  - cascade close
  - stack vision math safety net door
  - close my sales page
  - write the cta section
  - guarantee copy
  - p.s. close
negative_triggers:
  - write me a hook
  - design the offer structure
  - audit my close
  - just give me a button label
tags: [conversion, copy, donahoe-method, cascade-close, close, cta, guarantee]
priority: 100
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-three-locks, convert-proof, convert-bullets, convert-voice, convert-chute, convert-sales-page, convert-vsl]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references *Cialdini scarcity and reciprocity principles (Influence, 1984)* for guarantee design, *Halbert P.S. doctrine (Boron Letters, 1984)*, and *Sugarman risk-reversal canon (AdWeek Copywriting Handbook, 1998)*"
---

# Convert Close - The Cascade Close

> *"The close isn't a single moment. It's a cascade - multiple closes flowing one after another, each designed to catch a different type of buyer. You're not closing once and hoping. You're closing from every possible angle until there's nothing left to object to."* - The Donahoe Method, Framework 5

This skill writes the full Cascade Close: five core layers (Stack → Vision → Math → Safety Net → Door) plus P.S. and P.P.S. that close *again* from fresh angles.

By the time the reader reaches the bottom of the page, every type of buyer - vision-driven, logic-driven, risk-averse, ready-to-act - has been spoken to in the language they need.

## When to Use

Trigger phrases: "write me a close", "donahoe close", "cascade close", "stack vision math safety net door", "close my sales page", "write the CTA section", "guarantee copy", "P.S. close", `/convert close <product>`.

Use for any conversion point: sales pages, VSLs, OTO pages, long-form launch emails, webinar pitch segments, upsell pages, checkout pages.

Do NOT use for:
- Writing the opening hook (use `convert-open`)
- Designing the offer's value structure (use `funnels-offer` - bonuses, tiers, price-points)
- Writing a single button label (this is the full close architecture; the button is one element of the Door)
- Auditing existing closes (use `convert-audit`)

## Inputs

Required:
1. **Offer details** - what's being sold, the price, what's included (the modules / bonuses / templates / community / coaching), the format, the delivery
2. **The guarantee** - what risk reversal can the seller honestly stand behind? (30-day, 60-day, results-based, no-questions, double-your-money, conditional). If there's no guarantee, that's a flag - push back: a Donahoe close without a Safety Net is structurally weak
3. **Three Locks output** (from `convert-three-locks`) - Lock 1 Want feeds Vision Close; Lock 3 Excuse pre-writes the Math Close
4. **Why Now** (from `convert-four-questions`) - feeds the urgency framing in the close

Optional:
- **Available proof** - a strong Receipt or Anecdote anchors the in-between-closes layer
- **Reader temperature** (from `convert-temperature`) - Hot/Boiling audiences need compressed Cascade; Cool audiences need full five-layer + P.S. + P.P.S.
- **Asset type** - sales page (full Cascade) / VSL (close at video minute 14-18) / email (compressed Cascade in P.S. + P.P.S.) / OTO (Cascade in 200-400 words)
- `out_path` - caller-controlled output. Defaults via `build_report_path`.

## The Cascade Layers (full method)

### 1. The Stack

List everything they get, but **conversationally.** Not a formal value table with inflated dollar amounts nobody believes.

If the value is genuinely high, let the numbers speak. But present them like you're explaining it to a friend, not filling out an infomercial template.

Specifications:
- Conversational connector phrases ("plus", "and you also get", "which honestly", "any one of these would be worth it on its own")
- Real components (no fluff, no "Bonus #7: My Special Mindset Audio")
- Optionally: dollar values per component if defensible
- Closes with a natural total, not a "TOTAL VALUE" splash

Example:
> *"So you're getting the full system - every module, every template, the calculator I built for myself, the video walkthrough where I show you the exact ad I was running last quarter, plus the private community where we troubleshoot in real time, plus the 6 weekly group calls. Honestly, any one of those alone is worth more than what I'm charging for the whole thing."*

Anti-pattern:
> *"Component 1: The Complete Master System ($1,997 value). Component 2: The Ultimate Templates Pack ($497 value). TOTAL VALUE: $7,394."*

### 2. The Vision Close

Close on the **desired state.** Paint where they'll be.

This catches the emotionally-driven buyers - the ones who've already decided and just need permission.

Specifications:
- Re-anchor Lock 1 Want from the body
- Specific scene, sensory detail, time-of-day
- Pose the choice as fast-path vs slow-path, not whether-or-not

Example:
> *"This is what your morning looks like 90 days from now: you wake up, you check your phone, and there are three new bookings that came in overnight. You haven't sent a single email yet today. The system did its job while you slept. The only question now is whether you want to get there the slow way - figuring it out alone, the way I did, with all the wrong turns I made - or the fast way, which is the next 90 days inside this."*

### 3. The Math Close

Close on **logic.** Make it about the numbers.

This catches the analytical buyers - the ones who need numbers to justify what they already feel.

Specifications:
- Compare the price to a relatable past expense (Already-Spent compare from `convert-three-locks` Lock 3)
- Show payback math (when does the offer pay for itself?)
- Optionally: one fraction-of-something-else ("less than what you spent on the last conference that didn't work")

Example:
> *"Let's do the math. This is $1,997. You spent $4,400 on the Facebook agency last summer that didn't book you a single new client. You spent $2,100 on the SEO retainer the year before that quietly drained off auto-renew. This is less than half of either of those - and it pays for itself the first booked job. Run those numbers however you want; the math doesn't change."*

### 4. The Safety Net

Close on the **guarantee.** Make it so strong it's almost absurd.

This catches the skeptics - the ones who believe it could work but are afraid of getting burned again.

Specifications:
- State the guarantee in plain English
- Remove every hoop ("no forms, no phone calls, no 'retention specialists'")
- Show the seller's confidence ("I take all the risk because I already know this works")
- Make it conversational, not legalistic

Example:
> *"Try it. If it doesn't work for you in the first 60 days, I'll refund every dollar - no forms, no phone calls, no 'customer retention specialist' trying to talk you out of it. You email me, you say 'this didn't work', and you're done. I take all the risk because I already know this works for the people who actually run the play."*

### 5. The Door

**Simple. Clear. No metaphors. No poetry. Just open the door.**

Specifications:
- One short paragraph
- Direct instruction ("click", "fill in", "you're in")
- No "seize this opportunity", no "begin your journey"

Example:
> *"Click the button below. Fill in your details. You're in. We start tomorrow."*

Anti-pattern:
> *"Seize this transformative opportunity to join thousands of forward-thinking entrepreneurs who have unlocked their true potential..."*

### Between each close - micro-resets

Between each layer, drop a micro-anecdote, a single Receipt, or a one-line Drive-By. Each close layer resets the emotional temperature and gives you room to close again from a different angle. The space between closes is where you rebuild momentum.

Example transition between Vision and Math:
> *"And look - I know what you're thinking. 'Okay, that's the vision. But what does it actually cost me?' Fair. Let's do the math."*

### The P.S. and P.P.S.

After the Door, the strongest Donahoe copy doesn't stop. It keeps closing.

**The P.S.** - recloses from a fresh angle. Often picks up the Safety Net or surfaces the Why Now in plain terms.

**The P.P.S.** - recaps the strongest single proof point or the strongest single line of the Vision. Final-second close for skimmers who scrolled to the bottom.

P.S. example:
> *"P.S. - One thing I should mention. The price goes to $2,497 in two weeks because we're adding the live cohort element. If you're reading this before the 17th, you're getting the current price for the current bonuses, including the cohort calls. That's the real reason for the timing - not pressure, just the actual math of what we're shipping next."*

P.P.S. example:
> *"P.P.S. - Mike, the Akron plumber, went from 4 calls a week to 23 in 31 days using just what's in Module 2. If you're a service business and you can run an LSA account, you can do this. The button's right above this. Click it."*

## The Cascade Principle

Five different closes catch five different types of buyers. Each peels away another objection layer:

- **Vision Close** handles "Do I want this?" → Yes
- **Math Close** handles "Can I justify this?" → Yes
- **Safety Net** handles "What if it doesn't work?" → No risk
- **Door** handles "What do I do now?" → Click here
- **P.S. / P.P.S.** handles "I'll come back later" → No, here's the real reason now

By the final close, you've addressed desire, logic, fear, action, and procrastination. There's nothing left to object to.

## Workflow

### Step 1 - Inherit the inputs

Pull from upstream Method primitives:
- Lock 1 Want from `convert-three-locks` → feeds Vision Close
- Lock 3 Excuse math from `convert-three-locks` → feeds Math Close
- Why Now from `convert-four-questions` → feeds P.S.
- A strong Receipt or Anecdote from `convert-proof` → feeds P.P.S.
- Temperature from `convert-temperature` → calibrates length

If any of these aren't ready, push back. The Cascade Close needs the architecture above it.

### Step 2 - Write the Stack conversationally

List the components as if explaining over coffee. No "TOTAL VALUE: $X,XXX". Use connector phrases, drop dollar values only if defensible.

### Step 3 - Write the Vision Close

Re-paint the state from Lock 1 Want with sensory detail. Frame the choice as fast-path vs slow-path.

### Step 4 - Write the Math Close

Use the Excuse math pre-built in Lock 3. Compare to relatable past expenses. Show payback.

### Step 5 - Write the Safety Net

State the guarantee in plain English. Remove every hoop. Express seller confidence ("I take all the risk because I already know this works").

If the seller doesn't have a real guarantee, push back - a guarantee is structural, not optional.

### Step 6 - Write the Door

One short paragraph. Direct instruction.

### Step 7 - Insert micro-resets between layers

Between each close, drop a single sentence - an anecdote, a Receipt, a transition. The reader rebuilds emotional momentum before the next close.

### Step 8 - Write the P.S. and P.P.S.

P.S. picks up Why Now or Safety Net from a fresh angle. P.P.S. recaps the strongest proof point or vision moment in one line.

### Step 9 - Bullshit Filter

Read the entire Cascade aloud. Anywhere you'd rush, cringe, or hedge - rewrite. Closes are the most-read part of a sales page; every word matters double.

## Examples

### Compressed Cascade (Hot-temperature email, ~250 words)

> *"Look, here's the deal. You get the system, the templates, the live calls, and the community - that's the whole thing for $1,997.*
>
> *In 90 days you're either booking 20+ jobs a week from LSA or you've got every dollar back. That's the deal.*
>
> *Mike, Akron, plumber: 4 calls a week to 23 in 31 days.*
>
> *Click the button. You're in.*
>
> *P.S. - Price goes to $2,497 on the 17th because we're adding the cohort. If you click before then, you're getting current price + the calls.*
>
> *P.P.S. - If you're already running an LSA account and getting nothing from it, the fix is in Module 2. That alone is worth the whole thing.*"

### Anti-pattern (no Cascade, single-layer close, fake urgency)

> *"Don't miss out on this AMAZING OPPORTUNITY! Get our PROVEN system today for the LOW LOW PRICE of $1,997! ACT NOW before this offer is GONE FOREVER! Click below to TRANSFORM YOUR LIFE today!"*

## Output template

```markdown
# Cascade Close - <Product / Asset>

**Reader temperature:** <Ice Cold / Cool / Warm / Hot / Boiling>
**Asset type:** <sales page / VSL / email / OTO / launch email>
**Inherited inputs:**
- Lock 1 Want anchor: <one-line>
- Lock 3 Excuse math: <one-line>
- Why Now: <one-line>
- Lead Receipt / Anecdote for P.P.S.: <one-line>

---

## The Stack

> <Conversational stack copy - components listed naturally, no value-table format>

**Components included:** <list>
**Total stated value (if defensible):** <amount or "no total stated">

---

## Micro-reset → Vision

> <One-line transition sentence>

## The Vision Close

> <Vision Close copy - sensory state painting, fast-path vs slow-path framing>

---

## Micro-reset → Math

> <One-line transition>

## The Math Close

> <Math Close copy - past-expense compare + payback math>

---

## Micro-reset → Safety Net

> <One-line transition>

## The Safety Net

> <Guarantee in plain English, no hoops, seller confidence>

**Guarantee terms:** <duration, conditions, refund mechanics>

---

## Micro-reset → Door

> <One-line transition>

## The Door

> <Direct instruction - click, fill, you're in>

**CTA button label:** "<short, action-verb-led>"

---

## P.S.

> <Recloses from fresh angle - usually Why Now or Safety Net restated>

## P.P.S.

> <One-line recap - strongest Receipt OR strongest Vision moment + final CTA>

---

## Cascade audit

| Layer | Buyer type caught | Lock served |
|-------|-------------------|-------------|
| Stack | All | Lock 3 (sets up Excuse) |
| Vision | Emotional | Lock 1 Want |
| Math | Analytical | Lock 3 Excuse |
| Safety Net | Skeptical / risk-averse | Lock 3 Excuse |
| Door | Action-ready | (closes) |
| P.S. | Procrastinator | Why Now |
| P.P.S. | Skimmer | Strongest proof recap |

---

## Bullshit Filter

- [ ] Stack is conversational, not a value-table
- [ ] Vision Close re-anchors Lock 1 Want with sensory detail
- [ ] Math Close uses defensible math compared to relatable past expense
- [ ] Safety Net is in plain English, no legalese
- [ ] Door is direct - no "seize this opportunity"
- [ ] P.S. and P.P.S. each close from a fresh angle (don't repeat each other)
- [ ] Read aloud - no cringe, no rush, no hedging
```

## Notes

- The most common close failure: writers stop at the Door. The P.S. and P.P.S. typically convert 5-15% of remaining undecided readers - skipping them is leaving money on the table.
- The second most common failure: writing the Stack as a value-table with inflated dollar amounts. *"$7,394 value, today only $1,997"* reads as 1990s infomercial. The Donahoe Stack is conversational.
- For Boiling-temperature audiences (cart abandoners, repeat customers), the entire Cascade compresses to 3 sentences plus P.S. The Door does most of the work; everything else is acknowledgment.
- For Ice Cold audiences, the close at the bottom of a long-form page can run 600-1,000 words because every layer needs full development. For Hot audiences in an email, the same Cascade can land in 200-300 words.
- A close without a Safety Net (real guarantee) almost always underperforms. If the seller can't honestly stand behind a guarantee, the offer itself usually needs work - route to `funnels-offer` to strengthen the offer before closing it.
- This skill composes downstream from `convert-three-locks` (inherits Want and Excuse), `convert-proof` (inherits the lead Receipt for P.P.S.), `convert-four-questions` (inherits Why Now for P.S.), and feeds into `convert-sales-page` and `convert-vsl` as the closing block.

## Lineage

The Cascade Close is part of **The Donahoe Method** (Wayland-owned operating system).

Lineage references:
- Multi-angle close architecture - Donahoe synthesis of *Halbert's "the close" canon (Boron Letters, 1984)* and *Caples 35 close-types tradition (Tested Advertising Methods, 1932)*
- Risk-reversal / Safety Net design - *Cialdini reciprocity principle (Influence, 1984)* and *Sugarman risk-reversal canon (AdWeek Copywriting Handbook, 1998)*
- Real-scarcity for Why Now - *Cialdini scarcity principle (Influence, 1984)*, used responsibly (no manufactured urgency)
- The P.S. as the second-most-read element - *Halbert P.S. doctrine (Boron Letters, 1984)*
- The P.P.S. as a skimmer-targeted final close - Donahoe extension of the Halbert P.S. doctrine
