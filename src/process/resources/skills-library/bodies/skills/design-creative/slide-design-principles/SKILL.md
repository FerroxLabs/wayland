---
name: slide-design-principles
description: |
  Applies slide design principles to a described deck including one idea per
  slide, visual-verbal balance, text reduction targets, white space rules, and
  font size minimums for presentation contexts. Use when the user asks to
  improve slide design, reduce text on slides, apply design principles to a
  presentation, or make slides more visually clear.
  Do NOT use for slide deck content structure (use slide-deck-structure),
  chart selection for data slides (use data-in-slides), or brand identity
  design (use brand-identity-brief).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "presentation design checklist"
  category: "design-creative"
  subcategory: "presentation-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Slide Design Principles

## When to Use

Use this skill when the user's request centers on the **visual design quality** of slides themselves -- not the narrative structure, data visualization choices, or brand identity system.

**Trigger scenarios:**
- User shares a slide description, screenshot, or text dump and asks why their deck "looks cluttered" or "feels overwhelming"
- User asks to reduce the amount of text on slides before an upcoming presentation
- User wants a design audit of a specific slide or full deck against professional standards
- User is rebuilding a presentation template and wants to establish baseline design rules (font sizes, margins, color limits) for their team
- User describes slides that have been rejected by stakeholders for being "too busy," "hard to follow," or "not visual enough"
- User is converting a Word document or dense report directly into slides and needs help stripping it down to presentation-appropriate content
- User asks how to make slides work for both live presenting and async PDF distribution simultaneously
- User wants to check whether their slides meet accessibility contrast and readability requirements

**Do NOT use when:**
- The user needs to plan slide sequence, narrative arc, or story flow -- use `slide-deck-structure` instead
- The user needs to select the right chart type for specific data -- use `data-in-slides` instead
- The user wants to design a brand system, logo, or color palette from scratch -- use `brand-identity-brief` instead
- The user is asking about script writing, speaker notes, or how to deliver a presentation -- this is a speaking/coaching skill, not design
- The user wants to evaluate their presentation structure for logical flow or argumentation -- that is content critique, not visual design
- The user needs to format a report, proposal, or document that happens to use slide software but is meant to be read, not presented

---

## Process

### Step 1: Gather Slide Inventory

Before evaluating anything, establish what you are working with. If the user has not already provided it, ask for the following:

- **Total slide count** -- the scope changes your prioritization strategy
- **Presentation context:** Live presentation to a room, video call screen share, printed handout, or async PDF sent by email? These contexts have different design requirements.
- **Audience size and seating distance:** A 10-person boardroom at 8 feet is different from a 300-person auditorium at 80 feet
- **Slide dimensions:** Standard 4:3 (1024×768px), widescreen 16:9 (1920×1080px), or custom? Widescreen gives more horizontal real estate and changes layout math
- **Slide software in use:** PowerPoint, Keynote, Google Slides, or Pitch? Some constraints (template locking, font availability) depend on the tool
- **Existing template constraints:** Does a corporate master slide exist? Can it be modified?
- **Whether they can share slide text or screenshots** -- even a copy-paste of a single slide's text content is enough to perform a full audit

If the user provides a slide description, extract the following measurable quantities from it before proceeding to any recommendations:
- Estimated word count per slide
- Number of distinct topics or claims addressed on that slide
- Font sizes if mentioned
- Presence or absence of visual elements (images, charts, icons, diagrams)
- Number of colors

### Step 2: Run the Diagnostic Assessment

Evaluate each slide (or the slides described) against six measurable criteria. Assign a pass/fail to each. Do not soften findings -- a slide with 90 words fails the text criterion, even if the content is excellent.

**Criterion 1 -- Words per content slide:**
- Green (pass): 0-30 words
- Yellow (warning): 31-50 words
- Red (fail): 51+ words
- Count every word including title, bullets, labels, annotations. Exclude source citations in 12pt or smaller.

**Criterion 2 -- Ideas per slide:**
- Pass: Exactly 1 central claim, insight, or action
- Fail: The slide title uses "and," "plus," or lists multiple distinct topics
- Test: Can you write a single declarative sentence summarizing this slide? If the sentence requires a conjunction between two unrelated ideas, the slide contains two ideas.
- Exception: Title slides, section dividers, and agenda slides are structural slides and can be evaluated separately

**Criterion 3 -- Font size:**
- Headlines/titles: 32pt minimum for boardroom, 36-44pt preferred, 40pt minimum for auditorium
- Body text and bullets: 24pt minimum for boardroom, 28pt minimum for auditorium
- Labels and callout annotations: 18pt minimum
- Source citations: 12-14pt is the only accepted exception
- Caption text under images: 16pt minimum
- Any text below 18pt on a content slide is a hard fail

**Criterion 4 -- White space:**
- Minimum 40% of total slide area must be empty (no text, no image, no line)
- Measure visually by imagining a grid overlay: if more than 6 out of 10 grid squares have content, white space is insufficient
- Margins: No content element should be within 8% of slide width from the left or right edge, or within 6% from the top or bottom
- A densely populated slide with 10% white space loses 60-70% of comprehension speed in audience testing -- this is not aesthetic preference, it is cognitive science

