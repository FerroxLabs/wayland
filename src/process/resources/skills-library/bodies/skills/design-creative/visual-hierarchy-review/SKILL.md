---
name: visual-hierarchy-review
description: |
  Evaluates visual hierarchy in a design by identifying the current focal point, assessing alignment with intended messaging, and recommending specific adjustments to size, weight, color, and position.
  Use when the user asks to review or critique visual hierarchy, fix competing elements, improve readability order, or evaluate where the eye lands in a design.
  Do NOT use for general UX audits (use ux-audit), accessibility-specific reviews (use accessibility-review), or full layout analysis (use layout-principles).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design analysis checklist"
  category: "design-creative"
  subcategory: "graphic-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Visual Hierarchy Review

## When to Use

**Use this skill when:**
- The user asks to review or critique the visual hierarchy of an existing design (web page, app screen, poster, email, advertisement, slide deck, packaging)
- The user says elements are "competing," the design "feels flat," "looks cluttered," or "nothing stands out"
- The user wants to know where the eye lands first and whether that matches the intended messaging priority
- The user asks how to make a specific element stand out more (hero headline, CTA button, price, badge) or recede into the background (navigation, legal text, decorative illustration)
- The user wants to improve the reading order -- the sequence in which a viewer processes information -- and wants that sequence to lead toward a specific action
- The user describes a conversion or engagement problem that may be rooted in hierarchy (low click-through on a CTA, users not noticing a key feature, confusion about what the page is for)
- The user wants to validate that a redesign improved hierarchy over a previous version
- The user has received feedback that a design is "hard to scan" or "overwhelming" and needs a structured diagnosis

**Do NOT use when:**
- The user wants a full usability audit covering task flows, navigation patterns, and interaction design -- use `ux-audit`
- The user needs an accessibility-specific evaluation (color contrast ratios for WCAG compliance, screen reader order, focus indicators) -- use `accessibility-review`
- The user wants a comprehensive grid, spacing, and layout analysis -- use `layout-principles`
- The user wants to wireframe a new page from scratch -- use `wireframe-specification`
- The user only wants typography adjustments (kerning, leading, typeface selection) without regard to hierarchy -- use `typography-review`
- The user is asking about information architecture (navigation taxonomy, site structure, content organization) -- use `information-architecture`
- The user wants brand or aesthetic feedback (does this look premium? does this match the brand?) without a hierarchy complaint -- this is brand/style review, not hierarchy review

---

## Process

### Step 1: Gather Context and Design Description

Before any analysis, collect the information required to produce a diagnosis rather than generic advice.

- **Request the design itself:** A screenshot, Figma link, exported image, or a detailed written description of every visible element with approximate sizes and positions. A written description is workable but will limit precision -- note this in the review.
- **Confirm the primary message:** Ask explicitly: "What is the single most important thing a viewer should understand within 3 seconds of looking at this design?" This becomes the intended L1 anchor.
- **Confirm the intended action:** What should the viewer do immediately after absorbing the primary message? (Click a button, remember a phone number, feel an emotion, read the next paragraph.) This defines where the reading path must terminate.
- **Identify the medium and viewport:** A poster viewed at arm's length, a mobile screen held close, and a billboard seen from 30 meters operate under completely different perceptual constraints. Type that achieves L1 dominance at 48px on a 1440px desktop viewport may be completely ineffective on a 375px mobile screen.
- **Ask about the audience:** Visual weight perception is influenced by cultural context, reading direction, and domain familiarity. A financial dashboard viewer has trained eyes that land on numbers first; a fashion editorial reader has trained eyes that land on the face in the photograph first.
- **Ask what feels wrong (if anything specific):** Sometimes the user has already identified the symptom. Use their language as a diagnostic clue.

---

### Step 2: Identify Every Visible Element and Classify Its Visual Weight

Systematically inventory every element in the design. Do not skip decorative elements -- they carry visual weight even when their content is irrelevant.

- **List all elements** in the order they appear in the layout (top-to-bottom, left-to-right for LTR designs): navigation, hero image, headline, subheadline, body copy, CTA button, icons, cards, section headings, body text blocks, images, dividers, backgrounds, footers, badges, annotations, illustration, etc.
- **For each element, identify its visual weight drivers.** Visual weight is the sum of six properties:
  - **Size** -- area occupied by the element (width × height in px, or relative to the viewport). A 400×400px image exerts more weight than a 100×100px icon even at identical contrast.
  - **Typographic weight** -- font weight value (300 Light, 400 Regular, 500 Medium, 600 Semibold, 700 Bold, 800 Extrabold, 900 Black). A weight jump of 200+ points creates a meaningful hierarchy tier.
  - **Color and contrast** -- measured as luminance contrast ratio (per WCAG formula). High-contrast elements (7:1 or above on their background) draw the eye powerfully. Saturated hues (HSB saturation above 70%) attract attention before desaturated hues.
  - **Position** -- elements at the optical center of a composition (slightly above the geometric center, roughly 45% from the top) receive attention before elements at the edges. In LTR designs, the upper-left quadrant is scanned first.
  - **Isolation and whitespace** -- an element surrounded by 40px or more of clear space on all sides is perceived as more important than an equally sized element crowded by neighbors. The Gestalt principle of figure-ground makes isolated elements "pop."
  - **Motion** -- any animated element (CSS animation, lottie, video autoplay) commands immediate L1 dominance due to the human visual system's peripheral motion detection. A moving element cannot be L2 or L3.
