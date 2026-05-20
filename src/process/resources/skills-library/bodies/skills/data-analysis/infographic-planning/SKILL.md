---
name: infographic-planning
description: |
  Plans an infographic by defining the key message, selecting the information hierarchy, specifying the visual metaphor or layout type (comparison, process, timeline, statistical), and producing the content outline with placeholder sizes and section flow.
  Use when the user needs to plan the structure and content of an infographic before creating it in a design tool.
  Do NOT use for chart type selection (use chart-type-selector), dashboard layout (use dashboard-design), or detailed report formatting (use report-formatting).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-visualization design planning"
  category: "data-analysis"
  subcategory: "data-visualization"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Infographic Planning

## When to Use

**Use this skill when:**
- The user has a defined dataset, research findings, or process documentation and needs a structured plan before opening any design tool -- they are asking "what goes where" not "what chart do I use"
- The user wants to communicate a single, coherent argument or finding to a non-specialist audience through a static, single-canvas visual document
- The user is briefing a designer, preparing a content spec for a freelancer, or starting work in a tool such as Canva, Adobe Illustrator, Figma, Piktochart, or Visme and needs a section-by-section blueprint before touching visuals
- The user needs to distill a report, whitepaper, research study, or survey dataset into a shareable, self-contained one-page visual summary
- The user is planning a content series where each infographic covers one theme in a larger topic (sustainability, annual results, policy brief, product features)
- The user has 3-12 discrete data points, 4-8 process steps, or 2-4 items to compare and wants maximum visual impact per square inch of canvas
- The user is creating awareness content for social media (LinkedIn, Instagram, Pinterest) and needs a vertical or square format that communicates without a caption
- The distribution target is a static channel -- printed handout, PDF download, email attachment, webpage embed, or slide backdrop -- not an interactive or scrollable dashboard

**Do NOT use when:**
- The user needs help deciding which chart type (bar, line, scatter, pie) is most appropriate for a specific dataset -- use `chart-type-selector` instead
- The user is building a multi-panel, interactive, or filterable data display -- use `dashboard-design` instead
- The user needs a multi-page structured document with narrative sections, executive summary, and appendices -- use `report-formatting` instead
- The user wants to write a data-driven story with prose interpretation, transitions, and narrative arc -- use `data-storytelling` instead
- The user is building a slide deck where each slide covers one point -- infographic planning produces a single-canvas artifact, not a multi-slide sequence
- The user has more than 15 distinct data points with multiple dimensions each -- the result will be a cluttered information dump, not an infographic; redirect to `report-formatting` and offer to plan a spotlight infographic for the top 3-5 findings
- The content is primarily text-based (e.g., a list of policy recommendations, a glossary, or a terms-and-conditions summary) with no quantitative or process-visual anchor -- text-heavy content belongs in a document, not an infographic

## Process

### Step 1: Establish Purpose, Audience, and Distribution Constraints

Before touching content, nail down the three constraints that determine every design decision:

- **Single-sentence core message test:** Ask the user -- "If someone looks at this for 10 seconds and remembers one thing, what should that thing be?" If the user cannot answer in one sentence, the scope is too broad. Narrow it before proceeding.
- **Audience literacy calibration:** Distinguish between general public (requires icons, plain language, minimal jargon, large text), industry professionals (can handle domain terminology and denser data), and internal teams (can reference internal context but still benefit from clear hierarchy). The audience determines vocabulary, data density, and assumed baseline knowledge.
- **Distribution format constraints:** These are non-negotiable technical requirements that must be established upfront:
  - Social media feed (LinkedIn, Instagram): vertical, 1080x1350px (4:5) or 1080x1920px (9:16 story), file under 8MB, design for mobile-first rendering at 375px viewport width
  - Pinterest / blog embed: vertical, 1000-1500px wide, no height limit but 2:3 to 1:3 ratio performs best for algorithm distribution
  - Print handout (A4/Letter): 210x297mm at 300 DPI minimum, CMYK color mode, 3mm bleed, no hairlines under 0.25pt
  - Website embed (responsive): design at 800px wide, ensure all text is legible at 60% zoom
  - Email attachment / PDF: optimize for screen at 96 DPI, keep file size under 2MB for email deliverability
  - Presentation backdrop: 1920x1080px (16:9), ensure key content stays within the inner 80% safe zone
- **Desired viewer action:** Distinguish between Inform (viewer learns a fact and moves on), Persuade (viewer is moved toward a decision), Convert (viewer takes a specific action -- scans QR code, visits URL, downloads something), and Share (viewer forwards or reposts the infographic). Each action type affects CTA placement, message framing, and visual urgency.

---

### Step 2: Audit and Curate the Content Inventory

Infographics fail most often because too much content is forced onto a single canvas. Conduct a content audit before assigning any layout:

- **List every candidate data point or content item the user has provided.** Assign each item to one of four tiers:
  - **Tier 1 -- Anchor:** The single most striking number, comparison, or finding. This becomes the hook. A good anchor has emotional weight (92% is better than "most"), is unexpected, and is verifiable.
  - **Tier 2 -- Supporting evidence:** 3-5 data points or facts that reinforce or explain the anchor. Each should stand alone with a single visual element.
  - **Tier 3 -- Contextual:** Numbers that explain what the Tier 1 and 2 data mean -- year-over-year comparisons, industry benchmarks, definitions. These become supporting text, not headline visuals.
  - **Tier 4 -- Excluded:** Any item that cannot be expressed visually, requires more than 2 sentences of explanation, or contradicts the core message. Remove ruthlessly.
- **Apply the 300-word ceiling test:** Count all text the user has provided. If it exceeds 300 words after curation, the infographic must either become a series or the excess must be moved to an accompanying document. Flag this to the user explicitly.
- **Identify the data type of each Tier 1 and 2 item** to determine visual treatment:
  - Single large percentage or ratio → large number treatment or donut chart
  - Two quantities being compared → side-by-side bars, split layout, or versus callout
  - Part-of-whole with 3-5 categories → donut or stacked bar (never pie charts with more than 5 slices)
  - Change over time (fewer than 8 time points) → timeline markers or slope chart
  - Sequential steps → numbered flow with connector arrows
  - Geographic variation → choropleth or proportional symbol map callout

---

### Step 3: Select the Infographic Archetype

Match the dominant content type to the correct structural archetype. Mismatching content type to archetype is the most common structural error:

| Archetype | Dominant content type | Structural logic | Visual signature | Common misuse |
|---|---|---|---|---|
| **Statistical** | Disconnected facts, survey results, research highlights | Items are independent -- no causal or sequential relationship | Large numbers, icon arrays, donut charts, bold percentages | Forcing unrelated facts into a fake narrative sequence |
| **Process / How-to** | Ordered steps, workflow, protocol, recipe, method | Items are causally or sequentially linked -- Step A must precede Step B | Numbered nodes, horizontal or vertical flow, connector arrows | Using for lists that are not truly sequential |
| **Comparison** | Two or three options, products, strategies, scenarios | Items share the same attributes and are evaluated in parallel | Split-column layout, mirrored bars, feature check matrices | Using for more than 4 items (becomes a table) |
| **Timeline** | Historical events, project milestones, biographical sequence | Items are ordered by date and the date order carries meaning | Horizontal or diagonal chronological spine with milestone markers | Using when dates are not meaningful to the story |
| **Geographic** | Regional variation, coverage, demographic distribution | Spatial relationships are meaningful -- where something is located matters | Map base layer with proportional symbols or choropleth shading | Using when geography is incidental, not the story |
| **Hierarchical** | Org structure, priority ranking, category taxonomy | Items have parent-child relationships or ordered importance levels | Tree diagram, pyramid, concentric rings, nested boxes | Using when items are actually parallel, not hierarchical |
| **Narrative / Explainer** | A cause-and-effect story, a problem-solution arc, a "how it works" | Items form a beginning-middle-end argument | Scene-based layout, character or object metaphor as visual anchor | Using for data that has no narrative arc |

**Hybrid note:** Up to 30% of infographics benefit from a primary archetype with one secondary element. For example, a Statistical infographic may include a short Timeline in one section to show trend. Plan the primary archetype first, then add the secondary element as a single section.

---

### Step 4: Build the Section-by-Section Content Hierarchy

Every infographic follows the same reading psychology regardless of archetype: **Hook → Context → Evidence → Resolution → Action**. Map content to this psychological flow, not simply to the data's native order:

- **Header zone (8-12% of canvas height):** Title (5-8 words, action-oriented or question-based), subtitle (one phrase of context -- year, scope, data source), and brand mark. Text here should not exceed 15 words total.
- **Hook zone (12-18% of canvas height):** The single Tier 1 anchor stat or concept. Visual treatment: number at minimum 72pt equivalent size, single supporting sentence of no more than 12 words, one icon or simple graphic. Viewers decide in 3-5 seconds whether to continue -- this section must earn that decision.
- **Body zones (55-65% of canvas height):** Three to five sections, each corresponding to a Tier 2 data item. Assign each section:
  - A 3-6 word heading (left-aligned, consistent size hierarchy)
  - One visual element (the type depends on the data -- see Step 2 data type mapping)
  - One key number or label
  - One to two sentences of supporting text, maximum 25 words total per section
  - An approximate height percentage (all body sections should total 55-65%)
- **Call-to-action zone (8-12% of canvas height):** One action statement, one destination (URL, QR code, resource name). Never put two competing CTAs on one infographic.
- **Footer zone (3-6% of canvas height):** Data sources in 8-10pt equivalent text, copyright or organization name. This zone is functional, not designed -- it should not compete visually with any body section.

**Proportional sizing rule:** The most important data point must occupy the most visual space. If the hook occupies 15% of canvas height, no body section should exceed 15% or the hook loses its dominance.

---

### Step 5: Specify the Visual Framework

Visual inconsistency is the second most common reason infographics fail. Define these specifications before any design work begins:

**Dimensions and orientation:**
- Vertical (most common): 800-1080px wide, height determined by content (typically 1800-2400px for social/web)
- Square (social media): 1080x1080px -- forces aggressive content curation, often best for single-stat or two-section infographics
- Horizontal (presentations, wide-format print): 1920x1080px or A3 landscape

**Color palette (maximum 4 colors):**
- **Primary:** Used for the most important numbers and section headings. Typically the brand's dominant color. Must pass WCAG AA contrast ratio (4.5:1) against the background.
- **Secondary:** Used for supporting visuals, chart fills, and icon fills. Harmonically related to primary (analogous, complementary, or triadic, not random).
- **Accent:** Used sparingly for CTAs, highlights, and emphasized callouts. Should appear in no more than 15-20% of the visual area -- overuse destroys its attention-directing function.
- **Background:** Near-white (#F5F5F5 or #FFFFFF) for most contexts. Dark backgrounds (#1A1A2E, #0D1117) work for technology and finance sectors but require all text and icons in light values, which limits color range.
- Never use more than one shade of each primary and secondary color in the same infographic -- tints and shades create ambiguity about whether two elements are related.

**Typography (maximum 2 families):**
- **Heading family:** A geometric or humanist sans-serif performs best at large sizes and with numbers (Montserrat, Poppins, Inter, Nunito Sans). Avoid decorative or script fonts -- they reduce legibility of key statistics.
- **Body family:** Either the same family at a lighter weight, or a complementary high-legibility face (Open Sans, Source Sans Pro, Lato). Never two serif families together.
- **Minimum type sizes:** Key statistics at 48-96pt equivalent (these are the visual anchors), section headings at 18-24pt, body text at 10-12pt minimum for web, 8pt minimum for print at 300 DPI.

**Icon system:**
- All icons must come from a single family (same stroke weight, same corner radius, same level of detail). Mixing icon families is immediately visible as inconsistency.
- Choose one of three styles and apply uniformly: Outlined (clean, minimal, works on any background), Filled (bolder, better for small sizes), Duotone (sophisticated, requires careful color control).
- Minimum icon size: 32x32px at 1x for web. Below this, filled icons only.

**Grid and alignment:**
- Define a base grid before placing any elements: 4-column or 6-column for 800px wide, 12-column for 1080px wide
- Margins: minimum 40px on all sides for web, minimum 10mm for print
- Internal gutters: 24-32px between sections
- All elements within a section must be left-aligned, center-aligned, or right-aligned -- do not mix alignment axes within one section

---

### Step 6: Write All Copy Within Budget

Infographic copy writing requires extreme compression. Apply these techniques:

- **Lead with the number, follow with the noun:** "35% reduction in emissions" not "We have reduced our emissions by 35%". Active construction wastes words.
- **Cut all qualifiers:** "Approximately 35%" becomes "~35%". "Our company reduced" becomes the company name or implied subject.
- **Section headings should be claims, not labels:** "Powered by Clean Energy" (claim) not "Renewable Energy" (label). Claims engage; labels categorize.
- **Supporting sentences answer "so what?":** The viewer already sees the number. The text must explain the implication, comparison, or action -- not restate the statistic.
- **Run a word budget after writing all copy:** Count total words. Infographics with under 150 words consistently outperform those over 250 words in social media share metrics. Flag any section exceeding 30 words for compression.

---

### Step 7: Validate the Plan Against Quality Criteria

Before delivering the plan, run it through this checklist:

- [ ] Core message can be stated in one sentence
- [ ] Hook is the single most compelling item in the dataset
- [ ] No more than 5 body sections
- [ ] Every section has exactly one visual treatment specified
- [ ] Total word count is under 300 (ideally under 200)
- [ ] Color palette has 4 or fewer colors with primary contrast verified
- [ ] Font families are limited to 2
- [ ] All icons are specified as a single consistent family
- [ ] Reading direction is unambiguous (top-to-bottom for vertical, left-to-right for horizontal)
- [ ] Data sources are assigned to footer
- [ ] Dimensions match the distribution channel
- [ ] CTA is singular -- one action, one destination

---

### Step 8: Produce the Infographic Plan Document

Compile all decisions from Steps 1-7 into the structured output format below. Include a brief design rationale note for any non-obvious decision (e.g., why the donut chart was chosen over a bar chart, why the hook stat was chosen over others, why a vertical rather than square format was selected). This rationale helps designers and non-designers who receive the brief understand the intent.

---

## Output Format

```
## Infographic Plan: [Working Title]

---

### 1. Strategic Overview

| Element | Specification |
|---------|--------------|
| Working title | [5-8 word title] |
| Infographic archetype | [Statistical / Process / Comparison / Timeline / Geographic / Hierarchical / Narrative] |
| Core message (one sentence) | [The single takeaway the viewer must retain] |
| Primary audience | [Description including literacy level and assumed knowledge] |
| Secondary audience (if any) | [Additional audience segment, or "none"] |
| Desired viewer action | [Inform / Persuade / Convert / Share -- with specific description] |
| Distribution channels | [List each channel with format requirement] |
| Canvas dimensions | [Width x Height in px, or print dimensions with DPI] |
| Orientation | [Vertical / Horizontal / Square] |
| Color mode | [RGB (screen) / CMYK (print)] |

---

### 2. Content Inventory and Tier Assignment

| Item | Tier | Visual treatment |
|------|------|-----------------|
| [Data point or content item] | [1 / 2 / 3 / 4] | [Large number / donut chart / icon array / bar / etc. / Excluded] |
| [Data point or content item] | [1 / 2 / 3 / 4] | [Treatment or Excluded] |
| [Data point or content item] | [1 / 2 / 3 / 4] | [Treatment or Excluded] |

*Items marked Tier 4 (Excluded) should be cited in a companion document or moved to the footer source line.*

---

### 3. Section-by-Section Content Plan

#### Section A: Header ([8-12]% of canvas height)
- **Title:** [5-8 words, active or question-based]
- **Subtitle:** [One phrase: context, date range, or scope]
- **Visual element:** [Logo placement, decorative motif, or color band]
- **Word count:** [N] words

#### Section B: Hook ([12-18]% of canvas height)
- **Anchor stat/concept:** [The Tier 1 item -- stated exactly as it will appear on the infographic]
- **"So what" sentence:** [12 words maximum explaining implication or context]
- **Visual treatment:** [Specific treatment: e.g., "72pt bold number in primary color with downward arrow icon at 64px"]
- **Rationale:** [Why this item was selected as the hook over other candidates]
- **Word count:** [N] words

#### Section C: [Section heading -- 3-6 words] ([N]% of canvas height)
- **Heading:** [3-6 word claim-based heading]
- **Key data point:** [Exact number, percentage, or comparison as it will appear]
- **Supporting text:** [1-2 sentences, maximum 25 words total]
- **Visual treatment:** [Specific chart type, icon treatment, or graphic with size in px]
- **Color application:** [Which palette color applies to which element in this section]
- **Word count:** [N] words

#### Section D: [Section heading] ([N]% of canvas height)
*(same structure as Section C)*

#### Section E: [Section heading] ([N]% of canvas height)
*(same structure as Section C)*

#### Section F: Call to Action ([8-12]% of canvas height)
- **Action statement:** [Verb-led instruction, maximum 6 words]
- **Destination:** [URL, QR code placeholder, or resource name]
- **Visual treatment:** [Button style, arrow, or icon treatment]
- **Word count:** [N] words

#### Section G: Footer ([3-6]% of canvas height)
- **Source citations:** [Exact source names and dates for every statistic used]
- **Organization/branding:** [Name, logo placement]
- **Legal/copyright:** [If required]
- **Word count:** [N] words

---

### 4. Visual Framework Specification

| Element | Specification | Usage rule |
|---------|--------------|-----------|
| Primary color | #[hex] -- [name] | Headings, key statistics, dominant chart fills |
| Secondary color | #[hex] -- [name] | Supporting visuals, secondary chart fills, icon fills |
| Accent color | #[hex] -- [name] | CTAs, highlights -- max 15-20% of visual area |
| Background color | #[hex] -- [name] | Canvas background |
| Contrast ratio (primary on background) | [N]:1 (WCAG AA minimum 4.5:1) | Verify before finalizing |
| Heading font | [Family], [weight], [size range] | All headings and labels |
| Body font | [Family], [weight], [size] | All supporting text |
| Stat/number font | [Family, weight, size] -- often heading family at maximum size | Anchor statistics only |
| Icon system | [Family name or style], [Outlined/Filled/Duotone], [base size in px] | All icons -- no mixing families |
| Grid | [N]-column grid, [N]px margins, [N]px gutters | All element placement |
| Alignment standard | [Left / Center / Right] aligned within sections | Apply uniformly within each section |

---

### 5. Content Word Count Summary

| Section | Word count |
|---------|-----------|
| Header | [N] |
| Hook | [N] |
| [Section C heading] | [N] |
| [Section D heading] | [N] |
| [Section E heading] | [N] |
| Call to Action | [N] |
| Footer | [N] |
| **Total** | **[N]** |
| Target ceiling | 300 words (ideally under 200) |
| Status | [Under budget / At risk -- compress Section X / Over budget -- recommend series] |

---

### 6. Design Brief Notes

*(Optional but recommended for handoffs to designers)*
- [Note on archetype rationale]
- [Note on hook selection rationale]
- [Any unusual layout decisions and why they were made]
- [Any content excluded and where it should go instead]
```

---

## Rules

1. **The 300-word hard ceiling is non-negotiable.** If the user's content exceeds 300 words after compression, do not plan a denser infographic -- recommend a series or a companion document. Infographics with over 300 words consistently test as "too much to read" with general audiences and perform 40-60% worse on social share rates than those under 200 words.

2. **The hook must be the single most emotionally or intellectually striking item in the dataset -- not the most contextually important one.** Context belongs in body sections. The hook's job is to stop scrolling, not to explain. A 92% diversion rate is a better hook than "comprehensive sustainability program" even if the program is strategically more significant.

3. **Never plan more than 5 body sections.** Human short-term memory holds 5-9 items, but infographic viewers are not in a reading context -- they are scanning. Three to four sections is optimal for recall. Five sections is the ceiling. If the user insists on more, split into a series and note which infographic covers which section.

4. **Every section must have a visual treatment specified before delivery.** A section plan that says "supporting text only" or "we'll figure out the visual later" is incomplete and will result in a text-heavy section that breaks the visual rhythm. If no obvious visual exists for a section, either find one (icon, color block, number treatment) or merge that section's content into an adjacent section's supporting text.

5. **Color palettes of more than 4 colors create visual noise that reduces comprehension.** The 4-color rule (primary, secondary, accent, background) is based on pre-attentive processing research -- viewers use color as a categorization signal, and more than 3 content colors prevent consistent categorization. If the user insists on more colors, explain that the additional colors will be interpreted as new categories even if that is not intended.

6. **Verify contrast ratios before specifying colors.** WCAG AA requires 4.5:1 for normal text, 3:1 for large text (above 18pt or 14pt bold). Most infographic statistics at 48pt+ qualify as large text. Do not specify a color combination without noting whether it passes -- a designer who follows the spec and fails accessibility review wastes a revision cycle.

7. **Font families must be limited to two, and size hierarchy must have exactly three levels: stat/anchor, heading, and body.** More than two families reads as inconsistency. More than three size levels reads as arbitrary. If the user wants to add a fourth size level (for sub-labels, legends, footer), it must come from the body family at a reduced size, not a new family.

8. **The reading direction must be unambiguous and must match the archetype.** Vertical infographics flow top-to-bottom. Horizontal infographics flow left-to-right. Process and Timeline archetypes may use a zigzag or snake pattern, but the direction of travel must be indicated with arrows at every turn. Statistical archetypes should never use a non-linear layout -- viewers will assume adjacent sections are causally related when they share visual proximity.

9. **All data source citations belong in the footer and must be specific.** "Various sources" is not acceptable. "Company internal data, 2025 annual sustainability audit" is acceptable. "Survey, n=1,247, conducted March 2025" is acceptable. Unsourced statistics reduce credibility and expose the producing organization to misinformation claims. If the user cannot provide sources, note this explicitly in the plan and flag it as a required action before publication.

10. **Do not plan interactive, animated, or dynamic elements.** Infographic planning produces a static document specification. If the user wants hover states, animated counters, scroll-triggered reveals, or click-to-expand sections, redirect to `dashboard-design` or an interactive content skill. Including interactive elements in a static infographic plan creates designer confusion and rework.

---

## Edge Cases

### User Has Only 1-2 Data Points

A single compelling statistic is a valid infographic, but the planning approach must shift. Build the entire canvas around that one number using the "hero stat" layout: large number as centerpiece (occupying 40-50% of canvas height), context above (what this measures and why it matters), and implication or action below (what this number means for the viewer). Reduce the canvas height to 800-1200px -- a two-section infographic stretched to 2000px will look empty. These perform exceptionally well as square social media posts (1080x1080px) and as email header graphics.

### User Has 15+ Data Points Across Multiple Dimensions

This is a misuse of the infographic format. Acknowledge the richness of the dataset, then recommend one of two paths: (a) identify the single most compelling story thread -- usually the item with the largest absolute change, the most surprising comparison, or the item most relevant to the audience's decision -- and build the infographic around that thread only, relegating everything else to a linked data report; or (b) plan a 3-4 infographic series where each infographic covers one theme. For a series, define a consistent visual framework (same palette, fonts, icon system, header style) so the pieces are recognizable as a family, and number them clearly (Part 1 of 3, etc.).

### User Wants a 3- or 4-Way Comparison

The standard split-column comparison layout works for 2 items. For 3 items, use a three-column layout with attributes listed as rows -- this is essentially a visual comparison table. For 4 items, the column width at 800px becomes 175px per column after gutters, which is sufficient for short labels and icons but not for text. At 4 items, always recommend reducing to the 2-3 most important comparators, or converting to a formal comparison table with infographic-style header statistics above it. Beyond 4 items, the format is definitionally a table, not an infographic, and should be planned as a designed table, not a split-layout infographic.

### User Needs Non-English or Bidirectional Language Support

Reading direction is not universal. For Arabic, Farsi, and Hebrew, the primary reading direction is right-to-left, which means the visual flow, the progression of steps in a Process archetype, and the placement of the "start" element in a timeline must be mirrored. Icon systems may also carry different cultural meanings -- a thumbs-up icon is offensive in some Middle Eastern contexts; a red circle may mean "stop" in Western contexts but carries different weight in East Asian contexts. When planning for international audiences, specify that the designer must review all icons and color associations against the target culture, and note any specific symbols that need localization review. Vertical top-to-bottom layouts are generally safer for multilingual infographics because they require less mirroring.

### User Wants to Show a Process With More Than 8 Steps

More than 8 individual steps cannot be displayed legibly in a single-column vertical flow at standard infographic dimensions -- each step node becomes too small to read comfortably. Apply one of two solutions: (a) group steps into 4-6 phases, display phases as primary nodes with step counts as sub-labels (e.g., "Phase 2: Configure -- 3 steps"), and note in the plan that a companion guide or appendix lists the individual steps; or (b) plan a multi-card series (each card is one phase) using a consistent visual template so the cards form a coherent set when displayed together. Never use font sizes below 10pt to squeeze in extra steps -- illegible text is worse than omitted text.

### User Has Data That Contradicts the Core Message

Occasionally during content audit, Tier 3 or Tier 4 data will directly contradict the headline claim (e.g., an overall 35% emissions reduction but one facility increased emissions by 12%). This must be addressed in the plan, not hidden. Flag the contradiction explicitly to the user and offer three options: (a) reframe the core message to be accurately scoped ("Emissions reduced at 4 of 5 facilities"); (b) acknowledge the exception in supporting text with a brief note; or (c) exclude it from the infographic but include it in a companion fact sheet or footnote for transparency. An infographic that misleads through omission of contradictory data is a credibility risk. Never plan a visual that requires omitting materially relevant contrary data without the user's informed acknowledgment.

### Infographic Will Be Reproduced Across Multiple Formats

When the distribution channels require both screen and print output from the same design, the plan must specify: (a) colors in both RGB hex and CMYK breakdowns, because RGB-to-CMYK conversion shifts especially for vibrant greens and purples; (b) minimum 300 DPI for print, with a note that vector elements (icons, charts, text) should be created as vectors, not rasterized; (c) bleed margins of 3mm on all sides for any print piece, with a corresponding safe-zone margin of 5mm inside the trim so no critical content is at risk if the trim shifts; (d) two separate export specifications -- one for screen at 72-96 DPI, one for print at 300 DPI. If the design tool being used (e.g., Canva) cannot produce 300 DPI CMYK exports, note this as a constraint and recommend the print version be created in Illustrator or InDesign.

---

## Example

**Input:** "I need to create an infographic for our company's annual HR report. We surveyed 4,200 employees and found: 78% say they feel engaged at work (up from 61% in 2022), average tenure has increased from 2.1 years to 3.8 years, manager effectiveness scores rose from 64/100 to 81/100, 91% of new hires complete their first 90 days (vs. 73% before our onboarding redesign), and our voluntary turnover rate dropped from 23% to 11%. We want to share this on LinkedIn and print it as a handout for the all-hands meeting."

---

**Output:**

## Infographic Plan: 2025 Employee Experience Report

---

### 1. Strategic Overview

| Element | Specification |
|---------|--------------|
| Working title | "Our People Are Thriving: 2025 Employee Experience Results" |
| Infographic archetype | Statistical (primary) with minor Before/After Comparison treatment per section |
| Core message (one sentence) | Every key measure of employee health -- engagement, tenure, management quality, and retention -- improved significantly between 2022 and 2025 |
| Primary audience | All employees; assumes no prior HR literacy, plain language required, motivational framing |
| Secondary audience | LinkedIn connections: HR professionals, potential recruits, industry peers |
| Desired viewer action | Inform (employees feel proud and recognized) and Share (HR professionals recognize benchmarks and reshare on LinkedIn) |
| Distribution channels | LinkedIn feed post (1080x1350px, RGB, under 8MB); A4 print handout (210x297mm, 300 DPI, CMYK, 3mm bleed) |
| Canvas dimensions | Screen version: 1080x2160px (will compress to 1080x1350px for LinkedIn -- design all critical content in top 1350px); Print version: A4 at 300 DPI |
| Orientation | Vertical |
| Color mode | RGB for screen master; CMYK export required for print (specify CMYK equivalents in Section 4) |

---

### 2. Content Inventory and Tier Assignment

| Item | Tier | Visual treatment |
|------|------|-----------------|
| Voluntary turnover dropped from 23% to 11% (12-point reduction) | 1 -- Anchor | Large "-12 points" with down-arrow, before/after comparison bar |
| Engagement rose from 61% to 78% (+17 points, 4,200 respondents) | 2 -- Supporting | Before/after comparison with large 78% number and upward arrow |
| 90-day retention improved from 73% to 91% (+18 points) | 2 -- Supporting | Horizontal progress bar or large percentage with "before" ghost bar |
| Manager effectiveness: 64 → 81 out of 100 (+17 points) | 2 -- Supporting | Score gauge or before/after callout |
| Avg. tenure: 2.1 → 3.8 years (+1.7 years) | 2 -- Supporting | Simple icon array (person icons) or large number with timeline |
| Survey sample size: 4,200 employees | 3 -- Contextual | Small "n=4,200" label under engagement stat |
| Year range: 2022 vs. 2025 | 3 -- Contextual | Applied as label to all before/after comparisons |

*No Tier 4 exclusions -- all items are relevant and supportable. Note: 2022 baseline year should be confirmed with the data owner before publication.*

**Hook rationale:** Voluntary turnover (-12 points, 23% → 11%) was selected as the hook over engagement because it is the most financially tangible metric for a LinkedIn HR audience (turnover cost is a known pain point), it has the largest absolute improvement in business terms, and it is universally understood without jargon. Engagement at 78% is the second most compelling and will appear as the first body section immediately after the hook.

---

### 3. Section-by-Section Content Plan

#### Section A: Header (9% of canvas height -- ~195px at 2160px)
- **Title:** "Our People Are Thriving: 2025 Results"
- **Subtitle:** "2022 vs. 2025 employee experience survey -- n=4,200"
- **Visual element:** Company logo top-right, thin horizontal color band in primary color beneath the title, consistent with all-hands brand materials
- **Word count:** 11 words

#### Section B: Hook (16% of canvas height -- ~346px)
- **Anchor stat:** "Voluntary Turnover Cut Nearly in Half"
- **Key number display:** "23% → 11%" with a bold downward arrow between the two numbers
- **"So what" sentence:** "A 12-point drop -- our lowest turnover rate in company history."
- **Visual treatment:** Left-aligned "23%" in secondary color (muted, "before" state) with a large right-pointing arrow in primary color leading to "11%" in primary bold at 96pt. Below: a single horizontal bar divided at 23% (gray) and 11% (primary color) with labels, 600px wide x 48px tall.
- **Rationale:** Turnover is the most business-visible HR metric and the fastest to communicate the scale of improvement. Finance, leadership, and HR professional audiences recognize its cost implications immediately.
- **Word count:** 14 words

#### Section C: Employee Engagement (18% of canvas height -- ~389px)
- **Heading:** "Engagement at a 3-Year High"
- **Key data point:** "78% engaged" (up from 61% in 2022)
- **Supporting text:** "17-point increase over three years. Based on responses from 4,200 employees surveyed Q4 2025."
- **Visual treatment:** Two side-by-side donut charts (each 160px diameter): left donut showing 61% in gray with "2022" label below, right donut showing 78% in primary color with "2025" label below. A "+17 pts" badge in accent color between the two donuts at 32pt bold.
- **Color application:** 2022 donut fill: #9B9B9B (neutral gray). 2025 donut fill: primary color. Remaining donut arc: background color. Badge: accent color on white.
- **Word count:** 19 words

#### Section D: New Hire Retention (15% of canvas height -- ~324px)
- **Heading:** "91% of New Hires Stay Through Day 90"
- **Key data point:** 91% first-90-day completion rate (vs. 73% before onboarding redesign)
- **Supporting text:** "Following our 2023 onboarding redesign, 18 more employees per 100 reach their first milestone."
- **Visual treatment:** A single horizontal progress bar, 680px wide x 56px tall. Two markers: a ghost/outline bar stopping at 73% labeled "Before redesign" and a filled primary-color bar at 91% labeled "Now". A person-onboarding icon (filled, 48px) at the left. The gap between 73% and 91% highlighted in accent color.
- **Color application:** "Before" bar: #CCCCCC. "Now" bar: primary color. Gap highlight: accent color. Labels: secondary color at 10pt.
- **Word count:** 22 words

#### Section E: Manager Effectiveness (13% of canvas height -- ~281px)
- **Heading:** "Managers Rated 81 Out of 100"
- **Key data point:** Manager effectiveness score: 81/100 (up from 64/100 in 2022)
- **Supporting text:** "26% improvement in manager effectiveness scores, reflecting two years of leadership development investment."
- **Visual treatment:** Two large number callouts side by side: "64" in secondary gray, small "2022" label, then an arrow pointing to "81" in primary color, small "2025" label. Below both numbers: a thin score track (0-100) with markers at 64 and 81. This is simpler than a gauge and reads faster at small sizes.
- **Color application:** 64 value: #9B9B9B. 81 value: primary color. Score track: background with primary fill to 81 mark. Arrow: accent color.
- **Word count:** 18 words

#### Section F: Average Tenure (12% of canvas height -- ~259px)
- **Heading:** "People Are Staying Longer"
- **Key data point:** Average tenure: 3.8 years (up from 2.1 years in 2022)
- **Supporting text:** "Average employee tenure nearly doubled in three years -- a signal of sustained commitment."
- **Visual treatment:** Icon array using person icons: 21 icons representing 2.1 years (gray, smaller row) and 38 icons representing 3.8 years (primary color, larger row). Each icon = 0.1 year of average tenure. Two rows labeled "2022: 2.1 yrs" and "2025: 3.8 yrs". This is a pictograph/isotype treatment and immediately communicates proportional growth without axis labels.
- **Color application:** 2022 row: #9B9B9B person icons. 2025 row: primary color person icons. Labels: secondary color, 10pt.
- **Word count:** 15 words

#### Section G: Call to Action (9% of canvas height -- ~195px)
- **Action statement:** "Read the full 2025 People Report"
- **Destination:** [Company intranet URL or QR code placeholder -- to be inserted by designer]
- **Visual treatment:** Accent-color button-style banner, full width minus margins, with right-pointing arrow icon (24px). Text in white (confirm contrast ratio against accent color). For print version: QR code (64x64px) to the right of the text.
- **Word count:** 8 words (excluding URL)

#### Section H: Footer (5% of canvas height -- ~108px)
- **Source citations:** "2025 Employee Experience Survey, n=4,200, conducted October-November 2025. 2022 baseline from 2022 Annual People Survey, n=3,812. Manager effectiveness scores from 360-degree review data, HR Analytics team."
- **Organization/branding:** Company name and HR department wordmark, left-aligned
- **Legal/copyright:** "© [Company Name] 2025. Internal use and LinkedIn distribution only."
- **Word count:** 34 words (functional -- does not count toward 300-word ceiling)

---

### 4. Visual Framework Specification

| Element | Specification | Usage rule |
|---------|--------------|-----------|
| Primary color | #1E6FBF (medium blue, RGB) / C85 M43 Y0 K25 (CMYK) | Key statistics (2025 values), filled chart elements, primary bar fills, CTA background |
| Secondary color | #2D3748 (dark slate, RGB) / C62 M50 Y26 K68 (CMYK) | All headings, body text, icon outlines |
| Accent color | #F6AD55 (amber, RGB) / C0 M35 Y67 K4 (CMYK) | Improvement callouts ("+17 pts" badges), gap highlights, CTA arrow, never background |
| Neutral / "before" color | #9B9B9B (mid gray, RGB) / C0 M0 Y0 K39 (CMYK) | All 2022 "before" data representations -- consistent use signals "historical/before" state |
| Background color | #FAFAFA (off-white, RGB) / C0 M0 Y1 K2 (CMYK) | Canvas background -- not pure white to reduce harshness in print |
| Primary on background contrast | #1E6FBF on #FAFAFA = 5.1:1 | Passes WCAG AA for both normal and large text |
| Accent on white contrast | #F6AD55 on #FFFFFF = 2.9:1 | Fails WCAG AA for normal text -- use only with large text (18pt+) or white text on amber (confirm white-on-amber passes) |
| Heading font | Poppins, SemiBold (600), 20-24pt | All section headings -- never used for body text |
| Body font | Inter, Regular (400), 11pt | All supporting text, labels, legend text |
| Stat/number font | Poppins, ExtraBold (800), 48-96pt | Anchor statistics only (turnover hook numbers, large callout values) |
| Icon system | Heroicons, Filled variant, 48px base (32px for footnotes) | All icons -- do not substitute icons from other families |
| Grid | 6-column grid, 40px margins, 24px gutters | For 1080px canvas width: columns are ~127px each |
| Alignment standard | Left-aligned within sections; section-level elements may center-align within column span | Apply uniformly; do not mix left and center within the same section |

---

### 5. Content Word Count Summary

| Section | Word count |
|---------|-----------|
| Header | 11 |
| Hook (Section B) | 14 |
| Engagement (Section C) | 19 |
| New Hire Retention (Section D) | 22 |
| Manager Effectiveness (Section E) | 18 |
| Average Tenure (Section F) | 15 |
| Call to Action (Section G) | 8 |
| Footer | 34 (functional -- excluded from visual word ceiling) |
| **Total visual copy** | **107 words** |
| Target ceiling | 300 words (ideally under 200) |
| Status | **Well under budget -- 107 words. Strong for social sharing.** |

---

### 6. Design Brief Notes

- **Archetype rationale:** Statistical was selected over Comparison because the dominant story is absolute improvement across five measures, not a decision between two options. The before/after treatment within each section provides comparison context without requiring a split-layout structure, which would reduce the number of metrics that can be shown.
- **Hook selection:** Turnover was chosen over engagement as the hook despite engagement having a comparable point improvement (+17 vs. -12) because turnover is the most financially legible metric for the dual audience (employees recognize it as a stability signal; HR professionals recognize it as a cost and culture signal). The hook must work for both audiences simultaneously.
- **Dual format note:** This design must satisfy two very different technical requirements -- LinkedIn (RGB, screen-optimized, 1080x1350px visible crop on mobile) and A4 print (CMYK, 300 DPI, 3mm bleed). The designer should build in Figma or Illustrator at 1080x2160px for screen, then adapt the layout to A4 proportions for print. The top 1350px of the screen version should contain Sections A through D (the most critical content) in case LinkedIn crops the bottom of the post on mobile preview.
- **Before/After color consistency:** The neutral gray (#9B9B9B) is used exclusively to represent 2022 "before" data across all sections. This is an intentional visual system decision -- the viewer learns the color code once (gray = old, blue = new) and applies it across every section without re-reading labels. The designer must not use gray for any other purpose in this infographic.
- **Excluded content:** No items were excluded. All five survey metrics were included as planned. If the company chooses to add further metrics in future years (e.g., eNPS score, DEI index), these should be planned as a second infographic in the same visual series rather than added to this canvas.
