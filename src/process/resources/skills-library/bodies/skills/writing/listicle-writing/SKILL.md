---
name: listicle-writing
description: |
  Writes numbered listicle articles with consistent item structure, intro framing,
  and a conclusion that ties items together. Use when the user wants a list-format
  blog post, a "top N" article, a roundup post, or asks for content in numbered
  list format. Do NOT use for step-by-step instructions (use `how-to-guide`),
  general blog posts (use `blog-post-writing`), or editorial calendars
  (use `editorial-calendar`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "blog-post writing content-marketing"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Listicle Writing

## When to Use

Use this skill when the user's request matches one of these patterns:

- The user asks for a "Top N," "X Ways to," "X Things That," "X Mistakes That," "X Reasons Why," or "X Best" article -- the numbered format is the explicit or implied deliverable
- The user wants a roundup post compiling discrete items (tools, tactics, examples, case studies, products, habits, or strategies) into a single scannable reference
- The user asks for a "things to avoid," "common mistakes," or "watch out for" article where each warning functions as a standalone, interchangeable item rather than a sequence
- The user needs a curated comparison of options -- tools vs. tools, approaches vs. approaches -- presented in a parallel, item-by-item structure
- The user wants a "what to know before you start" primer that organizes foundational concepts as discrete, scannable items rather than flowing prose
- The user requests a "beginner's guide" where the content naturally breaks into parallel, enumerable lessons rather than a narrative arc
- The user asks for a content piece optimized for social sharing, featured snippets, or time-pressed readers who will skim before they commit

**Do NOT use this skill when:**

- The user wants sequential instructions where step order is mandatory and skipping steps causes failure -- use `how-to-guide` instead, which handles procedural dependencies, prerequisites, and branching logic
- The user wants a flowing narrative or opinion-led blog post with a thesis, supporting arguments, and a structured argument arc -- use `blog-post-writing` instead
- The user wants to argue a single position with evidence and counterarguments -- use `opinion-piece` instead, which handles thesis framing and rebuttal structure
- The user wants a comprehensive, long-form explainer on a complex topic requiring progressive concept-building where later sections depend on earlier ones -- use `explainer-article` instead
- The user wants a product or service comparison with weighted scoring, detailed feature tables, and a verdict -- use `comparison-review` instead
- The user needs a content calendar mapping multiple listicle ideas across time -- use `editorial-calendar` instead, which plans distribution and topic clusters
- The content naturally has fewer than four distinct, non-overlapping items -- a list of three is a paragraph, not a listicle; redirect to `blog-post-writing`

---

## Process

### Step 1: Collect Context and Define the List's Parameters

Before writing a single word, gather the information that controls every structural decision:

- **Topic and angle:** Ask for the specific topic and the angle or slant. "Productivity tips" is not enough -- "productivity tips for remote engineers who work across time zones" is actionable. The angle determines what makes each item relevant.
- **Target audience:** Establish expertise level (novice, intermediate, practitioner), role (manager, developer, parent, founder), and pain state (frustrated, overwhelmed, curious, skeptical). These three dimensions control vocabulary, assumed knowledge, and example specificity.
- **List type:** Identify which of the six primary listicle types applies -- (1) tips and tactics, (2) mistakes and pitfalls, (3) tools and resources, (4) reasons and motivations, (5) examples and case studies, or (6) comparisons and alternatives. Each type has different structural conventions for item bodies.
- **Item count:** Ask if the user has a target number. If not, apply the odd-number principle: 5, 7, 9, 11 items outperform even counts in headline click-through data. 7 is the default for broad topics; 5 for deep, technical content where each item requires significant explanation; 9-11 for broad roundup content.
- **Mandatory inclusions:** Ask if any specific items, tools, examples, or angles must appear. If the user provides a partial list, gap-fill to reach the target count.
- **Publication context:** Ask whether this is for a blog, email newsletter, LinkedIn article, or another format. Blog posts allow H2 headers per item; email newsletters often require a more compact format; LinkedIn limits heading depth.

### Step 2: Audit the Item Set Before Writing

The most common failure in listicle writing is drafting items that overlap, items that are parallel only on the surface, or items that vary wildly in scope. Audit before writing:

- **Scope uniformity test:** Hold each item against the others. If one item is "Use a password manager" and another is "Audit your entire company's security posture," they are not the same kind of thing. Either zoom all items to the same altitude or split into a two-tier structure.
- **Overlap test:** If two items share a primary mechanism or cause, they are duplicates disguised as distinct points. "Poor communication" and "Unclear expectations" in a management mistakes listicle overlap 70%. Merge them into "Setting expectations without confirming shared understanding" and replace the freed slot with a genuinely distinct item.
- **Parallelism test:** Items must be grammatically and conceptually parallel. Tips listicles use imperative verbs ("Batch your email checks"). Mistakes listicles use gerunds or noun phrases ("Skipping the debrief"). Reasons listicles use complete justifications. Pick a grammatical pattern and hold every title to it.
- **Coverage test:** Check whether the item set covers the realistic range of the topic. A "7 SEO mistakes" list that addresses only on-page factors while ignoring technical SEO and backlinks has a coverage gap. Fill it or narrow the framing ("7 On-Page SEO Mistakes" is accurate; "7 SEO Mistakes" is not).

### Step 3: Choose and Apply a List Ordering Strategy

Order is not arbitrary -- it affects reader retention and the perceived quality of the list:

- **Most impactful first (inverted pyramid):** Use when readers are likely to skim. The reader who exits after item 3 still got the three most valuable items. Best for tips and tactics lists targeting time-pressed readers.
- **Narrative build (climax order):** Use when the final item is a revelation or reframe. Each item escalates in insight or surprise. Best for "mistakes" and "reasons" listicles where the last item reframes everything before it.
- **Logical grouping (thematic clusters):** Use when the items naturally form 2-3 subcategories. Group items under informal sub-labels rather than formal H2 subheadings, unless the list exceeds 12 items. Best for tools roundups and comparisons.
- **Chronological or process-adjacent:** Use when items map loosely to a timeline (early-stage vs. late-stage mistakes, beginner vs. advanced tips) without being strictly sequential. Flag this ordering explicitly so readers understand the structure.
- **Alphabetical:** Use only for reference-style roundups where no hierarchy applies. Alphabetical ordering signals "no ranking" without having to state it.

State the ordering logic in the introduction if the list is explicitly ranked. If unranked, use language that signals parity: "in no particular order," "each of these carries equal weight."

### Step 4: Write the Introduction

The introduction has one job: give the reader a reason to read all the way through the list. It does this in three moves:

- **Move 1 -- Earn the reader's time (1-2 sentences):** State the specific problem, tension, or missed opportunity that makes this list relevant. Do not open with a question. Do not open with a statistic that lacks context. Anchor to a recognizable situation the target audience lives in. Example: "Most content teams produce 20 pieces a month and can name the distribution channel for each one. Almost none can name what the last five pieces actually changed for readers."
- **Move 2 -- Promise the list's value (1 sentence):** State what the reader gains from completing the list. Be specific about the outcome, not the content. "These seven frameworks" is weak. "These seven frameworks let you evaluate any new distribution channel in under 20 minutes" is a promise.
- **Move 3 -- Optional credibility anchor (1 sentence, omit if unnecessary):** A single concrete credibility signal -- aggregate data, a practitioner's observation, a research finding -- that validates why this list exists. Not required; do not force it.
- **Hard limit:** 100-150 words maximum. Readers clicked for the list. Every word of preamble is friction.

Do not use: "In today's fast-paced world," "Now more than ever," "Whether you're a [X] or a [Y]," "Have you ever wondered," or any variant of scene-setting that starts in the abstract.

### Step 5: Write Each List Item

Each item is a micro-essay. It must be self-contained -- a reader who excerpts only that item should understand both what it is and why it matters:

- **Title (bold, scannable):** 3-9 words. Use the grammatical pattern established in the audit step. The title alone must communicate the item's value. A reader scanning only the bold titles should be able to reconstruct the list's core argument. Vague titles ("Poor Communication," "Better Processes," "The Right Tools") are prohibited -- they communicate category, not insight.
- **Explanation (2-4 sentences for standard items; 4-6 for short lists of 3-5 items; 1-2 for long lists of 20+):** State what the item is, why it matters, and what its mechanism is. Do not repeat information already in the title.
- **Concrete anchor (required, one per item):** This is the element that separates a forgettable listicle from one that gets bookmarked. The concrete anchor must be one of: a specific number or data point, a named example (a real scenario, tool, or practice), a direct comparison ("Most teams do X; effective teams do Y instead"), or a second-order consequence ("The immediate cost is X; the compounding cost is Y"). Do not substitute a vague platitude for this anchor.
- **Closer (optional, one sentence):** A "why this matters" payoff sentence that advances to the next-order consequence. Include when the item's significance is not obvious. Omit when the explanation and anchor make it redundant.

### Step 6: Write the Conclusion

The conclusion serves a different function than the introduction. It synthesizes, not summarizes:

- **Do not restate each item.** A conclusion that says "We covered X, Y, and Z" adds zero value. The reader just finished X, Y, and Z.
- **Identify the unifying mechanism:** What is the single underlying principle that explains why every item on this list exists? Name it explicitly. This is the insight the reader could not have generated before reading the full list. Example: For a "7 mistakes first-time managers make" list, the unifying mechanism might be "all of these mistakes come from applying individual-contributor metrics to a role where your output is now entirely mediated by other people."
- **Give one concrete next action:** Not a vague directive ("start implementing these today") but a specific, executable action the reader can take in the next 24 hours. One action, not a list of actions -- a second list inside the conclusion signals that the main list was insufficient.
- **Word limit:** 75-125 words. If you are writing more than this, you are summarizing instead of synthesizing.

### Step 7: Apply the Consistency and Quality Checklist

Before delivering the output, run every item through this checklist:

- Every item title follows the same grammatical pattern -- all imperatives, all gerunds, all noun phrases. No mixing.
- No two item titles could be merged without losing meaningful content.
- Every item contains exactly one concrete anchor (number, example, comparison, or consequence).
- No item body contains information already established in the item title -- each sentence advances understanding.
- The introduction does not exceed 150 words.
- The conclusion does not restate the list.
- The conclusion ends with exactly one specific next action.
- No item uses "And more," "Bonus," or positional language like "most importantly" or "the best of all" unless the list is explicitly ranked and the ranking was established upfront.
- Heading levels are consistent throughout: if items use H2, every item uses H2; if items use H3, every item uses H3. No mixing.

---

## Output Format

The output follows this structure. Field annotations in brackets are instructions, not output.

```
# [Number] [Listicle Type Qualifier] [Topic] [Value Phrase or Audience Anchor]
[Examples of strong titles:]
[5 Pricing Mistakes That Kill SaaS Trials Before They Convert]
[9 Content Formats That Generate Backlinks Without Paid Outreach]
[7 Things Senior Engineers Do in Code Review That Junior Engineers Don't]

---

[Introduction: 100-150 words. Problem frame (1-2 sentences) + value promise (1 sentence)
+ optional credibility anchor (1 sentence). No questions. No "In today's world."]

## 1. [Specific, Scannable Item Title in Consistent Grammatical Pattern]

[Explanation: 2-4 sentences. What it is, why it matters, what its mechanism is.
No restating the title.]

[Concrete anchor: one specific number, named example, direct comparison, or
second-order consequence. Woven into the explanation, not appended as a separate sentence.]

[Optional closer: one sentence advancing to next-order consequence. Omit if redundant.]

## 2. [Specific, Scannable Item Title]

[Same structure as item 1.]

## 3. [Specific, Scannable Item Title]

[Same structure as item 1.]

[... repeat for all N items ...]

## [N]. [Specific, Scannable Item Title]

[Same structure as all previous items.]

---

## [Synthesis Heading -- not "Conclusion" or "Summary"]
[Options: "The Common Thread," "What This Actually Means," "The Pattern Underneath All of These"]

[Unifying mechanism (1-2 sentences): the single underlying principle that explains
why every item on this list exists. This is the insight the reader could not have
generated without reading the full list.]

[One specific next action (1-2 sentences): executable within 24 hours. One action only.]
```

**Format Variants by Publication Context:**

| Context | Item heading level | Item body length | Concrete anchor format |
|---|---|---|---|
| Long-form blog post | H2 per item | 3-5 sentences | Named example or data point |
| Email newsletter | Bold paragraph lead | 2-3 sentences | One-line comparison |
| LinkedIn article | H2 or bold lead | 2-3 sentences | Specific number or percentage |
| Social thread | No heading | 1-2 sentences | Short comparison or stat |
| Content hub pillar | H2 per item + H3 sub-points | 5-8 sentences | Multiple anchors + internal link slot |

---

## Rules

1. **Every item title must contain a specific claim, not a category label.** "Communication Problems" names a category. "Sending Status Updates Without Confirming Receipt" names a specific, actionable problem. If the title could apply to 50 different articles, it is too vague.

2. **Odd-number lists outperform even-number lists for headline engagement.** When the user has no preference, recommend 5, 7, 9, or 11. The psychological reason is that odd numbers feel less arbitrary -- a list of 8 prompts the question "why not 9?" A list of 7 does not. When the content dictates an even number, use it without apology, but don't choose even by default.

3. **The concrete anchor is non-negotiable.** Every item must include a specific number, a named real-world example, a direct comparison, or a second-order consequence. Vague qualifiers ("significantly," "often," "in many cases") are not anchors. If you cannot produce a concrete anchor for an item, that item is not ready to be written -- replace it with one that can be anchored.

4. **Items must be scoped at the same altitude.** If one item is a micro-tactic ("Use keyboard shortcuts in your email client") and another is a strategic principle ("Eliminate all reactive work before 10am"), they belong in different listicles. Either zoom in all items or zoom out all items before writing.

5. **The introduction must not exceed 150 words.** Readers arrive for the list. Every word of preamble is a barrier. If background context is genuinely necessary, embed it inside item bodies as part of the explanation -- don't load it into the introduction.

6. **Never imply ranking in an unranked list.** Phrases like "perhaps the most important of all," "the best of these," or "above all else" introduce a hierarchy the reader did not agree to. If the list is unranked, every item carries equal weight. If the list is ranked, state the ranking criteria explicitly before the first item.

7. **The conclusion must not summarize.** A conclusion that restates items is a table of contents written in the past tense. The conclusion's job is to name the unifying mechanism -- the single insight that only becomes visible after reading all items together -- and convert that insight into one specific next action.

8. **Items must be grammatically parallel.** Imperative-verb titles ("Audit your onboarding emails every quarter") cannot appear in the same list as gerund titles ("Skipping the post-mortem") or noun-phrase titles ("The role of context in feedback"). Establish a grammatical pattern in item 1 and enforce it for every subsequent item.

9. **Never use "Bonus:" as a final item.** A bonus item signals that the writer could not decide whether the item belonged in the list. If the item is worth including, it is worth numbering. If it is not worth numbering, cut it. A list of 8 items with a "Bonus 9th" is a list of 9 items that lacks the courage of its count.

10. **Short lists require deep items; long lists require tight items.** A list of 5 items in which each item receives 2 sentences delivers less value than a standard blog paragraph. Items in a 5-item list need 5-7 sentences each and multiple concrete anchors. A list of 20+ items cannot give each item 5 sentences without the total piece becoming unreadable -- cap each item at 2-3 sentences and group items under H2 subcategories.

11. **Headlines must be specific enough to be falsifiable.** A headline like "Tips to Improve Your Writing" cannot be wrong. A headline like "7 Structural Habits That Separate Readable Business Writing from Wall-of-Text Reports" makes a specific claim that a reader can evaluate. Falsifiable headlines generate more reader trust and higher click-through rates.

12. **Do not pad to reach the target count.** If honest item development produces 6 strong items and 1 weak one, the listicle is a 6-item listicle. Adding a weak 7th item to hit an arbitrary target degrades the piece. Either find a genuinely distinct 7th item or adjust the headline.

---

## Edge Cases

### The User Provides Items That Are Not Parallel in Type

This happens when the user has been thinking about a topic across multiple sessions or from multiple angles. They provide a mix of tactical tips, philosophical principles, tool recommendations, and process steps and call all of them "items." Before writing, sort the provided items into type groups (tactics, principles, tools, processes). If items span two or more types, offer the user a choice: (1) narrow the scope to one type and cut the outliers, (2) reframe all items to a single type (usually "tactics" is the most flexible container), or (3) structure the listicle with informal cluster labels that separate the types within the numbered sequence. Do not force-fit unlike things into false parallelism.

### The User Asks for a List Shorter Than 4 Items

A list of 3 items is a strong short-form blog post, not a listicle. The numbered format for 3 items does not provide the scanning value that justifies the format. Inform the user that below 4 items, the listicle format adds structure without adding clarity. Offer two alternatives: (1) expand to 5 items if the topic supports it, or (2) write the content as a short `blog-post-writing` output with the three points as embedded subheadings. If the user insists on 3 items, write each item with 5-7 sentences and at least two concrete anchors each -- the depth must compensate for the short count.

### The User Asks for a List of 20 or More Items

Lists above 15 items become reference documents, not blog posts, and must be structured accordingly. Group items into 3-5 thematic clusters, each with an H2 subheading. Each item within a cluster gets 2-3 sentences maximum -- conciseness becomes the discipline at this scale. Add a brief (2-3 sentence) cluster introduction before the first item in each group. The conclusion at this scale should function as a decision tree ("If you are dealing with X, start with cluster 2; if you are starting from scratch, start with cluster 1") rather than a synthesis paragraph. Consider recommending a table of contents at the top if the piece will publish on a platform that supports anchor links.

### The User Wants a Comparison Listicle ("X vs. Y" for Multiple Options)

When each list item is a distinct option being evaluated against the others, the item structure shifts from explanation-plus-example to a four-part framework: (1) name the option with a specific title, (2) state its primary strength in one sentence with a concrete anchor, (3) state its primary limitation in one sentence, (4) name the specific user profile for whom it is the right choice. Do not attempt to declare a winner unless the user explicitly asks for a recommendation -- comparison listicles should empower the reader to self-select, not persuade them to a predetermined conclusion. Add a summary comparison table after the last item, before the conclusion, with columns for Option, Best For, Primary Strength, and Primary Limitation.

### The User's Topic Is Sensitive, Contested, or Subject to Expert Disagreement

Listicles on health, finance, legal matters, mental health, parenting, or politically contested topics require modified handling. Flag upfront in the output that the content represents general information and not professional advice. When items reflect contested practices or emerging research, frame them as "approaches that some practitioners use" or "emerging evidence suggests" rather than stating them as settled facts. Avoid items that could be misapplied by a vulnerable reader. If the topic is primarily contested with no stable evidence base, recommend against the listicle format entirely -- a balanced `opinion-piece` or `explainer-article` that presents multiple perspectives is more responsible.

### The User Wants a Listicle But Has No Idea What the Items Should Be

When the user provides only a topic and a target audience but no item ideas, apply a structured ideation framework before writing. For tips and tactics lists: brainstorm items across three categories -- things most practitioners do wrong, things effective practitioners do differently, and things that appear unimportant but have outsized impact. For mistakes lists: map the user journey and identify failure points at each stage. For tools lists: organize options by use case and select the most-differentiated representatives rather than listing every available option. Present a proposed item set to the user for approval before writing -- this eliminates the most common revision cycle.

### The User Wants to Update or Extend an Existing Listicle

When the user provides a previously written listicle for revision, audit it against all the rules above before suggesting additions. A common pattern is that the existing piece has 7 items, 2 of which overlap, 1 of which is underdeveloped, and 4 of which are solid. Rather than simply adding new items to reach a higher count, propose a rehabilitation plan: merge the overlapping items into one stronger item, deepen the underdeveloped item, and then add new items to reach the target count. Delivering an extended but unaudited list compounds existing weaknesses rather than fixing them.

---

## Example

**Input:** "Write a listicle for founders who are about to hire their first salesperson. They're trying to avoid common mistakes. Target: SaaS founders with a product that has some traction but no formal sales process. Around 7 items."

---

**Output:**

# 7 Mistakes SaaS Founders Make When Hiring Their First Salesperson

Founders who close the first 20 customers themselves often assume sales will scale when they hire the right person. It usually doesn't -- at least not the way they expect. The mistakes below don't come from hiring the wrong salesperson. They come from structuring the relationship wrong before that person starts. Here's what to watch for in the 90 days surrounding your first sales hire.

## 1. Hiring for Rolodex Instead of Process-Building Ability

A salesperson with 500 warm enterprise contacts sounds like a shortcut. In most cases, it is a trap. Rolodex hires work when the product and ICP are already validated and the hire's network maps precisely onto that ICP. At the pre-process stage, what you actually need is someone who can build repeatable qualification criteria, write discovery call scripts, and document objections -- someone who creates infrastructure, not someone who leverages existing relationships. Ask every candidate: "Tell me about a pipeline you built from scratch. What did you put in place first?"

## 2. Failing to Document What You Did to Close the First 20 Customers

Before the hire starts, you need a sales artifact -- a written record of how you, the founder, actually sold. Which outreach messages got replies. Which discovery questions surfaced real urgency. Which objections came up in every deal and which responses converted. Without this document, your new hire has no baseline to work from and no way to distinguish their own approach from your proven one. Spend two to four hours before their first day reconstructing your sales process from memory and your email history. This document becomes their onboarding curriculum.

## 3. Setting a Revenue Quota Before the Sales Process Exists

Attaching a 90-day quota to a rep who has no established ICP definition, no call framework, no objection playbook, and no CRM hygiene standard is not performance management -- it is pressure without infrastructure. The first 30 days should be a documented learning sprint: shadow the founder on three to five live sales calls, map the current pipeline, and draft the first version of the sales playbook. Quota starts at day 31 at the earliest, calibrated against deal cycle length. A SaaS deal with a 45-day average cycle cannot produce closed revenue in a 30-day ramp window regardless of the rep's skill.

## 4. Giving the Rep Full Pricing Discretion Too Early

Founders often hand over pricing authority to avoid being pulled into late-stage deal conversations. The result is that the first rep discounts aggressively to hit their number, trains the market to expect discounts, and sets a precedent that costs the company two to three deal cycles to correct. In the first six months, require founder approval for any discount above 10 percent. This keeps the founder in high-stakes conversations long enough to capture deal intelligence while preventing margin erosion.

## 5. Conflating "Good at Selling" with "Good at Selling This Product to This Buyer"

A rep with a 130% attainment record at a company selling developer tooling to CTOs at 500-person companies has a specific skill set. If your product sells to operations managers at 30-person logistics companies, their pattern recognition does not transfer -- their outreach style, discovery questions, champion-building tactics, and closing language are all calibrated to a different buyer psychology. During interviews, ask candidates to describe the last buyer they sold to in detail: their job title, their biggest fear about buying, and the typical deal blocker. If the description doesn't match your buyer, the track record doesn't predict performance.

## 6. Skipping the "Sales to CS Handoff" Design Until After the First Churned Account

The first salesperson will close deals the founder would not have closed -- sometimes because they found better buyers, often because they oversold. Without a formal handoff document that captures what the customer was promised, what their stated success metric was, and what the implementation timeline is, customer success operates blind. Design the handoff template before the rep closes their first deal, not after the first customer churns and you're trying to figure out what went wrong. A one-page handoff document with five mandatory fields takes two hours to create and prevents the most common SaaS churn pattern in accounts under 12 months old.

## 7. Interpreting Early Pipeline Activity as Proof the Hire Is Working

A full calendar and a CRM loaded with prospects feel like momentum. They are leading indicators, not outcomes, and they are easy to manufacture. A rep who books 40 discovery calls in month one but converts 2% of them to opportunities is generating activity, not pipeline. Establish outcome metrics alongside activity metrics from day one: discovery-to-opportunity conversion rate (target 25-35% for a validated ICP), average deal size relative to founder-closed deals, and sales cycle length. Review these monthly, not quarterly. A quarterly review gives a struggling rep three months of runway to build false confidence on both sides.

---

## What These Mistakes Have in Common

Every item on this list comes from the same source: the assumption that hiring a salesperson transfers the sales function. It doesn't. It duplicates it -- without the institutional knowledge, relationship context, or process infrastructure that made the founder's version work. The hire is not a delegation of sales. It is the beginning of a sales organization, which requires different inputs than a single founder closing deals.

This week, before anything else: write down how you closed your last three customers. What did you say first? What question made the urgency real? What almost killed the deal? Give that document to your new hire on day one. Everything else on this list becomes easier once they have it.