- **Assign a preliminary hierarchy level to each element:**
  - **L1 (Dominant):** The single entry point. One element only.
  - **L2 (Supporting):** Secondary attention after L1. 2-5 elements. These are the "what does it mean and what do I do?" layer.
  - **L3 (Detail):** Tertiary information, accessed only after L1 and L2 are processed. Fine print, metadata, supplementary navigation, legal text.
  - **Background/Neutral:** Texture, pattern, and ambient elements that should not register as a hierarchy level at all. If they do register, they are misclassified.

---

### Step 3: Trace the Actual Reading Path

Identify the sequence in which a real viewer would process the design, using scan pattern theory as a framework -- not as a rigid rule.

- **F-Pattern:** Observed in text-dense layouts. The eye scans the first line horizontally (strongest horizontal band), then scans a shorter second horizontal line, then drops into a vertical scan of the left edge. Common in article pages, email newsletters, documentation. The right side of the design below the first two horizontal bands is largely invisible.
- **Z-Pattern:** Observed in sparse, visually clean layouts with few text blocks. Entry top-left, sweep right across the top, diagonal drop to bottom-left, sweep right to bottom-right (the "hotspot" for CTAs). Common in landing pages, advertisements, hero sections.
- **Gutenberg Diagram:** Used for balanced, symmetrical designs. The "primary optical area" is top-left, the "terminal area" (natural end of reading) is bottom-right. The top-right and bottom-left are "fallow areas" that receive less attention. The diagonal from primary to terminal area is the "reading gravity" line.
- **Radial/Gravity Pattern:** Common in centered or radially symmetric designs. The eye enters the center of mass and radiates outward. Common in product photography, portrait photography, logos.
- **Irregular/Disrupted Pattern:** Any of the above patterns, broken by a competing element of sufficient visual weight. This is usually unintentional and is typically a hierarchy failure.
- **Describe the path as a sequence of named elements**, not just a pattern label. Example: "Navigation bar (ignored) → Hero image (entry via motion) → Hero headline (anchors eye) → Subheadline (natural drop) → CTA button (missed -- positioned in the fallow area) → Feature cards (eye drifts left) → (action never reached)."
- **Map the gap:** State explicitly whether the reading path delivers the eye to the intended action. If the CTA lives outside the natural reading path, this is a positioning issue, not just a styling issue.

---

### Step 4: Measure the Hierarchy Ratios

Precise measurement separates a useful review from vague impressions. Apply the following thresholds:

- **Typographic size ratios:**
  - L1 to L2 headline ratio: minimum **1.5:1**, recommended **1.8:1 to 2.5:1** for strong dominance. Below 1.3:1 is indistinguishable at a glance.
  - L2 to L3 ratio: minimum **1.3:1**, recommended **1.4:1 to 1.6:1**.
  - Body text to caption ratio: minimum **1.2:1** (e.g., 16px body to 13px caption).
  - Modular scale systems (Major Third = ×1.25, Perfect Fourth = ×1.333, Perfect Fifth = ×1.5, Golden Ratio = ×1.618, Major Second = ×1.125) produce harmonically consistent ratios. Name the scale if one is present; recommend one if it is absent.
- **Typographic weight thresholds:**
  - A weight jump of at least 200 points is required for reliable hierarchy separation: Regular (400) to Bold (700), or Light (300) to Semibold (600). A jump from Regular (400) to Medium (500) is insufficient unless accompanied by a size increase.
- **Color contrast ratios (WCAG luminance formula):**
  - Text on background: 4.5:1 minimum for normal text, 3:1 minimum for large text (18px+ regular or 14px+ bold).
  - L1 elements should target 7:1 or above for maximum prominence.
  - CTA buttons on light backgrounds: aim for a background color that achieves at least 3:1 against the page background, in addition to sufficient text contrast within the button.
- **Whitespace isolation:**
  - An L1 element should have noticeably more surrounding space than L2 elements. As a rule of thumb, L1 margin ≥ 1.5× the L2 margin on equivalent sides.
  - The minimum whitespace to create perceptual separation between two content blocks is typically 32px on desktop; less than 16px between distinct content areas reads as a single grouped unit (Gestalt proximity).
- **Size area (for non-text elements):**
  - An image or graphic element that occupies more than 25% of the viewport area will naturally compete for L1 regardless of typographic choices. If this is not the intended L1, reduce it below 20% or desaturate it significantly.

---

### Step 5: Diagnose the Hierarchy Issues

Match observations to known failure modes with precision. Every diagnosis must name the element, the specific measured property, and the perceptual consequence.

