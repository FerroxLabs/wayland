---
name: layout-principles
description: |
  Produces layout analysis and recommendations using grid alignment, visual hierarchy rules, white space ratios, and focal point placement with specific measurements and ratios.
  Use when the user asks to improve a layout, apply layout principles, fix spacing issues, evaluate grid alignment, or optimize visual balance in a design.
  Do NOT use for wireframing from scratch (use wireframe-specification), responsive breakpoint design (use responsive-layout-design), or typography-specific issues (use typography-system).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design template planning"
  category: "design-creative"
  subcategory: "graphic-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Layout Principles

## When to Use

**Use this skill when:**
- The user describes a layout that "feels off," "looks cluttered," "lacks focus," or "seems unbalanced" and needs a structured diagnostic with specific corrective measurements
- The user shares a design description, screenshot, wireframe, or spec and wants grid alignment verified against column counts, gutters, and margins
- The user asks how to distribute visual weight across a page -- improving hierarchy between headlines, subheads, body text, images, and CTAs
- The user wants to optimize white space between specific elements and needs exact pixel values, rem values, or ratio multipliers rather than subjective guidance
- The user wants to identify and strengthen the focal point of a design -- including applying rule of thirds, golden ratio, or eye-tracking pattern analysis
- The user is refining an existing design (not building from scratch) and needs to audit one or more layout principles: grid, hierarchy, spacing, balance, or focal point
- The user needs to explain to a developer or stakeholder exactly what layout changes are required, with measurements precise enough to implement directly
- The user asks about layout concepts in the abstract -- explaining proximity, alignment, repetition, contrast, enclosure, flow -- with practical application instructions

**Do NOT use when:**
- The user wants to wireframe a new page from scratch with no existing layout to evaluate -- use `wireframe-specification` instead, which handles content structure and interaction flow
- The user wants to define responsive breakpoints, fluid grid behavior, or viewport-dependent layout changes -- use `responsive-layout-design` instead, which handles breakpoint logic and content reflow
- The user's primary problem is font choice, type scale, line-height, or kerning -- use `typography-system` instead, though this skill may reference type size as part of hierarchy analysis
- The user wants to build or choose a color system from scratch -- use `color-palette-design` instead, though this skill uses color contrast ratios as part of hierarchy and focal point evaluation
- The user wants interaction design guidance (hover states, transitions, animation timing) -- layout principles apply to static states only
- The user is doing data visualization layout (chart types, axis placement, legend positioning) -- this requires a specialized data viz skill with different compositional rules

---

## Process

### Step 1 -- Gather Layout Context

Before any analysis, collect the minimum required information. If the user has not provided it, ask specifically:

- **Current layout description:** What elements exist and roughly where are they positioned? Accept screenshots, written descriptions, ASCII art, or component lists.
- **Content type and medium:** Marketing landing page, mobile app screen, print brochure, editorial article, dashboard, email template, presentation slide, or physical signage. Each has different baseline grid norms and viewing distance assumptions.
- **Dimensions and constraints:** Canvas size in pixels (digital) or millimeters (print). Fixed or fluid container? Any locked elements that cannot move?
- **Problem symptom:** What specifically feels wrong? Cluttered, unbalanced, no focal point, elements fighting for attention, sections blending together, feels flat, feels chaotic? The symptom identifies which principle to prioritize.
- **Intended user goal:** What should the viewer do or feel first? Buy, read, explore, understand data, be impressed? This sets the intended hierarchy.
- **Existing grid system:** Is the design using a known system (Bootstrap 12-col, Material Design 4-col, CSS Grid with named areas)? Or is it freeform?

If no information is provided at all, open with a set of diagnostic questions rather than making assumptions. Layout analysis without context produces generic advice, not a useful audit.

---

### Step 2 -- Classify the Layout Type and Establish Baseline Grid Expectations

Different layout archetypes have different grid norms. Before auditing, identify which archetype applies:

**Marketing / landing page**
- Standard: 12-column grid, 1200px or 1440px max-width container
- Gutter: 24-32px between columns
- Margins: 80-120px left/right on desktop (or equivalent percentage: 6-8% each side)
- Hierarchy mode: Single dominant CTA on L1, everything else subordinate
- Scan pattern: Z-pattern (minimal text) or modified F-pattern (longer pages)

**Editorial / article / long-form content**
- Standard: 12-column grid, body text confined to 6-8 central columns (approximately 60-75 characters per line -- the optimal measure)
- Gutter: 24px
- Margins: Wide (the 4 outer columns become margin space, 30-35% of total width)
- Hierarchy mode: F-pattern reading. Pull quotes and images interrupt the vertical flow intentionally.
- Baseline grid: 8px base (line-height multiples snap to 8px increments)

**Dashboard / data-dense UI**
- Standard: Modular grid (columns + rows), 8-column or 12-column, 16-24px gutters
- Margins: 16-24px (space is constrained, margins compress)
- Hierarchy mode: Multiple focal points allowed -- one per panel. Use weight and color to differentiate, not size.
- Scan pattern: F-pattern for primary metrics (top row gets highest attention)

**Card / gallery grid**
- Standard: Modular grid, typically 2-4 columns depending on card complexity
- Gutters: Consistent across all cards (16-24px)
- Hierarchy: No single dominant element -- all cards are L2. Hero card (if present) spans 2 columns to create L1.
- White space: Outer gutter ≥ inner gutter (cards breathe more at the edge than between each other)