**Criterion 5 -- Color count:**
- Pass: 2-3 accent colors plus black, white, and neutral grays
- Fail: 4+ distinct accent colors, or a new color introduced only on one slide (creates visual noise)
- Highlight color: Exactly one color reserved exclusively for the single most important element per slide. This color must not appear as decoration or background.
- Background: White, off-white (#F5F5F5), or very light gray (#EEEEEE) for daylight rooms. Dark backgrounds (#1A1A2E, #0D0D0D) are acceptable for auditorium keynote contexts only.

**Criterion 6 -- Visual-verbal balance:**
- Pass: Every content slide has at least one non-text visual element (photograph, diagram, chart, icon, illustration, data visualization, or styled typographic graphic)
- Fail: Slide contains only text (title + bullets with no visual element)
- Exception: Headline-only slides (single large claim statement with no body text) pass because they function as typographic visual elements
- Warning: A visual that is purely decorative and unrelated to the slide's idea is not a pass -- the visual must reinforce the message

### Step 3: Apply the One-Idea-Per-Slide Rule

This is the highest-leverage principle in slide design. Every other principle amplifies or depends on it.

**How to enforce it:**
- Read the slide title. If the title contains a conjunction ("and," "or," "&") connecting two distinct topics, the slide must be split.
- Count the number of distinct claims made on the slide. One claim = one slide.
- Check whether the visual and the text are making the same point. If a slide has a bar chart about revenue AND a bullet list about headcount, those are two different ideas -- split them.
- Ask: "If I removed everything on this slide except one item, what would I keep?" Whatever the answer is, that is the slide's idea. Remove everything else.

**Splitting protocol:**
- When splitting a dense slide, the original slide's title becomes a section divider slide
- Each resulting slide gets a new headline that is a complete insight statement (not a topic label)
- Bad headline: "Revenue" -- this is a topic label
- Good headline: "Revenue grew 14% in Q3, driven by enterprise segment" -- this is an insight statement the audience can remember
- The headline IS the message. If an audience member forgets everything except the headline, they have gotten the point.

**When to use a "parking lot" approach:**
- If a slide contains 8 ideas and only 2 are central to the presentation, move 6 to an appendix section at the back of the deck
- Appendix slides exist for the Q&A -- they do not follow standard text density rules but should still be organized and labeled

### Step 4: Execute Text Reduction

For each slide failing the word count criterion, apply reduction in this sequence:

**Pass 1 -- Eliminate body paragraphs:**
- Any complete sentence of 20+ words belongs in speaker notes, not on the slide
- Slides are visual prompts for the speaker and memory anchors for the audience -- they are not transcripts
- If the user says "but the audience needs the detail," the answer is: put the detail in a leave-behind document, not on the slide

**Pass 2 -- Compress bullets:**
- Maximum 3 bullets per slide, absolute maximum 5 for exceptional cases
- Each bullet: maximum 10 words, ideally 5-7
- Bullets must be parallel in grammatical structure: all noun phrases, or all verb phrases, or all complete sentences -- never mixed
- Remove lead-in words that add no meaning: "It is important to note that..." becomes nothing -- cut it entirely
- Remove hedging language: "may potentially," "could possibly," "generally speaking" -- cut everything except the claim

**Pass 3 -- Compress the headline:**
- Maximum 8 words for a headline
- The headline should be an active statement: subject + verb + outcome
- "Q3 Performance Overview" -- 3 words but zero information (topic label, not insight)
- "Enterprise sales exceeded Q3 target by 23%" -- 7 words, complete insight, audience retains it

**Pass 4 -- Verify the 10-foot test:**
- Mentally zoom the slide to 25% of its full size (or step 10 feet from your monitor)
- Every word must be readable
- If it is not readable, the font is too small -- which means there is too much text for the font to stay large

**Replacement hierarchy for removed text:**
1. Replace a process described in bullets with a flow diagram or numbered visual sequence
2. Replace a comparison described in bullets with a side-by-side visual or simple table (max 3 columns, max 4 rows)
3. Replace a list of attributes with icons + 3-word labels
4. Replace a statistic buried in a bullet with a single large number displayed typographically (96pt font, bold, with a 5-word label underneath)
5. Replace a trend described in words with a chart (even a very simple one -- single line, two bars)

### Step 5: Enforce Font Size and Typography Hierarchy

Typography is the infrastructure of slide readability. Establish a three-tier hierarchy and apply it consistently across all slides.

**The three-tier hierarchy:**
- **Tier 1 -- Headline:** 36-44pt, sans-serif, bold or heavy weight. This is the insight statement. One per slide.
- **Tier 2 -- Body/bullets:** 24-28pt, same sans-serif as headline or a secondary typeface, regular weight. Maximum 3 lines.
- **Tier 3 -- Annotations/labels:** 18-20pt, regular or light weight. Used for chart labels, callouts, footnotes.

**Font family rules:**
- Maximum 2 typeface families per deck -- one for headlines, one for body (or the same family throughout)
- Never mix two different sans-serif families -- the difference is imperceptible and creates visual noise without hierarchy
- Pair a humanist sans-serif (e.g., Gill Sans, Futura, Aktiv Grotesk) with a neutral one (e.g., Helvetica, Arial) only if there is a clear reason -- default to one family
- System-safe fonts for cross-platform reliability: Calibri, Helvetica, Arial (Windows/PC), or Gill Sans, Optima, Helvetica (Mac/Keynote)
- Avoid decorative, script, or display typefaces except for a single title card -- they fail the 10-foot readability test

**Weight and style usage:**
- Bold: Headlines and single key words or numbers requiring emphasis
- Regular: All body text
- Italic: Slide source citations and technical terms only -- never for emphasis (use bold instead)
- ALL CAPS: Use only for very short labels (2-3 words maximum) -- all caps text is 10-15% slower to read than mixed case

**Spacing rules:**
- Line spacing: 1.3-1.5x within a text block (not 1.0 -- single spacing collapses legibility)
- Between headline and body block: At least 2x the body font size in points (e.g., 48pt gap for 24pt body)
- Between bullet items: At least 1.5x the line height -- bullets that are visually stacked become a wall of text

### Step 6: Design White Space and Layout Structure

White space is a design element, not the absence of design. It directs attention, creates hierarchy, and gives the audience's eye a resting place between processing bursts.

**The three layout archetypes for content slides:**

**Layout A -- Left-Right Split (most common for text + visual):**
- Left 45%: Headline at top, 2-3 bullet points below
- Right 55%: Visual (chart, image, diagram, icon)
- 10% margin on left and right slide edges
- 8% margin on top and bottom
- Vertical divider line between zones is optional and usually unnecessary

**Layout B -- Top-Bottom Split (for visual-dominant slides):**
- Top 20%: Headline
- Bottom 80%: Full visual (chart, photo, diagram) with labels
- Text is restricted to the headline and chart labels only
- Best for data-heavy slides where the visual IS the message

**Layout C -- Centered Statement (for key claim slides):**
- Single large typographic statement centered on the slide
- 40-48pt font minimum
- The only element on the slide
- Used for key transitions, major insights, rhetorical moments
- Minimum 30% white space on all four sides of the text block

**Margin enforcement:**
- No element should touch or "bleed" into the slide margin
- If using a 1920×1080px canvas, the safe content area is approximately 1728×972px (leaving ~96px on left/right, ~54px on top/bottom)
- In PowerPoint, set guides at 0.5 inch from each edge and enforce them

**Visual grouping with white space (Gestalt proximity):**
- Elements closer together are perceived as related
- Leave MORE space between unrelated elements than between related ones
- If a headline and a chart are related, they can be 24pt apart
- If a chart and a source citation are separate entities, leave 48pt between them
- Never use lines, boxes, or borders to group elements -- use space instead. Lines add visual clutter; space achieves the same grouping effect cleanly.

### Step 7: Apply Color Discipline

Color in presentations serves three purposes only: hierarchy (directing attention), identity (branding consistency), and meaning (encoding information in charts). Every color that does not serve one of these three purposes must be removed.

**Palette construction:**
- **Primary neutral:** White or light gray background -- the base canvas
- **Text color:** Near-black (#1A1A1A or #222222) -- pure black (#000000) is slightly harsh; near-black reads as softer and is easier to reproduce
- **Brand accent 1:** The organization's primary color -- used for headlines or the single most important visual element per slide
- **Brand accent 2:** Secondary brand color -- used sparingly for supporting elements (max one use per slide)
- **Highlight/emphasis color:** A high-contrast accent (often a warm color -- amber, coral, or teal if the brand colors are cool) -- used only to emphasize the single most critical number or phrase per slide

**Color meaning consistency:**
- Assign explicit semantic roles to each color and document them: "blue = our company performance, orange = competitor, gray = industry baseline"
- Never use a color for decoration on slide 4 and then use it for meaning on slide 12 -- the audience subconsciously interprets all uses of a color as carrying the same meaning

**Contrast requirements:**
- Body text on background: Minimum 7:1 contrast ratio (WCAG AAA -- presentation contexts require higher than web minimum because of projector and screen variability)
- Large text (36pt+) on background: Minimum 4.5:1 (WCAG AA)
- Chart elements: Distinguishable without relying on color alone -- add pattern, shape, or label as a second differentiator for accessibility
- Never use red/green as the only differentiation between two data series -- approximately 8% of the male population has red-green color vision deficiency

**Common color mistakes to flag and fix:**
- Gradient backgrounds: Nearly always reduce text contrast and add visual noise -- replace with flat color
- Drop shadows on text: Creates halo effect that reduces legibility -- remove
- Multiple highlight colors: If 5 words on a slide are highlighted in 5 different colors, nothing is emphasized
- Neon or saturated colors at full intensity: Reduce saturation to 70-80% -- pure red (#FF0000) or pure blue (#0000FF) at 100% saturation creates visual vibration against white

### Step 8: Produce Prioritized Recommendations

After completing the diagnostic, compile all findings into a structured report. Prioritize by audience comprehension impact, not ease of implementation.

**Priority tiers:**

**P1 -- Critical (address before any presentation):**
- Any slide with 2+ ideas (violates foundational principle)
- Any slide with font sizes below 18pt
- Any slide with 60+ words
- Any color contrast failure

**P2 -- High (address before a high-stakes presentation):**
- Any slide with 31-59 words
- Font sizes in the 18-23pt range
- White space below 25%
- Text-only slides without visual elements

**P3 -- Medium (address if time allows or for final polish):**
- White space in the 25-39% range
- Color inconsistencies (same color used for two different meanings)
- Font family count at 3 (reduce to 2)
- Bullet grammatical structure inconsistencies

**P4 -- Low (nice-to-have polish):**
- Minor spacing irregularities
- Icon style inconsistency (mix of outline and filled)
- Annotation font size at 17pt (close to minimum)

For each recommendation, provide four elements:
1. The specific slide number and element
2. The current state (what is wrong and why it fails)
3. The specific change to make (actionable, not vague)
4. The audience impact (what becomes easier for the audience when this is fixed)

---

## Output Format

```
## Slide Design Review: [Presentation Title or Slide Range]

### Context
- **Presentation type:** [Live room / Video call / Async PDF / Hybrid]
- **Audience size:** [N people at approximately X feet from screen]
- **Slide dimensions:** [16:9 / 4:3 / custom]
- **Slides reviewed:** [N slides, slides X through Y]

---

### Diagnostic Assessment

| Design Criterion        | Current State           | Target                        | Status   |
|-------------------------|-------------------------|-------------------------------|----------|
| Words per content slide | [avg X words, max Y]    | < 30 words                    | [●/●/●]  |
| Ideas per slide         | [X slides with 2+ ideas]| 1 per slide                   | [●/●/●]  |
| Min font size (body)    | [Xpt]                   | 24pt boardroom / 28pt auditor | [●/●/●]  |
| Min font size (headline)| [Xpt]                   | 32pt boardroom / 40pt auditor | [●/●/●]  |
| White space             | [~X%]                   | > 40%                         | [●/●/●]  |
| Color count             | [X accent colors]       | 2-3 accent + B/W/gray         | [●/●/●]  |
| Visual-verbal balance   | [X of Y slides have vis]| All content slides             | [●/●/●]  |
| Font families           | [X families]            | Maximum 2                     | [●/●/●]  |
| Contrast compliance     | [pass/fail/unknown]     | WCAG AA minimum               | [●/●/●]  |

Status key: ● Pass   ◑ Warning   ○ Fail

---

### P1: Critical Changes

#### One-Idea-Per-Slide Violations

**Affected slides:** [List slide numbers]

| Slide | Current Ideas on Slide | Recommended Split | Resulting Slides |
|-------|------------------------|-------------------|------------------|
| [N]   | [List the distinct ideas] | [Split approach] | [New slide titles] |

**Split specifications:**
- **Slide [N] → [New Title A]:** [What stays on this slide, what headline to use, what visual to add]
- **Slide [N] → [New Title B]:** [What moves to this slide, what headline to use, what visual to add]
- **Moved to appendix:** [Elements that are not essential to the live presentation]

#### Font Size Violations

**Affected slides:** [List slide numbers]

| Slide | Element | Current Size | Required Size | Change |
|-------|---------|-------------|---------------|--------|
| [N]   | [Headline / Body / Label] | [Xpt] | [Ypt] | Increase by [Z]pt |

**Consequence of current sizes:** [Explain what becomes unreadable at what distance]

#### Contrast Failures

| Slide | Element | Foreground Color | Background Color | Current Ratio | Required |
|-------|---------|-----------------|-----------------|---------------|----------|
| [N]   | [Body text] | [#XXXXXX]  | [#XXXXXX]      | [X:1]         | 4.5:1 min |

---

### P2: High-Impact Changes

#### Text Reduction Recommendations

**For each slide over 30 words:**

---
**Slide [N]: "[Current Title]"**
- **Current word count:** [X words]
- **Target word count:** [Y words] (reduce by [Z]%)
- **Current headline:** "[Current text]" ([X] words, [topic label / insight statement?])
- **Revised headline:** "[New headline]" ([Y] words -- active insight statement)
- **Bullets to remove entirely:** "[Text of bullet]" -- reason: [content belongs in speaker notes / covered by visual / redundant with headline]
- **Bullets to compress:**
  - Before: "[Full current bullet text]"
  - After: "[Compressed version]"
- **Recommended visual replacement:** [Specific visual type -- e.g., "Replace 3 bullets about process steps with a 3-step horizontal flow diagram with icon + 4-word label per step"]

---

#### White Space Improvements

| Slide | Current White Space | Issue | Recommended Fix |
|-------|--------------------|----|-----------------|
| [N]   | [~X%] | [Elements at edge / too many elements / margin violations] | [Specific layout change] |

**Layout recommendations:**
- **Slide [N]:** Switch to Layout [A/B/C]. Move [element] to [position]. Remove [element] to notes.

---

#### Visual-Verbal Balance Gaps

| Slide | Currently Has | Recommended Visual | Placement |
|-------|--------------|-------------------|-----------|
| [N]   | Text only    | [Specific visual type and content] | [Left/Right/Below/Full-bleed] |

**Visual specifications per slide:**
- **Slide [N]:** [Detailed description of what the visual should show, what type it should be, and how it reinforces the headline message]

---

### P3 and P4: Polish Changes

| Priority | Slide | Issue | Fix |
|----------|-------|-------|-----|
| P3 | [N] | [Color inconsistency / font family count / grammar parallel] | [Specific fix] |
| P3 | [N] | [Same] | [Fix] |
| P4 | [N] | [Minor spacing / icon style] | [Fix] |

---

### Typography Specification (Apply Deck-Wide)

| Element | Typeface | Size | Weight | Color |
|---------|----------|------|--------|-------|
| Slide headline | [Font name] | [Xpt] | Bold | [#XXXXXX] |
| Body / bullets | [Font name] | [Xpt] | Regular | [#XXXXXX] |
| Annotations / labels | [Font name] | [Xpt] | Light or Regular | [#XXXXXX] |
| Source citations | [Font name] | 12-14pt | Regular | [#XXXXXX] |
| Highlight / emphasis | [Same as body] | [Same] | Bold | [Highlight color #XXXXXX] |

---

### Color Palette Specification (Apply Deck-Wide)

| Role | Color | Hex | Usage Rule |
|------|-------|-----|------------|
| Background | Off-white | #F8F8F8 | All slide backgrounds |
| Primary text | Near-black | #1A1A1A | All body text |
| Headline accent | [Brand color] | [#XXXXXX] | Headlines only |
| Emphasis highlight | [Accent] | [#XXXXXX] | One use per slide max, most critical element only |
| Supporting accent | [Brand color 2] | [#XXXXXX] | Secondary visual elements |
| Chart neutral | Medium gray | #888888 | Non-emphasized data series |

---

### Implementation Order

Complete changes in this sequence to get maximum improvement in minimum time:

| Step | Action | Slides Affected | Time Estimate | Expected Impact |
|------|--------|----------------|---------------|-----------------|
| 1 | Split multi-idea slides | [List] | [X min] | Foundational -- enables all other changes |
| 2 | Rewrite headlines as insight statements | All | [X min] | Highest retention impact |
| 3 | Increase font sizes | [List] | [X min] | Readability in room |
| 4 | Reduce word count to targets | [List] | [X min] | Reduces cognitive load |
| 5 | Add missing visuals | [List] | [X min] | Dual-coding memory improvement |
| 6 | Fix margins and white space | [List] | [X min] | Processing speed |
| 7 | Standardize color palette | All | [X min] | Coherence and professionalism |
| 8 | Polish typography consistency | All | [X min] | Final credibility |
```

---

## Rules

1. **Never accept a multi-idea slide without recommending a split.** This is the single most impactful improvement in any slide audit. A slide covering two ideas simultaneously forces the audience to split their attention and retain less of both. There is no word count target, no font size, and no visual addition that compensates for a multi-idea slide -- the slide must be split first.

2. **Never allow body text below 24pt for boardroom contexts or 28pt for auditorium contexts.** This is not a style preference -- it is a physiological constraint. At standard presentation viewing distances, 14pt text on a 1080p slide projects to the equivalent of 6pt text at reading distance. The audience cannot read it and will stop trying within 30 seconds.

3. **The headline must be an insight statement, not a topic label.** "Revenue Performance" is a file folder label. "Revenue exceeded forecast by $2.1M for the third consecutive quarter" is a headline that survives after the slide is gone. Every slide headline must be a complete sentence with a subject, verb, and outcome or implication.

4. **White space must be enforced at 40% minimum, calculated honestly.** Do not count thin margins as white space. Do not count the small gaps between crowded bullets as white space. A slide fails the white space criterion if a viewer's first reaction is "there's a lot going on here." The 40% threshold is a functional floor, not an aesthetic ideal.

5. **Highlight color must appear exactly once per slide and encode only one semantic role throughout the entire deck.** If amber is used to highlight the key statistic on slide 6, amber cannot appear as a decorative element on slide 9 and as a competitor color on slide 14. Color meaning is cumulative across a deck -- the audience learns what each color means after 2-3 slides.

6. **Every content slide must contain at least one visual element that reinforces the slide's central idea.** A "visual element" is not a decorative stock photo or a corner logo. It is a photograph, diagram, chart, data visualization, icon, or styled typographic graphic that directly illustrates or supports the headline's claim. If the visual could be removed without reducing understanding of the slide's idea, it does not qualify.

7. **Bullet points are a last resort, not a default.** Before recommending bullets, always consider whether a diagram, numbered visual sequence, icon grid, comparison table, or large typographic number would communicate the same information more efficiently. Bullets are acceptable for genuinely list-like content (items without inherent structure or sequence). They are not acceptable for process steps, comparisons, before/after contrasts, spatial relationships, or hierarchical information.

8. **Never introduce new colors in charts that do not exist in the slide color palette.** Default chart color schemes (the rainbow of Microsoft Office defaults) are one of the most common sources of visual incoherence in business presentations. Every data series color in every chart must map to the deck's defined palette. This often means reducing chart complexity (fewer series) to work within palette constraints -- which is usually an improvement anyway.

9. **Prioritize P1 issues before offering P3 or P4 polish suggestions.** It is counterproductive to suggest tightening icon style consistency (P4) before addressing a slide with 120 words and 9pt font (P1). Always present issues in impact order and explicitly label each recommendation's priority. If the user has limited time, P1 changes alone deliver 80% of the comprehension improvement.

10. **Treat speaker notes as the recovery mechanism for all removed text.** When recommending text reduction, always specify that removed content should move to speaker notes, not simply disappear. This resolves the most common user objection ("but the audience needs that detail") by clarifying the appropriate location for detail: the speaker's mouth or the leave-behind document, never the slide itself.

11. **Never apply font size reductions to accommodate more content.** If content does not fit at 24pt, the answer is to remove content, not to reduce font size. This rule prevents the self-defeating spiral of reducing font size to fit more text, which requires more text because the visual is less readable, which requires more font size reduction.

12. **Evaluate dark-background slides with adjusted contrast standards.** A dark slide (#1A1A2E background with white text) can be visually effective but requires strict contrast enforcement. White text on a dark background must still meet 7:1 contrast ratio for body text, and any accent colors used on dark backgrounds must be tested -- many brand colors that work on white fail badly on dark backgrounds.

---

## Edge Cases

### Locked Corporate Template with Non-Negotiable Elements

Many enterprise presentations use master slide templates with a persistent logo, header bar, color footer, and watermark that collectively consume 25-35% of the slide canvas before any content is placed. The standard 40% white space target applies to the **remaining content area**, not the full slide.

**Handling protocol:**
- Calculate the available content area: total slide area minus template chrome
- Apply the 40% white space rule to the available content area only
- Increase font size recommendations by 2pt to compensate for the reduced canvas
- If the template forces a font family, work within it -- establish size hierarchy within that single family using weight and size contrast
- If template constraints cause a fundamental conflict with readability (e.g., mandatory 12pt body font), document the conflict explicitly and recommend the user escalate to their design/brand team with specific measurable impact data
- Do not pretend template constraints do not exist -- acknowledge them, work around them where possible, and flag unresolvable conflicts

### High-Stakes Data-Heavy Deck (Financial Review, Board Report, Research Results)

Financial and research presentations often require density that conflicts with standard consumer presentation advice. The resolution is segmentation -- not lowering standards but applying them to the right slides.

**Handling protocol:**
- Separate the deck into two zones: **narrative slides** (follow all design principles strictly) and **evidence/appendix slides** (relaxed density, still organized)
- Narrative slides tell the story: executive summary, key findings, recommendations. These follow every principle in this skill.
- Evidence slides provide supporting data for Q&A: detailed tables, multi-variable charts, regression outputs. These may have higher density but must have clear structure -- no wrapping text, consistent table formatting, clear headers at 18pt minimum
- Data tables: Maximum 5 columns × 8 rows on a presented table. Beyond that, it belongs in an appendix or a leave-behind
- Never present a table with horizontal scrolling or text wrapping -- if it does not fit cleanly at 18pt minimum, the table must be simplified or moved to appendix
- The insight headline rule applies doubly to data slides: every data slide needs a headline that tells the audience what to conclude from the data, not just what the data is

### Async Distribution (Presentation as Document)

When slides will be sent as a PDF and read without a presenter, the live presentation design constraints shift significantly because the reader controls pace and is sitting close to the screen.

**Modified standards for async slides:**
- Font size minimum relaxes to 18pt body, 28pt headline (screen reading distance)
- Word count ceiling rises to 50 words per slide (readers can process more at their own pace)
- One-idea-per-slide rule remains fully in effect -- do not combine ideas because of the reading format
- Speaker notes either become on-slide annotation text or a separate companion document
- Visual-verbal balance becomes even more important because there is no speaker to provide context -- visuals must carry more of the explanatory load
- If the deck must serve BOTH live and async purposes: design for live standards, then create a "reading version" with speaker notes converted to on-slide text boxes in a distinct style (indented, smaller, clearly differentiated from the presentation text)

### No Visual Assets Available

Users presenting without access to a design team, stock image library, or icon set can still achieve strong visual-verbal balance using zero-cost approaches.

**Visual alternatives hierarchy when no images or icons are available:**
1. **Typographic graphics:** A single large number at 96-120pt is a powerful visual element. "47%" displayed at massive scale with a 5-word label is more memorable than a paragraph explaining the percentage.
2. **Simple geometric shapes:** A circle for a cyclical process, three rectangles for a three-step sequence, a large arrow for directional change -- these are buildable in any slide software in minutes
3. **Color blocks:** A full-bleed background color change on a key slide serves as a visual signal and creates visual variety without any imagery
4. **White space as visual:** A slide with a single centered 40pt headline and 60% white space reads as confident and deliberate -- it IS visual design
5. **Simple tables with visual treatment:** A 2×3 comparison table with alternating light gray and white row backgrounds reads as a designed visual element, not a text dump
6. **Quote formatting:** A pull quote displayed at 32pt with a generous left margin indent and a 4pt left border in the accent color is a fully visual text treatment
- Recommend that the user establish a consistent icon style for future use: monoline outline icons at 24px or 48px grid with 1.5pt stroke weight -- these are freely available and apply universally

### Non-Latin Script Languages

Presentations in languages using Arabic, Hebrew, CJK (Chinese, Japanese, Korean), Devanagari, Thai, or other visually complex scripts require adjusted standards because the cognitive load of character recognition is higher.

**Modified standards:**
- Font size recommendations increase by 2-4pt across all tiers: body minimum becomes 28pt (boardroom) and 32pt (auditorium)
- Line spacing increases to 1.5-1.75x -- CJK and Devanagari scripts extend above and below the baseline more than Latin scripts and need more vertical breathing room
- Word count targets are less meaningful as a raw metric -- count ideas and visual density instead
- Right-to-left scripts (Arabic, Hebrew) require the entire slide layout to mirror: text blocks right-aligned, visual elements on the left (opposite of Latin layout convention), navigation arrows reversed
- Mixed-script slides (e.g., a slide with both English and Arabic) require the design to establish a clear dominant reading direction and apply it consistently
- White space becomes even more critical for complex scripts -- reduce content targets by approximately 20% compared to Latin recommendations

### Presentation Revamp Under Time Pressure

Users often disclose that they have 90 minutes before a presentation and need to improve their slides now. The full optimization process takes time they do not have.

**Triage protocol for time-constrained improvements:**
- **30 minutes available:** Fix only P1 issues -- split multi-idea slides and increase font sizes. These two changes alone produce a dramatic improvement.
- **60 minutes available:** Complete all P1 and the most egregious P2 issues -- text reduction on the worst offenders and at least one visual addition per section
- **90 minutes available:** Complete P1 and P2 fully. Begin P3 color consistency.
- **In all cases:** Rewrite every headline to be an insight statement first. This takes 10-15 minutes for a 20-slide deck and has the highest return on time invested of any single change.
- Explicitly acknowledge the time constraint in your recommendations and state which changes to skip

### Presentation Repurposed Across Cultures

Slides designed for one cultural context may have significant design issues when presented in another -- particularly around color meaning, visual metaphors, and density norms.

**Key considerations:**
- White background with spare design reads as confident and professional in North American and Northern European contexts but may read as unfinished or cheap in some South Asian and East Asian contexts where denser, more colorful design signals effort and care
- In contexts where more visual richness is expected, increase to 4-5 colors (but maintain semantic consistency), add more illustrative elements, and allow slightly higher text density
- Color meaning varies significantly: red signals warning in Western contexts but signals good fortune in Chinese contexts; white signals cleanliness in Western contexts but mourning in East Asian contexts
- Flag these considerations when a user indicates cross-cultural deployment without giving prescriptive rules -- this requires cultural knowledge the user possesses

---

## Example

**Input:** "I'm presenting to a 40-person sales team next week in a conference room. I have a 12-slide deck. Here's what's on Slide 7: Title is 'Customer Acquisition: Q3 Performance, Key Challenges, and Q4 Initiatives.' Then I have 8 bullet points: bullet 1 is 'New customer acquisitions in Q3 reached 847, up from 701 in Q2 but below our Q3 target of 950 by a gap of 103 customers' -- bullet 2 is 'Primary acquisition channels: digital (44%), outbound sales (31%), referral (18%), events (7%)' -- bullet 3 is 'Customer acquisition cost increased from $312 to $387, a 24% rise driven primarily by increased paid digital spend and reduced conversion rates in the outbound channel' -- bullet 4 is 'The referral program relaunched in August is showing early traction with 18% of Q3 acquisitions vs. 11% in Q2' -- bullet 5 is 'Q4 target is 1,100 new customers' -- bullet 6 is 'Key Q4 initiatives: double down on referral program, optimize paid digital CAC, pilot account-based marketing for enterprise segment' -- bullet 7 is 'Outbound team headcount will increase by 4 reps in October' -- bullet 8 is 'Leadership has approved a $200K incremental budget for Q4 acquisition initiatives.' Title is in 22pt, bullets are in 13pt. No images or charts. Light blue background with white text."

**Output:**

---

## Slide Design Review: Sales Team Deck -- Slide 7 Audit

### Context
- **Presentation type:** Live room presentation
- **Audience size:** 40 people in a conference room (estimated 15-25 feet from screen)
- **Slides reviewed:** Slide 7 (full deck audit available on request)
- **Slide dimensions:** Assumed 16:9 (1920×1080px equivalent)

---

### Diagnostic Assessment

| Design Criterion | Current State | Target | Status |
|-----------------|---------------|--------|--------|
| Words per content slide | ~185 words | < 30 words | ○ Fail |
| Ideas per slide | 4+ distinct ideas | 1 per slide | ○ Fail |
| Min font size (body) | 13pt | 24pt minimum | ○ Fail |
| Min font size (headline) | 22pt | 36pt minimum | ○ Fail |
| White space | ~8% | > 40% | ○ Fail |
| Color | Unknown count | 2-3 accent + B/W | ◑ Warning |
| Visual-verbal balance | 0 visuals | All content slides | ○ Fail |
| Background/contrast | White on light blue | 7:1 for body text | ○ Fail (likely) |

Status: ● Pass   ◑ Warning   ○ Fail

---

### P1: Critical Changes

#### One-Idea-Per-Slide Violation

**Slide 7 contains at least 4 distinct, unrelated ideas:**
1. Q3 acquisition volume vs. target (a performance result)
2. Customer acquisition cost increase and cause (a cost/efficiency finding)
3. Referral program early results (a specific initiative finding)
4. Q4 targets, initiatives, and resources (a forward-looking plan)

These are four different conversations. Combining them on one slide means the audience is reading point 6 while you are still talking about point 1. None of the four ideas receives the attention it deserves.

**Recommended split: Slide 7 → 4 focused slides**

| Original Slide 7 | New Slide | Recommended Headline | Type |
|------------------|-----------|----------------------|------|
| Bullets 1-2 | Slide 7a | "Q3 acquisitions hit 847 -- 11% above Q2 but 11% below target" | Performance |
| Bullet 3 | Slide 7b | "CAC rose 24% -- paid digital efficiency is the Q4 problem to solve" | Diagnosis |
| Bullet 4 | Slide 7c | "Referral program doubled its share: 11% → 18% in one quarter" | Positive signal |
| Bullets 5-8 | Slide 7d | "Q4 plan: 1,100 customers, $200K budget, three levers" | Forward plan |

**Note on slide 7a's headline:** The current title "Customer Acquisition: Q3 Performance, Key Challenges, and Q4 Initiatives" is a file folder label spanning three different conversations. Replace it with a single insight statement per resulting slide. The colon-plus-list format is the clearest signal that a slide needs to be split.

---

#### Font Size Violations

| Slide | Element | Current | Required | Change |
|-------|---------|---------|---------|--------|
| 7 | Headline | 22pt | 36pt min | +14pt |
| 7 | Body text | 13pt | 24pt min | +11pt |

**Consequence at 15-25 feet:** At 20 feet from a 16:9 projected slide, 13pt text subtends approximately 0.3 degrees of visual arc -- below the threshold for comfortable reading. Audience members in rows 3-5 will not be able to read the bullets without leaning forward or squinting. The practical result is they stop trying to read and disengage. Increasing to 24pt body and 36pt headline makes the text comfortably readable from 25 feet.

**Critical implication:** At 24pt body text, Slide 7's 185 words cannot physically fit on a single slide in readable form. This makes the text reduction and slide splitting mandatory, not optional -- they are the only path to meeting font size requirements.

#### Contrast Violation

**Current state:** White text on a light blue background is a contrast failure. Light blue backgrounds (#ADD8E6 or similar) with white text typically produce a contrast ratio of 1.5:1 to 2.5:1 -- catastrophically below the 4.5:1 minimum for large text and the 7:1 recommended for body text in presentation environments.

**Required fix:** Change background to off-white or white (#F8F8F8) with near-black text (#1A1A1A), OR change background to a dark blue (#003366 or deeper) with white text (#FFFFFF or #F0F0F0). Do not keep the light blue background with white text under any circumstances.

**Recommended:** White background with dark text -- projectors render light backgrounds more consistently across different room lighting conditions. Reserve dark backgrounds for keynote contexts with controlled lighting.

---

### P2: High-Impact Changes

#### Text Reduction -- Slide 7 Split

After splitting into four slides, each slide targets 20-30 words maximum. Here is the full reconstruction:

---

**Slide 7a: "Q3 acquisitions hit 847 -- 11% above Q2 but 11% below target"**

- **Word count target:** 15 words on slide (the headline itself is 14 words -- the visual carries the rest)
- **Recommended visual:** Horizontal bullet chart or simple bar chart showing three values side-by-side: Q2 actual (701), Q3 actual (847), Q3 target (950). Color-code: gray for Q2, brand blue for Q3 actual, dashed outline bar for target. No legend needed -- label each bar directly at 18pt.
- **Channel split:** Display as a simple donut chart or 4-segment horizontal bar: Digital 44% / Outbound 31% / Referral 18% / Events 7%. Place this as a secondary visual below the main bar chart or on a separate Slide 7a-ii.
- **Remove entirely from slide:** All explanatory text. The bar chart communicates Q2 vs. Q3 vs. target at a glance. Speaker provides context verbally.
- **Speaker notes content:** "We hit 847 new customers in Q3. That's our best quarter ever -- up from 701 in Q2 -- but we missed the 950 target by 103. Digital is our biggest channel at 44%, followed by outbound at 31%."

---

**Slide 7b: "CAC rose 24% -- paid digital efficiency is the Q4 problem to solve"**

- **Word count target:** 12 words (headline) + 2 supporting data points = ~20 words total
- **On-slide content:**
  - Headline: "CAC rose 24% -- paid digital efficiency is the Q4 problem to solve" (11 words)
  - Two large typographic numbers side-by-side: "$312" (Q2, in gray) → "$387" (Q3, in red-amber highlight color) with a right-pointing arrow between them labeled "24% increase"
  - Single callout label: "Cause: lower outbound conversion + increased paid digital spend" (8 words, 18pt, below the numbers)
- **Remove entirely:** All other explanatory text -- the mechanism (why CAC rose) is stated in the callout; the "so what" is in the headline
- **Speaker notes content:** "CAC jumped from $312 to $387 -- a 24% increase. The culprit is two things: paid digital CPL went up as we increased spend, and our outbound conversion rate dropped. This is the efficiency problem we are solving in Q4."

---

**Slide 7c: "Referral doubled its share: 11% → 18% in one quarter"**

- **Word count target:** 10 words (headline) + minimal annotation
- **On-slide content:**
  - Headline: "Referral doubled its share: 11% → 18% in one quarter" (9 words)
  - Visual: Two large circles side-by-side or a simple before/after comparison. Left: "Q2" label, "11%" in gray at 72pt. Right: "Q3" label, "18%" in brand accent color at 72pt. Arrow pointing right labeled "August relaunch" in 16pt annotation text.
- **Why this deserves its own slide:** This is the deck's positive signal -- a strategic bet paying off early. Burying it as bullet 4 of 8 on a crowded slide means it receives no emphasis. As a standalone slide with a dramatic before/after visual, the audience absorbs and remembers it.
- **Speaker notes content:** "The referral program relaunch in August is working. We went from 11% of acquisitions through referral in Q2 to 18% in Q3 -- and referral CAC is significantly lower than digital or outbound. This is our highest-leverage Q4 lever."

---

**Slide 7d: "Q4 plan: 1,100 target, $200K budget, three acquisition levers"**

- **Word count target:** 8 words (headline) + 3 bullet items at 6 words each = 26 words total
- **On-slide content:**
  - Headline: "Q4 plan: 1,100 target, $200K budget, three levers" (8 words)
  - Three items displayed as icon + label pairs (not traditional bullets):
    - [Referral icon] "Scale referral program -- proven CAC advantage" (6 words)
    - [Digital icon] "Optimize paid digital -- lower CPL by 15%" (7 words)
    - [Enterprise icon] "Pilot ABM for enterprise segment" (5 words)
  - Single supporting line at 18pt: "Outbound: +4 reps October | Budget: +$200K approved" (8 words)
- **Remove entirely:** All explanatory text about what each initiative entails. That belongs in speaker notes or a separate detail slide if needed for Q&A.
- **Speaker notes content:** "Q4 target is 1,100 customers -- a 30% jump from Q3. We have three levers: scale referral which is already working, fix paid