| Issue Type | Diagnostic Signal | Root Cause | Perceptual Consequence |
|---|---|---|---|
| **No focal point** | Eye wanders; multiple entry points all equal | All elements within 20% size variation; no color outlier | Viewer cannot orient; message is missed |
| **Competing L1 elements** | Eye jumps between two points | Two elements within 1.2:1 size ratio, similar weight/contrast | Viewer attention splits; both messages weaken |
| **Wrong focal point** | Decoration is more prominent than content | Background image, badge, or pattern has higher contrast or saturation than headline | Viewer is drawn to irrelevant content first |
| **Flat hierarchy** | Everything feels equally important | Fewer than 1.3:1 ratio between any adjacent levels | Viewer has no sense of priority; reads nothing |
| **Buried CTA** | Action element is unnoticed | CTA falls outside the reading path; CTA has same weight as surrounding elements | Conversion path breaks |
| **L3 creep** | Fine print and detail fight for attention | Too many typefaces, sizes, or colors used across the design | Cognitive overload; design feels noisy |
| **Orphaned L2** | Supporting elements have no clear L1 to support | L1 is too weak or absent; L2 elements cluster without anchor | Viewer processes details before context |
| **Reversed hierarchy** | Less important elements dominate more important ones | Priority assigned by visual proximity to designer, not viewer perception | Design contradicts its own message |
| **Motion override** | Animation draws eye away from intended L1 | Animated element is not the L1 content | L1 message is never received |
| **Color noise** | Too many saturated hues fighting for attention | More than 3 distinct hues at HSB saturation above 60% | No single element "wins" attention |

---

### Step 6: Generate Specific, Measurable Adjustments

Every recommendation must include a current value, a recommended value, and a ratio or contrast measurement to validate the fix. Group adjustments by the element they affect.

- **Size adjustments:** Always state the resulting ratio. "Increase hero headline from 32px to 56px (current ratio to subheadline: 32/20 = 1.6:1; target ratio: 56/20 = 2.8:1 -- strong L1 dominance)."
- **Weight adjustments:** Name the numeric weight values, not just "make it bolder." "Change hero headline from 500 (Medium) to 700 (Bold). Combined with the size increase, this creates a compound visual weight advantage."
- **Color adjustments:** Provide hex values and calculated contrast ratios. "Change CTA button from #94A3B8 (slate-400) to #2563EB (blue-600) on white (#FFFFFF). New contrast ratio: 8.59:1, up from 2.85:1."
- **Position adjustments:** Use grid-relative or percentage-based coordinates. "Move the CTA from its current position at 72% from top to 48% from top -- within the primary optical area of the Gutenberg diagonal."
- **Whitespace adjustments:** State exact pixel values. "Add 64px margin-top to the hero headline section, up from 24px. This isolates the L1 element and breaks its visual grouping with the navigation bar."
- **Reduction adjustments:** Hierarchy often improves by removing signals, not adding them. "Eliminate the secondary blue border on feature cards. This reduces the color signals from 4 (#2563EB headline, #0EA5E9 border, #64748B body, #F97316 CTA) to 3, allowing the CTA orange to read as the sole warm accent."
- **Scale adjustment:** If no modular scale is present, recommend one. "Adopt a Perfect Fourth scale (×1.333) starting from 16px body: 16px body → 21px small heading → 28px card title → 37px subheadline → 50px hero headline. This creates five distinct, harmonically related tiers."

---

### Step 7: Prioritize and Sequence the Recommendations

Not all hierarchy fixes are equal in impact or effort. Order them explicitly.

- **Critical (fix first):** Fixes that resolve a competing or absent L1. These are blocking issues -- no other fix matters until the L1 is established. A single type size increase can resolve a cascade of downstream issues.
- **High impact (fix second):** Fixes that place the CTA in the reading path or elevate an L2 element that is currently invisible.
- **Medium impact (fix third):** Fixes that clean up L3 noise, reduce competing color signals, or improve whitespace isolation.
- **Low impact (polish last):** Fixes that refine already-functional hierarchy -- tightening ratios from good to excellent, adding micro-contrast between L3 elements.
- State the expected perceptual outcome of each fix. Not just "this will look better" but "increasing the hero headline to 56px creates a 2.8:1 ratio to the card titles, removing all L1 competition and allowing the eye to settle on a single dominant element."

---

## Output Format