**Presentation slide**
- Standard: 1920×1080px (16:9) or 1280×720px
- Grid: 12-column or simple 3-column. No margins narrower than 80px.
- Hierarchy: Each slide should have ONE message as L1. Supporting visuals are L2. Everything else is L3 or omitted.
- Reading distance: 2-6 meters typical. Minimum body text 20-24px. Hierarchy gaps must be larger than on screens.

**Print (A4/Letter/tabloid)**
- Canvas: A4 = 210×297mm. US Letter = 215.9×279.4mm.
- Bleed: 3mm on all edges (content that extends to physical edge must bleed past it)
- Safe zone: 5mm inside trim line for critical content
- Grid: Typically 9-column or 12-column with smaller gutters (4.2mm for A4 single-page, 5mm for spreads)
- Points, not pixels: Typography in pt. 1pt = 0.353mm. Body text minimum 9pt. Display minimum 18pt.

---

### Step 3 -- Audit Grid Alignment

Evaluate whether elements sit on the established grid. Work through each check systematically:

**Column alignment checks:**
- Do element left edges snap to column left edges or gutter right edges? No element should be offset by an arbitrary number. Every horizontal position should be explainable by the grid.
- Do element widths span whole column units (1 col, 2 cols, 3 cols) rather than fractional widths?
- Are there elements that need to span the full width for conceptual reasons (nav bars, dividers, hero backgrounds) that are correctly set to bleed or full-container width?
- Are gutters consistent? The space between column 1 and column 2 must equal the space between column 5 and column 6. Any inconsistency breaks the grid's reliability.

**Margin checks:**
- Left margin must equal right margin in symmetric layouts (the default). Asymmetric margins are intentional design choices and must serve a clear purpose.
- Top margin consistency: First element below the header must have the same top margin on every page/screen.
- Nested margin rule: When elements are inside a container (card, modal, panel), the inner padding forms a secondary grid. This inner padding must also be a multiple of the base unit.

**Base unit discipline:**
The most robust grids are based on a single base unit. For digital, 8px is the industry standard base unit. Every spacing value should be a multiple of 8: 8, 16, 24, 32, 40, 48, 56, 64, 80, 96. A 4px sub-unit is acceptable for micro-spacing (icon-to-label gaps, inline padding). Values like 13px, 22px, or 37px indicate a grid has not been applied -- flag each occurrence.

**Identifying misalignment:** When describing misalignment in the analysis, name the specific element and its deviation. "The pricing headline is offset 14px from the left column edge" is actionable. "Some elements are misaligned" is not.

---

### Step 4 -- Audit Visual Hierarchy

Visual hierarchy is the deliberate arrangement of elements to create a ranked reading order. The goal is to ensure the viewer's eye moves through the content in the intended sequence.

**The seven dimensions of visual weight (ranked by typical impact):**

1. **Size** -- The single most powerful hierarchy tool. A 2:1 size ratio creates a clear dominant/subordinate relationship. A 3:1 ratio creates strong contrast. For type, a well-structured scale uses a type scale ratio of 1.25 (Major Third) to 1.618 (Golden Ratio). At 16px base: 1.25 scale yields 16, 20, 25, 31, 39px. 1.414 scale yields 16, 23, 32, 45, 64px.

2. **Weight (boldness)** -- Weight 700 reads as significantly heavier than weight 400 at the same size. Weight alone can shift an element from L2 to L1 when combined with size.

