# pitch-deck

**Mode skill.** Default-enabled on the Stage specialist.

## When to use

Use when the deliverable is the actual deck — slides in order, with speaker notes. Covers seed and Series A. For live delivery and Q&A, switch to `demo-day-and-q-a`. For the shift sentence anchoring slide one, run `narrative-shift` first.

A pitch deck is a sequence of claims, each earning the next.

## The ten-slide arc

Sequoia template, refined with Raskin's spine. Eleven slides if the ask warrants its own page.

1. **The shift.** One sentence: what changed in the world. No product. No company name in the headline.
2. **The stakes.** Who wins and who loses under the new rules. The slide where the room leans in or checks their phone.
3. **The problem.** The new winner criterion, stated as a problem the buyer feels today. Customer-voice phrasing if available.
4. **The old way and why it fails.** Name the incumbent approach. State the dimension on which it falls short of the new criterion. Do not insult the incumbent — explain its design assumption and why the shift broke it.
5. **The new way.** Name the new approach as a category, not a product. *"We're building a [category] for [audience] in the era of [shift]."*
6. **The product.** One screen, one workflow, one frame. The product is the proof of the category, not the category itself.
7. **Traction or design-partner evidence.** Revenue, users, retention, design partners, waitlist — in that priority. Real numbers only.
8. **Market built bottom-up.** Number of buyers × annual willingness to pay × adoption assumption, with the source for each. Top-down TAM goes in the appendix.
9. **Business model.** Pricing, unit economics, payback period. Coin sets these; you place them.
10. **Team.** One sentence per founder naming the earned advantage relevant to *this* problem.
11. **The ask.** Round size, runway it buys, three milestones it will produce.

## Procedure

1. **Lock the shift sentence first.** Run `narrative-shift`. Do not draft slides until the shift survives the three-question test.
2. **Draft slide one as a headline plus a single proof point.** No bullets. The headline is the shift; the proof point is the dataset or behavioural change that makes it undeniable.
3. **Work slides two through five before the product slide.** Founders skip to the product. You force the narrative spine first.
4. **Pull traction numbers verbatim.** If they say "around 40 users," the slide says "40 users" or you ask for the exact number. No rounding up.
5. **Get the market build from Coin.** Ask Coin to produce it; you place it.
6. **Write speaker notes in the founder's voice.** Read the slide aloud first; the notes are what the founder would say next, not a rephrase.
7. **Stress-test against the twenty Q&A questions.** Run `demo-day-and-q-a`. Any question the deck cannot answer in one breath becomes a slide edit or a prepared line.
8. **Hand the visual template to Mira.** You deliver content and structure; Mira sets the look. Do not pick fonts.

## Decision rules

- **One claim per slide.** If a slide makes two claims, split it or cut one.
- **The product is slide six.** A stranger should be able to summarize the shift, stakes, and problem before they see your product.
- **Bottom-up market only.** Top-down sizing belongs in the appendix, never as the primary slide.
- **The ask names milestones, not categories of spend.** "$2M for 18 months to reach $1M ARR" beats "$2M for engineering, sales, marketing."
- **No "vision" slides at the end.** The shift slide carries the vision. A second vision slide signals the first is weak.

## Anti-patterns

- Logo-clutter "as featured in" slides used as proof. Press is not traction.
- Team slide with five faces and three sentences each. One sentence, founders only.
- TAM/SAM/SOM dolls without a bottom-up build. Investors discount top-down to zero.
- Product screens with feature labels and arrows. One screen, one workflow.
- Competitive matrix scoring green on every row. No reader believes it; some leave on it.

## Before / after

**Brief:** "Seed deck for a B2B tool that pulls product analytics into Slack."

**Before** (product-first, no shift, generic stakes):
> Slide 1: *"Acme — product analytics, simplified."*
> Slide 2: *"The problem: product analytics is hard."*
> Slide 3: *"Our solution: Slack-native dashboards."*

**After** (shift-first, stakes named, product on slide six):
> Slide 1: *"In 2025, every product team moved standups into Slack. Their analytics stayed in a browser tab nobody opens."*
> Slide 2: *"Teams that act on data daily will outship teams that check it weekly. The week-checkers are losing."*
> Slide 3: *"Product managers want one number every morning. They have eleven dashboards and check none."*

The "after" earns slide six. The "before" dies on slide three.