```
## Visual Hierarchy Review: [Design Name]

### Design Context
- **Medium:** [Web / Mobile / Print / Presentation / Email]
- **Intended primary message:** [The single most important thing a viewer should take away]
- **Intended action:** [What the viewer should do after processing the design]
- **Audience:** [Who is viewing this, and any perceptual context that matters]

---

### Element Inventory and Visual Weight Assessment
| Element               | Size / Scale          | Weight | Contrast Ratio | Position         | Whitespace Isolation | Current Level |
|-----------------------|-----------------------|--------|----------------|------------------|----------------------|---------------|
| [element name]        | [px / % viewport]     | [400]  | [7.2:1]        | [top-left / center / etc.] | [isolated / crowded] | [L1 / L2 / L3 / BG] |
| [element name]        | [px / % viewport]     | [700]  | [3.1:1]        | [position]       | [isolated / crowded] | [L1 / L2 / L3 / BG] |

---

### Hierarchy Level Map
| Level | Element               | Visual Weight Driver(s)                    | Intended? | Notes                              |
|-------|-----------------------|--------------------------------------------|-----------|------------------------------------|
| L1    | [element]             | [size, weight, contrast -- be specific]    | [Yes/No]  | [any critical observation]         |
| L1*   | [competing element]   | [why it competes: ratio measurement]       | No        | [COMPETING L1 -- critical issue]   |
| L2    | [element]             | [what makes it secondary]                  | [Yes/No]  | [observation]                      |
| L2    | [element]             | [what makes it secondary]                  | [Yes/No]  | [observation]                      |
| L3    | [element]             | [why it recedes]                           | [Yes/No]  | [observation]                      |
| BG    | [element]             | [why it should be invisible]               | [Yes/No]  | [observation]                      |

---

### Reading Path Analysis
- **Entry point:** [Element] -- [why it captures the eye first: specific driver]
- **Scan pattern:** [F-pattern / Z-pattern / Gutenberg diagonal / Radial / Irregular]
- **Actual reading path:** [Element 1] → [Element 2] → [Element 3] → [Element 4] → [end or loop]
- **Intended reading path:** [Element 1] → [Element 2] → [Element 3] → [Intended action]
- **Path alignment:** [Matches intent / Partially matches / Does not match]
- **Path failure point:** [Where the actual path diverges from the intended path, and why]

---

### Hierarchy Ratio Measurements
| Pair                          | Current Ratio | Threshold | Status      |
|-------------------------------|---------------|-----------|-------------|
| L1 to L2 (size)               | [x:1]         | 1.5:1 min | [Pass/Fail] |
| L2 to L3 (size)               | [x:1]         | 1.3:1 min | [Pass/Fail] |
| L1 weight vs. L2 weight       | [400 vs 700]  | 200pt gap | [Pass/Fail] |
| CTA contrast ratio            | [x:1]         | 3:1 min   | [Pass/Fail] |
| L1 whitespace vs. L2 whitespace| [px vs px]   | 1.5:1 min | [Pass/Fail] |
| Number of saturated hue signals| [n hues]     | ≤3        | [Pass/Fail] |

---

### Issues Diagnosed
| # | Issue Type              | Element(s) Affected         | Measured Evidence                          | Perceptual Consequence                           |
|---|-------------------------|-----------------------------|--------------------------------------------|--------------------------------------------------|
| 1 | [issue type]            | [element(s)]                | [specific measurement]                     | [what the viewer experiences as a result]        |
| 2 | [issue type]            | [element(s)]                | [specific measurement]                     | [what the viewer experiences as a result]        |

---

### Recommended Adjustments
| Priority | Element          | Property      | Current Value      | Recommended Value   | Resulting Ratio / Metric      | Resolves Issue # |
|----------|------------------|---------------|--------------------|---------------------|-------------------------------|------------------|
| Critical | [element]        | [property]    | [current]          | [recommended]       | [new ratio or contrast]       | [#]              |
| High     | [element]        | [property]    | [current]          | [recommended]       | [new ratio or contrast]       | [#]              |
| Medium   | [element]        | [property]    | [current]          | [recommended]       | [new ratio or contrast]       | [#]              |
| Polish   | [element]        | [property]    | [current]          | [recommended]       | [new ratio or contrast]       | [#]              |

---

### Before vs. After Hierarchy Map
| Level | Before (Current)                     | After (Recommended)                       |
|-------|--------------------------------------|-------------------------------------------|
| L1    | [current L1 -- with why it is weak]  | [intended L1 -- with why it will dominate]|
| L1*   | [competing element -- resolved]      | -- (removed from L1 competition)          |
| L2    | [current L2 elements]                | [new L2 elements]                         |
| L3    | [current L3 elements]                | [new L3 elements]                         |
| BG    | [background elements]                | [background elements]                     |

---

### Modular Scale Recommendation
- **Current state:** [Describe whether a scale is present or absent]
- **Recommended scale:** [Name of scale, multiplier, and base value]
- **Resulting type sizes:**
  - L1 (Hero headline): [px]
  - L2 (Section heading): [px]
  - L3 (Subheading / card title): [px]
  - Body: [px]
  - Caption / Label: [px]

---

### Prioritized Action Plan
1. **[CRITICAL]** [Specific action] -- [expected perceptual outcome]
2. **[HIGH]** [Specific action] -- [expected perceptual outcome]
3. **[HIGH]** [Specific action] -- [expected perceptual outcome]
4. **[MEDIUM]** [Specific action] -- [expected perceptual outcome]
5. **[POLISH]** [Specific action] -- [expected perceptual outcome]
```

---

## Rules

1. **There must be exactly one L1 element per viewport.** If the review identifies zero L1 elements (flat hierarchy) or more than one (competing L1), this is always a Critical issue and must appear first in the issues list. No other fixes are valid until L1 is resolved.

2. **Every adjustment must include specific numeric values.** Never write "increase the font size" without specifying the current size, the target size, and the resulting ratio. Never write "improve contrast" without providing the current hex values, the recommended hex values, and both contrast ratios. Vague recommendations are not actionable.

3. **Size ratios between hierarchy levels have defined minimums.** L1 to L2: minimum 1.5:1, strong 2.0:1+. L2 to L3: minimum 1.3:1. L3 to body: minimum 1.2:1. Any ratio below its minimum is a failing measurement and must be cited as evidence in the diagnosis.

4. **Font weight changes require a 200-point minimum jump to create reliable visual separation.** Weight 400 to 500 is not a hierarchy tier. Weight 400 to 600 is marginal. Weight 400 to 700 is reliable. Always state the numeric weight values.

5. **Limit distinct saturated color signals to three or fewer.** Count the number of hues with HSB saturation above 60% that are used for content elements (excluding background and neutral tones). Four or more competing saturated hues creates color noise that destroys hierarchy. Recommend which hues to desaturate or merge.