3. **Color and contrast** -- A high-contrast color (black on white: 21:1 contrast ratio) dominates a low-contrast color (gray #999 on white: 2.85:1). Saturated colors attract attention over desaturated. Warm colors (red, orange) attract over cool (blue, green) at equal saturation.

4. **Position** -- Above the fold dominates below. Top-left dominates in LTR reading cultures (F and Z pattern entry points). Center dominates for single-element compositions. Bottom-right is the weakest position -- use it for disclaimers and secondary navigation.

5. **Isolation / white space** -- An element surrounded by significantly more space than its neighbors gains visual weight. This is why a single word in a large empty area immediately becomes the focal point.

6. **Texture and complexity** -- Highly detailed, textured, or photographic elements attract the eye over flat, simple shapes. Use this intentionally: a complex hero image naturally draws the eye before flat text blocks.

7. **Motion** -- The most powerful attractor in digital contexts. Any moving element will capture attention before any static element at the same visual weight. Use motion only to direct attention to the most critical element.

**Hierarchy tier definitions:**
- **L1 (Dominant):** Exactly one element per page or screen. The first thing every viewer sees. Typically the primary headline or hero image.
- **L2 (Supporting):** 2-5 elements that provide context for L1. Section headings, feature icons, key statistics, the primary CTA.
- **L3 (Content body):** The main information mass. Body text, card content, list items.
- **L4 (Recessive):** Navigation, labels, metadata, footnotes, legal text. Should register but not compete.

**Hierarchy failure modes to check for:**
- **No L1:** Multiple elements at the same visual weight -- the eye has no entry point. Fix by increasing one element's size, weight, or contrast.
- **Competing L1s:** Two or more elements at L1 weight. Flag each and recommend which to demote.
- **Collapsed hierarchy:** Only two tiers exist (big and everything else). L2 and L3 elements blend together. Fix by introducing a middle tier through size or weight adjustments.
- **Inverted hierarchy:** A decorative element (background image, icon set) is visually heavier than the primary message. Reduce the decoration's visual weight (opacity, desaturation) or increase the message's weight.

---

### Step 5 -- Audit White Space

White space is not emptiness -- it is the spatial relationship that groups related elements and separates unrelated ones. It communicates structure without visual elements.

**The three-tier spacing system:**

| Tier | Name | Function | Digital Range | Print Range |
|------|------|----------|---------------|-------------|
| Micro | Within-component | Padding inside buttons, labels, cards; space between icon and text | 4-16px | 1-4mm |
| Meso | Between-component | Gap between cards, form fields, list items, inline elements | 16-48px | 4-12mm |
| Macro | Between-section | Separation between major page sections, content blocks | 48-128px | 12-30mm |

**The inviolable spacing ratio rule:**
Macro white space MUST be larger than meso white space, which MUST be larger than micro white space. Specifically:
- Meso ≥ 2× micro (if micro is 8px, meso minimum is 16px)
- Macro ≥ 2× meso (if meso is 24px, macro minimum is 48px)
- If these ratios are violated anywhere on the layout, elements will appear to belong to wrong groups.

**Proximity principle application:**
Elements with related meaning should have less space between them than elements from different groups. When auditing, group elements logically first, then verify that spatial proximity reflects that grouping. A label 8px above its input field but 24px above the next label creates correct proximity. A label 24px above both its input and the next label fails proximity -- the input does not appear to belong to the label.

**White space failure modes:**

- **Crowding:** Micro spacing applied at the macro level. Sections separated by only 16px merge visually. The fix is almost always to triple or quadruple the section gap.
- **Floating:** An element has so much macro space around it that it appears disconnected from the content it belongs to. Reduce the space on one side to create a proximity relationship.
- **Inconsistent meso:** Card 1 has a 24px bottom margin, card 2 has 16px. The grid appears broken even if column alignment is correct.
- **Interior crowding:** Content inside a container has inadequate padding. The minimum safe padding inside any container (card, modal, panel) is equal to the meso spacing value. If cards are separated by 24px (meso), their interior padding should be at least 24px.

**Digital-specific note on 8px grid discipline:**
All spacing values must be multiples of 8px. If the micro-spacing is 12px (not on the 8px grid), change it to 8px or 16px based on which looks better. The 4px sub-grid is acceptable only for optical adjustments to micro-spacing (such as 4px between an icon and its inline label).

---

### Step 6 -- Audit Focal Point and Eye-Flow

The focal point is where the viewer's eye lands first. Eye-flow is the path the eye takes after that entry point. Both must be designed intentionally.

**Focal point placement techniques:**

**Rule of thirds:**
Divide the canvas into a 3×3 grid. The four intersection points (at 33%/67% horizontally and 33%/67% vertically) are the four strongest focal positions. The top-left intersection is the strongest in LTR cultures. For a 1200px wide canvas, intersections are at 400px and 800px horizontally, and at proportional vertical positions.

**Golden ratio (φ = 1.618):**
The golden ratio provides an alternative focal point placement. Divide the canvas width by 1.618 to find the primary focal zone boundary. On a 1200px canvas: 1200 ÷ 1.618 = 741px from the left. The focal content should be centered on or near this 741px mark. The golden ratio spiral, when overlaid, provides a flow path from the focal point outward.

**Optical center:**
The perceived center of a rectangle is approximately 10% above the geometric center. For a 900px tall canvas, the geometric center is 450px, but the optical center is approximately 405px. Placing the primary element at optical center rather than geometric center appears balanced; at geometric center it reads as slightly low.

**Eye-tracking scan patterns:**

*Z-pattern:* Used when text density is low and visuals dominate. The eye enters at top-left, sweeps to top-right, drops diagonally to bottom-left, then sweeps to bottom-right. Design the layout so L1 is at top-left (or top-center), the primary CTA is at top-right or bottom-right.

*F-pattern:* Used when text density is high (articles, list pages, search results). The eye makes a strong horizontal sweep across the top (catches headlines), a shorter horizontal sweep below (catches subheads), then drops straight down the left edge (scanning for lead words). Place the most important information at the top horizontal band or the left edge. Avoid placing CTAs in the right half of the lower content area -- eye-tracking studies show those positions have poor fixation rates.

*Gutenberg diagram:* For layouts with evenly distributed elements (not clearly left-to-right), the eye moves from the top-left "primary optical area" to the bottom-right "terminal area." The top-right and bottom-left areas are "fallow" -- low attention. Reserve fallow areas for supporting content, not key actions.

*Circular flow:* For single-screen or splash layouts with a centered composition, the eye moves clockwise from the dominant element. Support this by arranging supporting elements clockwise around the focal point.

**Focal point failure modes:**
- **No clear focal point:** Every element is sized and weighted similarly. Fix: increase L1's size by at least 2× relative to L2.
- **Competing focal points:** Two elements have similar visual weight at L1 level. Fix: demote one by reducing size (to 0.7× of L1), reducing contrast (lighten the color), or increasing surrounding content density to reduce its isolation.
- **Focal point leads nowhere:** The eye finds the focal point but has no logical path to the primary action. Fix: position the CTA below or to the right of the focal point, within the natural eye-flow path.
- **Off-pattern focal point:** The most important element is placed in a fallow zone (lower-right in an F-pattern layout, lower-left in a Z-pattern layout). Reposition to the appropriate high-attention zone.

---

### Step 7 -- Assess Visual Balance

Balance is the distribution of visual weight across the layout's axes. Unlike hierarchy (which is about reading order), balance is about the overall sense of stability or dynamism.

**Symmetric balance:**
Equal visual weight on both sides of the central vertical axis. Creates stability, formality, and trust. Appropriate for corporate, financial, and healthcare layouts. Risk: can appear static or boring if hierarchy is not introduced through size and color.

**Asymmetric balance:**
Different elements on each side that have equivalent but not identical visual weight. A large, simple element on the right is balanced by a smaller, more complex cluster on the left. Creates dynamism and modernity. Requires careful weight calculation.

**Visual weight calculation (approximate):**
Assign relative weight values to major elements to check balance. A useful heuristic:
- Full-color photograph, 400×400px: weight 8
- Bold headline, 48px, full width: weight 6
- White space 200×400px area: weight 1
- Icon cluster 3× 32px: weight 2
- Body text paragraph 300×80px: weight 3

Sum the approximate weight on each side of the central axis. If the ratio exceeds 2:1, the layout will feel tilted. If it is between 1:1 and 1.5:1, it is balanced.

**Radial balance:**
Elements radiate from a central point. Rare in conventional layouts. Appropriate for certain infographic, icon cluster, or hero section treatments.

**Balance assessment questions:**
- Does the layout feel stable or does it feel like it wants to tip?
- Is any quadrant empty enough to feel like a void?
- Does the above-fold section feel heavier or lighter than below-fold?

---

### Step 8 -- Generate Specific, Prioritized Recommendations

Each recommendation must follow this structure:

1. **Element:** Name the specific element or group (e.g., "hero section headline," "pricing card row," "navigation bar")
2. **Current state:** What is the current measurement or arrangement?
3. **Problem:** Which principle is violated and why it matters
4. **Fix:** The exact change with measurements (pixel values, column spans, ratio multipliers, opacity percentages)
5. **Expected outcome:** What will visually improve as a result?

Prioritize recommendations in this order:
1. Hierarchy violations (L1 is wrong or absent) -- these cause the most confusion
2. Focal point misalignment -- affects immediate first impression
3. Major white space violations (macro ≤ meso) -- causes sections to blur together
4. Grid alignment failures -- undermines structural credibility
5. Balance issues -- affects overall comfort
6. Minor spacing inconsistencies -- polish-level fixes

Acknowledge what works well in the current layout before listing problems. This grounds the analysis and provides a baseline for comparison.

---

## Output Format

```
## Layout Analysis: [Page or Screen Name]

### Context
- **Content type:** [marketing page / dashboard / editorial / card grid / etc.]
- **Dimensions:** [canvas dimensions in px or mm]
- **Grid system in use:** [12-column / modular / freeform / unknown]
- **Primary user goal:** [what the viewer should do or feel first]

---

### Overall Assessment
| Principle         | Rating | Status      | Key Finding                                         |
|-------------------|--------|-------------|-----------------------------------------------------|
| Grid alignment    | ★★★☆☆  | Needs work  | [specific misalignment with element name]           |
| Visual hierarchy  | ★★☆☆☆  | Poor        | [hierarchy failure type: no L1 / competing / etc.]  |
| White space       | ★★★★☆  | Good        | [specific violation or "ratios maintained"]         |
| Focal point       | ★★☆☆☆  | Poor        | [focal point issue with position]                   |
| Visual balance    | ★★★☆☆  | Adequate    | [balance issue or "balanced"]                       |

Rating key: ★★★★★ Excellent | ★★★★☆ Good | ★★★☆☆ Adequate | ★★☆☆☆ Poor | ★☆☆☆☆ Severe

---

### What Works Well
- [Element or principle that is handled correctly -- be specific]
- [Second thing that works well]

---

### Grid Analysis
- **Current grid:** [column count, gutter size, margin size -- or "no grid apparent"]
- **Base unit:** [8px / other -- or "not on a base unit grid"]
- **Recommended grid:** [column count at Xpx max-width, Ypx gutters, Zpx margins]
- **Misaligned elements:**
  - [Element name]: [current position / offset] -- should align to [column/edge]
  - [Element name]: [current position / offset] -- should align to [column/edge]
- **Grid fix:** [specific alignment adjustments with exact values]

---

### Hierarchy Analysis
- **Intended L1:** [what should be dominant based on user's goal]
- **Current L1:** [what the eye actually hits first and why]
- **Hierarchy tiers found:**
  - L1: [element] at [size/weight/color]
  - L2: [elements] at [size/weight/color]
  - L3: [elements] at [size/weight/color]
  - L4: [elements] at [size/weight/color]
- **Failure mode:** [none / no L1 / competing L1s / collapsed / inverted]
- **Hierarchy fix:**
  - Increase [element] to [size]px, weight [value]
  - Reduce [element] to [size]px, weight [value]
  - Adjust [element] color to [contrast ratio target: e.g., 7:1 against background]

---

### White Space Analysis
| Tier   | Location                          | Current Value | Target Value | Status    |
|--------|-----------------------------------|---------------|--------------|-----------|
| Micro  | [specific element, e.g. btn padding] | [X]px       | [Y]px        | [OK/Fix]  |
| Micro  | [specific element]                | [X]px         | [Y]px        | [OK/Fix]  |
| Meso   | [specific element gap]            | [X]px         | [Y]px        | [OK/Fix]  |
| Meso   | [specific element gap]            | [X]px         | [Y]px        | [OK/Fix]  |
| Macro  | [section gap]                     | [X]px         | [Y]px        | [OK/Fix]  |
| Macro  | [section gap]                     | [X]px         | [Y]px        | [OK/Fix]  |

- **Ratio status:** Macro:[meso ratio] / Meso:Micro ratio [X:1 -- target 2:1 minimum]
- **Proximity violations:** [elements grouped incorrectly by spacing]
- **White space fix:** [specific values to change]

---

### Focal Point Analysis
- **Recommended scan pattern:** [Z-pattern / F-pattern / Gutenberg / circular] -- rationale
- **Current focal point:** [element, position as % from top-left, e.g. "50% × 20%"]
- **Recommended focal point position:** [element should be at X% × Y%, technique used]
- **Eye-flow path:** [describe the intended L1 -> L2 -> CTA path]
- **Focal point failure:** [none / no focal point / competing / off-pattern / leads nowhere]
- **Focal point fix:**
  - Move [element] to [position] (rule of thirds intersection at X:Y or golden ratio at Xpx)
  - [Additional adjustments to support the eye-flow path]

---

### Balance Analysis
- **Balance type:** [symmetric / asymmetric / radial]
- **Left-right weight ratio:** [approximate, e.g. 1.3:1 -- acceptable / 2.4:1 -- needs adjustment]
- **Above/below fold weight distribution:** [heavy top / heavy bottom / balanced]
- **Balance fix:** [specific element weight adjustments]

---

### Prioritized Recommendations

| # | Element                     | Change                                  | Principle      | Exact Measurement              | Impact |
|---|-----------------------------|-----------------------------------------|----------------|--------------------------------|--------|
| 1 | [element name]              | [specific change]                       | [principle]    | [px / ratio / %, exact value]  | High   |
| 2 | [element name]              | [specific change]                       | [principle]    | [px / ratio / %, exact value]  | High   |
| 3 | [element name]              | [specific change]                       | [principle]    | [px / ratio / %, exact value]  | Medium |
| 4 | [element name]              | [specific change]                       | [principle]    | [px / ratio / %, exact value]  | Medium |
| 5 | [element name]              | [specific change]                       | [principle]    | [px / ratio / %, exact value]  | Low    |

---

### Implementation Order
1. [First change -- fixes the most critical issue, enables other changes]
2. [Second change -- builds on first]
3. [Third change -- refines]
```

---

## Rules

1. **Every spacing value must be on the 8px base unit grid.** Values of 8, 16, 24, 32, 40, 48, 56, 64, 80, 96px are valid. Values like 13px, 22px, or 37px indicate freeform spacing and must be corrected to the nearest 8px increment unless a 4px sub-grid is explicitly justified for micro-spacing.

2. **There must be exactly one L1 element per page or per distinct viewport screen.** If the layout is scrollable, each viewport-height section may have one L1, but the overall page-level L1 (the above-the-fold dominant element) takes precedence. Multiple competing L1s are always a hierarchy failure, not a "balanced design choice."

3. **Macro spacing must be at minimum 2× meso spacing, and meso must be at minimum 2× micro spacing.** If a layout has 24px section gaps (macro) and 16px component gaps (meso), that is a violation -- both numbers are too close. Flag it and provide corrected values.

4. **Never make a recommendation without a specific, measurable value.** "Add more breathing room" is not valid. "Increase the gap between the testimonials section and the pricing section from 32px to 80px" is valid. Every recommendation must be precise enough for a developer to implement without judgment.

5. **Always identify the intended scan pattern before evaluating focal point placement.** A focal point is only "wrong" relative to the expected scan pattern for that content type. A Z-pattern landing page with a focal point at lower-left is misplaced. An F-pattern article with a focal point at lower-left may be correct for a pull-quote anchor.

6. **Grid recommendations must include three values: column count, gutter size, and margin size.** Recommending "a 12-column grid" is incomplete. The full recommendation is "12-column grid, 24px gutters, 80px margins, 1200px max-width container." All four parameters must be specified.

7. **Do not pathologize intentional asymmetry.** If a layout is intentionally grid-breaking (creative portfolio, editorial feature, artistic campaign), evaluate whether the breaks are consistent and purposeful. An intentional rule break that is applied consistently is a design choice. A sporadic misalignment is an error. Ask the user to clarify intent when unsure.

8. **Contrast ratios for text must meet minimum thresholds.** For hierarchy evaluation, note that text elements failing WCAG 2.1 AA contrast (4.5:1 for normal text, 3:1 for large text ≥ 18pt / 14pt bold) cannot function as hierarchy anchors regardless of their size, because they are illegible at distance. Flag contrast failures separately from hierarchy issues.

9. **Acknowledge what is working before listing failures.** A layout analysis that lists only problems is incomplete. Identify at least two elements or areas where the current layout succeeds. This gives the designer reference points to maintain while making changes.

10. **Print and digital layouts use different unit systems and must not be mixed.** Digital recommendations in pixels or rem. Print recommendations in millimeters or points. If a hybrid situation exists (designing a digital-first asset that will also print), specify both unit systems explicitly and note where they diverge.

11. **Recommendations must be ordered by visual impact, not ease of implementation.** The change that most improves the layout comes first even if it is harder to implement. The user can choose to skip difficult changes -- that is their decision -- but the priority order must reflect actual impact.

12. **Do not assume a grid exists unless evidence of one is provided.** If the user describes a layout without specifying a grid system, state "no grid apparent" and recommend one rather than analyzing against a grid that may not exist.

---

## Edge Cases

### No Existing Layout -- User Wants Principles Applied from Scratch
If the user has content but no layout, this skill becomes a **layout blueprint** mode rather than an audit mode. Define the appropriate grid for their content type and dimensions, assign hierarchy tiers to each content element they list (matching intended reading order to visual weight recommendations), specify all three tiers of white space, and identify which scan pattern to design for. Output a Layout Blueprint rather than a Layout Analysis. Note that for a full wireframe with interaction annotations, the user should proceed to `wireframe-specification` after receiving the blueprint.

### Data-Dense Dashboard or Admin Panel
Standard white space ratios compress significantly. Micro: 4-8px (use 4px base unit instead of 8px for these layouts). Meso: 8-16px. Macro: 24-40px. The 2:1 ratio rule still applies -- maintain relative proportion even though absolute values are smaller. Hierarchy shifts from size-dominant to color-and-weight-dominant because vertical space is limited and multiple panels have equivalent importance. Multiple L1 focal points are acceptable when each is contained within a visually enclosed panel (a card with a border or background fill that creates enclosure). F-pattern applies: top row of metrics receives the most attention. Place the most critical KPIs in the first row, leftmost position.

### Single-Element or Hero-Only Layouts (Splash Screens, Covers, Billboards)
The single element IS the focal point by definition -- the analysis shifts entirely to evaluating placement, white space ratio, and relationship to the frame. Target content-to-white-space ratio: 25-40% content, 60-75% white space for maximum impact (tight content-to-frame ratios feel suffocating on splash screens). Evaluate the element's position against rule of thirds (preferred) or optical center. Check whether the element is sized proportionally to the frame -- the element should not exceed 60% of the shorter canvas dimension. For billboard/OOH signage viewed at 30+ meters: minimum stroke weight 4pt equivalent, high contrast required (minimum 5:1 at full resolution), and the focal element should occupy 40-60% of the frame to remain readable at distance.

### Print Layout with Bleed and Safe Zones
Three boundaries must be defined: bleed edge (design extends 3mm past trim), trim line (physical cut line), safe zone (5mm inside trim -- no critical content outside this boundary). Text that crosses the trim line must be justified by design intent, not accident. Evaluate hierarchy in terms of above-fold defined as the top half of the printed page (the upper half receives significantly more attention when print is displayed on a shelf or folded). Baseline grid is critical in print: use a consistent leading value (e.g., 12pt leading) and snap all text blocks to multiples of this leading value for cross-column alignment.

### Intentionally Rule-Breaking Creative Layouts (Editorial, Portfolio, Campaign)
Do not apply standard grid audit rules mechanically. Instead, evaluate whether the rule-breaking is: (a) consistent -- the same rule is broken in the same way throughout, creating a system; (b) purposeful -- the break creates tension, movement, or emphasis that serves the design intent; (c) controlled -- the breaks are surrounded by structure that provides a reference point for the eye. An intentional break only reads as intentional if at least 60% of the layout is conventionally structured. If everything is breaking rules, nothing feels like a rule break -- it just looks chaotic. Recommend introducing at least one consistent structural anchor (a persistent margin, a baseline grid, a repeated element size) to make the rule-breaking legible as intentional.

### Mixed-Medium Layouts (Web Page That Also Prints)
CSS print stylesheets address some issues, but layout principles must be evaluated for both contexts separately. In digital mode: fluid behavior, scrolling, interaction states. In print mode: fixed canvas, no scroll, bleed/safe zone rules apply. Document both assessments. Key differences: digital macro spacing (64-96px) will appear as vast empty space in print (20-30mm equivalent); reduce proportionally. Typography that is 16px on screen may be 12pt in print -- verify both are readable in their respective contexts. Color mode shift (RGB to CMYK) can change contrast ratios; flag any text/background combinations where CMYK shift might drop below 4.5:1.

### Responsive Layout -- Multiple Breakpoints in Scope
This skill applies to single-viewport static layout analysis only. If the user needs to evaluate layout across breakpoints, the evaluation should be run separately for each major breakpoint (desktop 1440px, tablet 768px, mobile 375px). Common issues at breakpoints: hierarchy inversions (what is L1 at desktop becomes L3 when columns stack on mobile); white space ratio collapses (macro spacing set in px becomes disproportionately large on small screens -- prefer rem or viewport-relative units); grid collapses that create unintended focal point shifts. For full responsive layout design guidance, refer the user to `responsive-layout-design`.

### User Provides Only a Problem Description with No Visual Reference
When no visual is provided, the analysis must be structured as a **diagnostic interview + conditional recommendation.** Ask targeted questions: what is the canvas size? How many major sections? What is the approximate column count being used? What is the approximate size of the headline versus body text? Is there a clear hero/focal element? Use the answers to construct the most likely layout state and produce a conditional analysis ("If your section gaps are approximately 24-32px, the macro/meso ratio is likely violated -- here is the fix"). Explicitly label all assumptions and invite correction. Do not produce a high-confidence analysis from a vague description.

---

## Example

**Input:** "I have a SaaS product landing page. The layout from top to bottom is: navigation bar, hero section with a headline and subtext and a button, a 'social proof' bar with five logo images, a three-column features section with icon/title/text in each column, a testimonials section with three testimonial cards, a pricing section with three pricing tiers, and a footer. The page is 1440px wide. It looks too flat and nothing stands out. Every section feels the same importance and the CTA button in the hero barely registers."

**Output:**

## Layout Analysis: SaaS Product Landing Page

### Context
- **Content type:** Marketing / SaaS landing page
- **Dimensions:** 1440px wide, full-length scrollable
- **Grid system in use:** Unknown -- 12-column assumed based on three-equal-column feature section
- **Primary user goal:** Visitor should immediately understand the product value, then click the hero CTA to start a trial or learn more

---

### Overall Assessment
| Principle         | Rating | Status      | Key Finding                                                     |
|-------------------|--------|-------------|-----------------------------------------------------------------|
| Grid alignment    | ★★★☆☆  | Adequate    | Assumed 12-col grid may be in use, but no confirmation; verify |
| Visual hierarchy  | ★★☆☆☆  | Poor        | No L1 established -- every section has equivalent visual weight |
| White space       | ★★☆☆☆  | Poor        | Likely macro = meso violation causing sections to blur together |
| Focal point       | ★★☆☆☆  | Poor        | Hero CTA is visually weak; no dominant focal entry point        |
| Visual balance    | ★★★☆☆  | Adequate    | Three-column structures are likely balanced; hero unclear       |

---

### What Works Well
- The three-column feature section (icon / title / text) and three-card testimonials section are a structurally sound modular grid approach -- this creates good horizontal rhythm and reduces the amount of work needed in those sections.
- A clear sequential narrative exists in the content order (hero -> proof -> features -> social validation -> pricing -> conversion) -- the content strategy is sound. The layout problem is execution, not structure.

---

### Grid Analysis
- **Current grid:** Likely 12-column based on three equal-column sections. Gutter and margin widths unknown. Assumed: 24px gutters, 120px margins.
- **Base unit:** Unknown -- recommend establishing 8px as base unit throughout
- **Recommended grid:** 12-column at 1200px max-width container (centered in 1440px canvas), 24px gutters, 120px left/right margins (8.3% of 1440px). This centers the content comfortably and leaves sufficient breathing room on the 1440px canvas.
- **Misaligned elements (probable):**
  - Social proof logos: If centered within the full 1440px canvas without snapping to the 12-column grid, logos will float inconsistently. Align the logo row to a 6-column centered span (columns 4-9 of 12).
  - CTA button in hero: Likely left-aligned with the headline but not constrained to a maximum width. Set the button width to auto with horizontal padding of 32px each side, ensuring it does not exceed 240px width.
- **Grid fix:** Establish the 1200px max-width container explicitly. All section content (text blocks, cards, feature columns) should be constrained to this 1200px grid. Section backgrounds (full-bleed color bands or images) may span the full 1440px canvas width.

---

### Hierarchy Analysis
- **Intended L1:** Hero section headline -- this is the primary value proposition and the first message the visitor should receive
- **Current L1:** Likely nothing -- the hero headline, section headings, and testimonial headings are probably at similar visual weights, creating the "everything feels the same" symptom described
- **Hierarchy tiers as they likely exist:**
  - L1: No clear element (hero image or headline shares weight with section headings)
  - L2: Section headings, feature titles, testimonial cards -- all at similar size
  - L3: Body text, testimonial text, pricing descriptions
  - L4: Nav links, footer links, social proof labels
- **Failure mode:** No L1 established -- multiple elements competing for the same visual tier

- **Hierarchy fix:**
  - Set hero headline to 64-72px, weight 800. This creates approximately a 2.5:1 ratio against section headings at 28px, establishing a clear L1.
  - Set hero subtext to 20-22px, weight 400, color #4B5563 (approximately 60% lightness on white -- contrast ratio approximately 7:1). This reads as L2 subordinate to the headline.
  - Set section headings to 28-32px, weight 700. These are clearly L2 -- secondary to the hero but dominant within their sections.
  - Set feature column titles (inside cards) to 18-20px, weight 600. These are L3 within the section context.
  - Set body text to 16px, weight 400, line-height 1.6 (25.6px). Standard L3 readable text.
  - Result: a five-tier hierarchy (72px hero / 28px section / 20px sub / 18px card title / 16px body) that creates clear reading levels and eliminates the "everything feels the same" problem.

---

### White Space Analysis
| Tier   | Location                                  | Current (est.) | Target   | Status |
|--------|-------------------------------------------|----------------|----------|--------|
| Micro  | Button: internal padding (top/bottom)     | ~10px          | 16px     | Fix    |
| Micro  | Button: internal padding (left/right)     | ~16px          | 32px     | Fix    |
| Micro  | Feature card: icon to title gap           | ~8px           | 8px      | OK     |
| Micro  | Feature card: title to body gap           | ~8px           | 12px     | Fix    |
| Meso   | Between feature columns (gutter)          | ~24px          | 24px     | OK     |
| Meso   | Between testimonial cards                 | ~24px          | 24px     | OK     |
| Meso   | Between pricing tier cards                | ~24px          | 24px     | OK     |
| Macro  | Hero to social proof bar                  | ~32px (est.)   | 64px     | Fix    |
| Macro  | Social proof bar to features section      | ~32px (est.)   | 80px     | Fix    |
| Macro  | Features to testimonials                  | ~32px (est.)   | 80px     | Fix    |
| Macro  | Testimonials to pricing                   | ~32px (est.)   | 96px     | Fix    |
| Macro  | Pricing to footer                         | ~32px (est.)   | 64px     | Fix    |

- **Ratio status:** Estimated macro (32px) : meso (24px) = 1.33:1 -- severely below the 2:1 minimum. This is the primary cause of sections blending together.
- **Proximity violation:** The social proof logo bar at 32px from the hero and 32px from the features section appears to float ambiguously between both. Increasing the gap above the features section to 80px and reducing the gap above the social proof bar to 48px will "attach" the proof bar to the hero, reinforcing the credibility-building narrative before the features.
- **White space fix:**
  - Set all section-to-section macro spacing: Hero to proof bar 48px, proof bar to features 80px, features to testimonials 80px, testimonials to pricing 96px (pricing needs the most breathing room -- it is a decision moment), pricing to footer 64px.
  - Set hero section internal padding (top of headline from nav bottom) to 96px.
  - Increase CTA button padding to 16px top/bottom, 32px left/right. This makes the button substantially larger in tappable area and increases its visual weight.

---

### Focal Point Analysis
- **Recommended scan pattern:** Z-pattern -- this is a low-text-density marketing page with visual hierarchy expected to guide from hero to CTA without deep reading
- **Current focal point:** Likely the hero section center area, but no single element within the hero dominates; the headline, subtext, and button are at similar visual weights within the hero
- **Recommended focal point position:** Hero headline, positioned at the rule-of-thirds intersection -- 33% from the top of the hero section, 33% from the left edge of the content container (approximately 400px from left of the 1200px grid). On a hero that is approximately 700px tall, this places the headline top edge at approximately 233px from the hero section top.
- **Eye-flow path (Z-pattern):** Hero headline (entry, top-left of content area) -- hero subtext directly below -- CTA button (which should anchor the Z to the right with its visual weight and color contrast) -- social proof logos (low-attention Z diagonal transition) -- features section (second Z sweep) -- pricing (terminal Z area, the conversion zone)

- **Focal point failure:** The hero CTA button is described as barely registering. This is a compound problem: insufficient size (padding fix above), insufficient color contrast, and no visual isolation. The button is likely the same visual weight as other paragraph text.

- **Focal point fix:**
  - Apply a high-contrast fill to the CTA button. On a light hero background, use a brand primary color that achieves at least 4.5:1 contrast ratio against the button text (which should be white or near-white). A saturated mid-blue (#2563EB on white text) achieves 5.1:1. A dark navy (#1E3A8A on white) achieves 12.6:1. Choose based on brand, but do not use a light or desaturated color for the primary CTA.
  - Add 8px of additional top and bottom margin around only the CTA button -- isolating it slightly from the subtext above increases its visual weight through the proximity/isolation effect without changing the button itself.
  - Position the headline at the rule-of-thirds upper-left intersection within the hero section as described above. This anchors the Z-pattern entry point and ensures the eye flows naturally downward to the CTA.

---

### Balance Analysis
- **Balance type:** Symmetric (three-column structures in features, testimonials, and pricing create a symmetric vertical axis)
- **Left-right weight ratio:** Approximately 1:1 in middle sections (symmetric column layouts). Hero balance unknown -- depends on whether there is a hero image on the right (common two-column hero) or a centered single-column hero.
- **Above/below fold weight distribution:** If the hero section is full-viewport-height, the above-fold content is a single element (the hero) with high visual weight concentrated in a small area. Below-fold content is distributed across more sections and more elements. This is an acceptable top-heavy distribution for a landing page.
- **Balance fix:** If the hero is a two-column layout (text left, image right), ensure the right-side image has similar visual weight to the text column. A large product screenshot or device mockup on the right at 580-620px width within the 1200px grid works well. If the hero is single-column centered, center the headline, subtext, and CTA on the horizontal axis and ensure the vertical positioning follows the optical center rule (place headline top edge at approximately 38-40% from the top of the hero section, slightly above geometric center).

---

### Prioritized Recommendations

| # | Element                          | Change                                               | Principle        | Exact Measurement                                      | Impact |
|---|----------------------------------|------------------------------------------------------|------------------|--------------------------------------------------------|--------|
| 1 | Hero headline                    | Increase size and weight to establish L1             | Visual hierarchy | 64-72px, weight 800 (creates 2.5:1 ratio vs 28px L2)  | High   |
| 2 | All section gaps                 | Increase macro spacing to 2× meso minimum            | White space      | 80px between mid-sections, 96px before pricing, 48px hero-to-proof-bar | High   |
| 3 | Hero CTA button                  | Increase padding and apply high-contrast fill        | Focal point      | 16px / 32px padding; fill at 4.5:1+ contrast ratio vs. button text | High   |
| 4 | Hero headline position           | Move to rule-of-thirds upper-left intersection       | Focal point      | 33% from hero top (approx. 233px in 700px hero), 33% from left of 1200px grid | High   |
| 5 | Section headings                 | Standardize to 28-32px, weight 700 to establish L2   | Visual hierarchy | 28px maximum -- must remain below 50% of L1 (64px)    | Medium |
| 6 | Feature card title to body gap   | Increase from ~8px to 12px                           | White space      | 12px (on 4px sub-grid -- acceptable for micro-spacing)  | Medium |
| 7 | Social proof logo bar gap        