6. **The reading path must be described as an ordered sequence of named elements, not a pattern label alone.** "Z-pattern" is a shorthand, not a path description. Always trace the actual element-by-element sequence and compare it to the intended sequence.

7. **Decorative and background elements must be audited for accidental visual weight.** Any background image with luminance contrast above 3:1 against foreground text is competing with L1. Any illustration with a saturated color (HSB >70%) positioned within the optical center zone is competing with L1. Name these conflicts explicitly.

8. **Position within the viewport is a hierarchy lever.** The optical center (approximately 45% from top, 50% from left on a centered layout) is the most attention-attracting location. The Gutenberg terminal area (bottom-right) is the natural CTA location for Z-pattern designs. CTAs placed in fallow areas (top-right or bottom-left) are perceptually disadvantaged regardless of their styling.

9. **Motion overrides all spatial hierarchy.** Any animated element in the design automatically claims L1 in terms of initial attention. If the animated element is not the intended L1 message, this is a critical hierarchy conflict. Flag it and recommend either making the animated element the L1 content, or removing the animation.

10. **Every diagnosed issue must be paired with a specific, measurable recommendation.** Do not leave an issue unresolved. If the fix requires a strategic decision that only the designer can make (e.g., "should this section be removed entirely?"), present it as a decision with two specific options and their hierarchy consequences.

11. **State which modular scale, if any, is in use.** If the design uses a consistent type scale, name it (Major Third, Perfect Fourth, etc.). If the design uses arbitrary type sizes, note this as a contributing cause of inconsistent hierarchy and recommend a scale with its base size and multiplier.

12. **Reviews for mobile viewports must re-evaluate all ratios at the mobile breakpoint.** A 48px hero headline at 1440px wide desktop is only 33px equivalent at 375px mobile (proportional scaling). Mobile designs frequently collapse hierarchy because large-desktop elements scale down below L2 threshold values at small viewports. If the medium is responsive, address both breakpoints separately.

---

## Edge Cases

### Designs with No Text (Photography, Illustration, Abstract Art)

When a design contains no typographic elements, hierarchy is driven entirely by compositional visual weight: luminance contrast, color saturation, depth cues, sharpness vs. blur, and size. Apply the same L1/L2/L3 framework but translate each driver into compositional terms. The L1 element is the area of highest luminance contrast (the brightest subject against the darkest background, or vice versa) or the area of sharpest focus in a depth-of-field photograph. L2 elements are mid-contrast subjects and secondary focal planes. L3 is the background, ambient light, and blurred distance. Recommended adjustments speak to cropping, color grading (saturation increase on L1 subject, desaturation of background), vignetting (darkening edges to push the eye toward center), and depth of field (background blur to reduce L2 competition with L1). Do not attempt to assign typographic measurements to these designs.

### Dense Data Dashboards with Many Equal-Weight Panels

In a multi-panel dashboard where all data panels are intended to be equally accessible (no single KPI is more important than all others), the concept of a single L1 breaks down at the page level. Handle this case by applying hierarchy analysis within each individual panel rather than across the whole screen. Each panel has its own internal hierarchy: L1 is the primary KPI value (largest number, highest contrast), L2 is the metric label and unit, L3 is trend context (sparkline, delta percentage, time period). Cross-panel navigation hierarchy is established by layout position (top-left panels are scanned first due to F-pattern bias in dense text environments) and by panel size (a 2×1 wide panel signals more importance than four 1×1 panels). Recommend consistent internal hierarchy within panels and deliberate size differentiation for truly high-priority panels.

### Right-to-Left (RTL) and Vertical Script Designs

For Arabic, Hebrew, Farsi, and Urdu designs, the entire F-pattern and Z-pattern are mirror-reversed. The primary optical area is top-right (not top-left). The Gutenberg terminal area is bottom-left (not bottom-right). F-pattern scanning runs right-to-left along the top, then a shorter right-to-left scan, then a vertical drop on the right margin. For traditional Chinese, Japanese, and Korean vertical text layouts, reading runs top-to-bottom in columns proceeding right-to-left. The entry point is top-right and the terminal area is bottom-left of the rightmost column. When reviewing RTL or vertical designs, explicitly state the corrected reading path orientation and apply all position-based recommendations relative to the correct primary optical area and terminal area for that script system.

### Animation and Motion Design

Hierarchy in animated designs is temporal in addition to spatial. A still-frame analysis is insufficient. Evaluate hierarchy at three mandatory checkpoints: (1) the initial state (what is visible before any animation begins), (2) the mid-animation state (what is in motion versus at rest), and (3) the settled final state (what the eye rests on after all animations complete). Motion dominance follows a fixed perceptual rule: moving elements override all spatial hierarchy for the duration of their motion. This means a small, low-contrast animated element will draw the eye away from a large, high-contrast static headline. The correct use of motion in hierarchy is to animate the L1 element into view first (entry animation on the hero headline), then bring L2 elements in sequence (staggered entry), allowing the spatial hierarchy to reassert itself once motion ceases. Flag any design where a decorative element (particle background, looping ambient animation, animated border) remains in motion after the content elements have settled -- this is a persistent motion conflict with the spatial hierarchy.

### Multi-Page Documents (Brochures, Presentation Decks, Reports)

Each page has its own hierarchy, but cross-page consistency creates a meta-hierarchy that governs the reading of the entire document. L1 elements must occupy a consistent position across pages -- if the chapter title is top-center on page 1 and top-left on page 2, the viewer's eye loses its anchor. Evaluate three dimensions of cross-page hierarchy: (1) positional consistency (L1 elements occupy the same grid zone on every page), (2) scale consistency (the L1 type size is identical on every page within a section), and (3) color consistency (L1 color signal is the same hue across pages -- variation in L1 color across pages reads as different documents). In presentations specifically, the first three seconds of each slide function as the "Z-pattern moment" -- the viewer's eye enters the slide, scans the top, and settles on the L1 element. If the L1 element changes position slide-to-slide, each slide requires new orientation and increases cognitive load. Recommend a consistent "L1 zone" for the deck and flag any slides that place L1 content outside that zone.

### Designs with Extreme Color Complexity (High-Fashion Editorial, Gradient-Heavy UI, Illustration-Rich Layouts)

When a design uses more than five distinct color regions, the standard "count saturated hues" rule becomes insufficient. In these cases, shift the analysis from hue count to luminance anchoring. Find the single element with the highest luminance contrast against its immediate background. That element has L1 potential regardless of how many other colors surround it. The diagnosis becomes: does the element with the highest luminance contrast match the intended L1? If not, the fix is to either increase the luminance contrast of the intended L1 element or reduce the luminance contrast of the current visual winner. Never attempt to simplify a deliberately rich color palette as a hierarchy fix -- instead, use luminance contrast as the primary hierarchy signal and accept that hue variety will create ambient richness at the L3/background level.

### Mobile Designs with Persistent UI Chrome

When reviewing mobile screen designs, the persistent navigation bar (typically 44-56px at the bottom on iOS, or a top status bar + header of 88-96px total), system gestures, and the notch or dynamic island occupy significant viewport area and exert consistent visual weight. These chrome elements cannot be removed from the hierarchy analysis -- they are visible and they attract attention. The L1 element of the designed content must compete with or work in concert with the chrome. A common failure mode: the designer places the L1 headline at the very top of the scroll view, but the navigation bar or tab bar at the bottom is the highest-contrast element on screen (solid dark background, bright white icons). Evaluate the full screen composition including chrome and recommend content L1 placement that achieves dominance even in the presence of persistent UI elements. As a general guideline, content L1 elements should be placed in the zone between 15% and 60% from the top of the viewport (excluding chrome heights) to remain in the primary scan area.

---

## Example

**Input:** "Can you review the visual hierarchy on our SaaS pricing page? Here's what's on it:

- A sticky header with our logo (left), nav links (Pricing, Features, About -- center), and a 'Sign in' text link (right). The header has a white background.
- A page headline: 'Simple, transparent pricing' -- 28px, font weight 400, color #374151 (dark gray) on white. Centered.
- A subheadline below: 'Start free. Scale as you grow. Cancel anytime.' -- 20px, font weight 400, color #6B7280 (medium gray).
- Three pricing cards side-by-side: Free, Pro, and Enterprise. Each card has a white background with a 1px #E5E7EB border.
  - Free card: 'Free' in 18px/700 #111827, '$0/mo' in 32px/700 #111827, a list of 5 features in 14px/400 #374151, and a 'Get started' button (full width, #E5E7EB background, #374151 text, 14px/500).
  - Pro card: Same layout as Free. 'Pro' in 18px/700 #111827, '$29/mo' in 32px/700 #111827, a list of 8 features in 14px/400 #374151, a 'Most popular' badge in 12px/600 #FFFFFF on #2563EB pill shape, and a 'Start free trial' button (full width, #2563EB background, white text, 14px/600).
  - Enterprise card: 'Enterprise' in 18px/700 #111827, 'Custom' in 32px/700 #111827, a list of 10 features, and a 'Contact sales' button (full width, #E5E7EB background, #374151 text, 14px/500).
- Below the cards: a small 'Frequently asked questions' section header in 22px/600 #111827, followed by 4 accordion items in 16px/400 #374151.
- Footer: standard links in 12px/400 #9CA3AF.

The problem: it feels like nothing is telling me to buy the Pro plan, even though that is our most important CTA. The page feels flat."

---

**Output:**

## Visual Hierarchy Review: SaaS Pricing Page

### Design Context
- **Medium:** Web (desktop, assumed 1440px wide viewport)
- **Intended primary message:** The Pro plan at $29/mo is the recommended choice
- **Intended action:** Click "Start free trial" on the Pro card
- **Audience:** SaaS buyers evaluating a subscription tier -- experienced web users who scan pricing pages in a predictable top-down, card-comparison pattern
- **Stated problem:** Nothing directs the eye toward the Pro plan; the page feels flat and all three pricing options feel equally weighted

---

### Element Inventory and Visual Weight Assessment
| Element                   | Size / Scale                     | Weight | Est. Contrast Ratio | Position              | Whitespace Isolation | Current Level |
|---------------------------|----------------------------------|--------|---------------------|-----------------------|----------------------|---------------|
| Sticky header              | ~60px height, full width         | 400    | Logo ~high, nav ~3:1 | Top, fixed           | None (flush)         | BG/L3         |
| Page headline             | 28px, centered                   | 400    | ~7.8:1 (#374151 on white) | Upper center     | Moderate             | L2 (should be L1) |
| Subheadline               | 20px, centered                   | 400    | ~4.7:1 (#6B7280)    | Below headline        | Moderate             | L2            |
| Free card -- "$0/mo"      | 32px, card context               | 700    | ~19.6:1 (#111827)   | Left third            | Card border only     | L1* (competing) |
| Pro card -- "$29/mo"      | 32px, card context               | 700    | ~19.6:1 (#111827)   | Center                | Card border only     | L1* (competing) |
| Enterprise card -- "Custom"| 32px, card context              | 700    | ~19.6:1 (#111827)   | Right third           | Card border only     | L1* (competing) |
| "Most popular" badge       | 12px/600, pill, #2563EB bg      | 600    | white on #2563EB ~4.7:1 | Top of Pro card  | Isolated (pill)      | L2            |
| "Start free trial" button  | 14px/600, full-width, #2563EB  | 600    | ~8.59:1             | Bottom of Pro card    | None (flush to card) | L2            |
| "Get started" buttons (×2) | 14px/500, full-width, #E5E7EB  | 500    | ~1.6:1 (near invisible) | Bottom of Free/Enterprise | None          | L3/BG         |
| FAQ header                 | 22px/600, #111827               | 600    | ~19.6:1             | Below cards           | Low (close to cards) | L2 (too high) |
| Feature list items         | 14px/400, #374151               | 400    | ~7.8:1              | Mid-card              | None                 | L3            |
| Footer links               | 12px/400, #9CA3AF               | 400    | ~2.7:1              | Bottom                | Large (below fold)   | L3            |

---

### Hierarchy Level Map
| Level | Element                          | Visual Weight Driver(s)                                              | Intended? | Notes                                             |
|-------|----------------------------------|----------------------------------------------------------------------|-----------|---------------------------------------------------|
| L1*   | "$0/mo" (Free card price)        | 32px, weight 700, contrast 19.6:1 -- highest text spec on page      | No        | COMPETING L1 -- identical spec to Pro and Enterprise |
| L1*   | "$29/mo" (Pro card price)        | 32px, weight 700, contrast 19.6:1 -- identical visual spec to Free  | Yes (intended) | Intended L1, but indistinguishable from competitors |
| L1*   | "Custom" (Enterprise card price) | 32px, weight 700, contrast 19.6:1 -- identical visual spec         | No        | COMPETING L1 -- third element fighting for dominance |
| L2    | Page headline                    | 28px, weight 400 -- slightly larger than subheadline, moderate contrast | Yes   | Too close to subheadline (1.4:1 ratio) to dominate as a true L2 anchor |
| L2    | "Most popular" badge             | Blue pill, white text -- only saturated color element above the fold | Yes       | Correct instinct but undersized (12px) to carry full L2 weight |
| L2    | "Start free trial" button        | #2563EB background -- only CTA with visible color                   | Yes       | Correct color, but 14px/600 at card-bottom position loses to card-level L1 competition |
| L2    | FAQ section header (22px/600)    | Second-largest text on page, high contrast, bold                     | No        | Pulls too much weight -- nearly equal to page headline |
| L3    | Subheadline                      | 20px/400, #6B7280 -- lighter color reduces weight                   | Yes       | Correctly subdued |
| L3    | Feature list items               | 14px/400 -- small and regular weight                                | Yes       | Correct |
| L3    | "Get started" / "Contact sales" buttons | #E5E7EB bg -- near-invisible on white, 1.6:1 contrast        | Partially | Correct to be visually subordinate, but contrast is so low they may read as disabled states |
| BG    | Card borders (1px #E5E7EB)       | Structural separator -- low contrast, correctly invisible            | Yes       | No issue |
| BG    | Footer links                     | 12px, very low contrast -- correctly receding                        | Yes       | No issue |

---

### Reading Path Analysis
- **Entry point:** Three-way tie between "$0/mo," "$29/mo," and "Custom" -- all at 32px/700/#111827, all within the same horizontal band. The eye cannot settle.
- **Scan pattern:** Attempted Z-pattern, but disrupted at the card row by three competing L1 elements of identical visual weight. The horizontal band of price values reads as a single undifferentiated stripe.
- **Actual reading path:** Sticky header (brief) → Page headline (lands, but low-weight for L1 role) → Subheadline (drops through quickly) → Price values (eye splits across all three simultaneously -- no winner) → Badge noticed briefly → "Start free trial" button noticed but contextually equivalent to the other card's invisible buttons → FAQ header interrupts and pulls attention downward prematurely
- **Intended reading path:** Page headline → Pro card (visually dominant as best choice) → "Most popular" badge (validates choice) → Pro features (confirms value) → "Start free trial" button (completes conversion)
- **Path alignment:** Does not match intent
- **Path failure point:** At the card row. Three price values at identical visual specs create a perceptual wall. The Pro card has two differentiating signals (badge, colored CTA button) but both are too small and too low in the card to intercept the eye before it fragments across all three price values.

---

### Hierarchy Ratio Measurements
| Pair                                           | Current Ratio | Threshold | Status      |
|------------------------------------------------|---------------|-----------|-------------|
| Page headline to subheadline (size)            | 28px/20px = 1.4:1 | 1.5:1 min | **Fail**   |
| Page headline to price value (size)            | 28px/32px = 0.88:1 | L1 should dominate L2 | **Fail** |
| Pro price to Free/Enterprise price (size)      | 32px/32px = 1.0:1 | Must be >1.5:1 for differentiation | **Critical Fail** |
| "Most popular" badge to price value (size)     | 12px/32px = 0.38:1 | Badge too small to be effective L2 anchor | **Fail** |
| "Start free trial" button text to feature list | 14px/14px = 1.0:1 | No size differentiation | **Fail** |
| CTA button contrast (Pro)                      | ~8.59:1 (#2563EB/#FFFFFF) | 3:1 min | **Pass** |
| CTA button contrast (Free/Enterprise)          | ~1.6:1 (#E5E7EB/#374151) | 3:1 min | **Fail** |
| Number of saturated hue signals               | 1 (#2563EB only) | ≤3 | **Pass** |
| L1 whitespace isolation vs L2                 | All price values share the same card/border spacing | L1 needs 1.5× more isolation | **Fail** |
| FAQ header vs. page headline (size)            | 22px/28px = 0.79:1 | Should be ≤0.75:1 (L3 vs L1) | **Fail** |

---

### Issues Diagnosed
| # | Issue Type                 | Element(s) Affected                        | Measured Evidence                                                              | Perceptual Consequence                                                         |
|---|----------------------------|--------------------------------------------|--------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| 1 | Triple competing L1        | "$0/mo," "$29/mo," "Custom"               | All three at identical 32px/700/#111827 -- 1.0:1 ratio between them            | Eye cannot select a single dominant element; Pro plan receives no more attention than Free or Enterprise |
| 2 | Wrong element at L1        | Price values (should be page headline or Pro card) | Price values at 32px exceed page headline at 28px (headline/price = 0.88:1) | The design's L1 elements are data points, not the message or the recommended plan |
| 3 | Buried differentiator      | "Most popular" badge                       | 12px -- 2.67× smaller than the price values it is meant to elevate             | Badge does not meaningfully signal "choose this one" before the eye fragments  |
| 4 | Invisible secondary CTAs   | "Get started," "Contact sales" buttons    | #E5E7EB on white = 1.6:1 contrast -- below readable threshold                  | Buttons read as disabled; creates false impression that Free and Enterprise are not actionable, unintentionally devaluing the comparative choice |
| 5 | Page headline too weak for anchor | Page headline "Simple, transparent pricing" | 28px/400 -- 0.88:1 ratio to price values; weight 400 vs. weight 700 prices   | Headline fails to establish context before eye reaches card row; users arrive at price comparison without orientation |
| 6 | FAQ header competes with page headline | FAQ "Frequently asked questions" | 22px/600 vs. page headline 28px/400 -- FAQ weight advantage (600 vs. 400) partially offsets its size disadvantage; near-equal visual weight | FAQ section pulls pre-mature attention from post-card-comparison position |

---

### Recommended Adjustments
| Priority | Element                      | Property           | Current Value                        | Recommended Value                    | Resulting Ratio / Metric                                     | Resolves Issue # |
|----------|------------------------------|--------------------|--------------------------------------|--------------------------------------|--------------------------------------------------------------|------------------|
| Critical | Pro card -- entire card      | Card background    | #FFFFFF (matches Free/Enterprise)    | #EFF6FF (blue-50 tint)               | Pro card now has distinct background -- only card with non-white BG | 1              |
| Critical | Pro card -- "$29/mo"         | Font size          | 32px                                 | 44px                                 | Pro price/Free price ratio: 44/32 = 1.375:1 -- Pro noticeably larger | 1              |
| Critical | Pro card -- "$29/mo"         | Color              | #111827                              | #1D4ED8 (blue-700)                   | Pro price is now the only colored price value; immediately differentiates | 1, 2           |
| Critical | Page headline                | Font size          | 28px                                 | 40px                                 | Headline/Pro price ratio: 40/44 ≈ 0.91 -- headline now pairs with price rather than losing to it; increase to 48px if page headline should strictly dominate | 2              |
| Critical | Page headline                | Font weight        | 400 (Regular)                        | 700 (Bold)                           | Weight now 700 vs. price values 700 -- headline matches weight authority; size + position above cards gives it first-read advantage | 2              |
| High     | "Most popular" badge         | Font size          | 12px                                 | 14px                                 | Minor improvement; primary fix is the badge size increase and repositioning | 3              |
| High     | "Most popular" badge         | Padding / size     | Small pill (~24px height)            | 32px height pill, 16px horizontal padding | Badge now large enough to be read at the scan speed of a pricing page | 3              |
| High     | "Most popular" badge         | Position           | Top of Pro card, inline with card header | Positioned above the Pro card top border (overlapping, centered) | Badge breaks out of the card grid and signals prominence before the eye enters the card | 3              |
| High     | "Get started" button (Free)  | Background color   | #E5E7EB                              | #FFFFFF with 1.5px #6B7280 border    | Contrast: border ~4.6:1 on white -- button is now visibly a button but subordinate to the Pro CTA | 4              |
| High     | "Contact sales" button (Enterprise) | Background color | #E5E7EB                   | #FFFFFF with 1.5px #6B7280 border    | Same as Free -- both clearly buttons, neither competes with Pro CTA | 4              |
| Medium   | FAQ section header           | Font size          | 22px                                 | 18px                                 | FAQ/page headline ratio: 18/40 =
