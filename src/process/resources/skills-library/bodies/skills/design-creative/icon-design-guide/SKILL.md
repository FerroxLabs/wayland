---
name: icon-design-guide
description: |
  Produces an icon design specification with grid size, stroke weight, corner radius, visual style, perspective rules, and metaphor selection for consistent icon sets.
  Use when the user asks to design icons, create an icon set style guide, define icon grid rules, or establish consistent icon design parameters.
  Do NOT use for logo design (use logo-design-brief), full design systems (use design-system-foundations), or AI-generated images (use an AI image generation skill).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design template checklist"
  category: "design-creative"
  subcategory: "graphic-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Icon Design Guide

## When to Use

**Use this skill when:**
- The user asks to design a UI icon set for a web, mobile, or desktop product and needs consistent visual parameters defined before any drawing begins
- The user wants to create an icon style guide or visual specification document that other designers or developers can follow to maintain consistency across a product suite
- The user needs to audit an existing icon set for inconsistencies -- stroke weight drift, perspective mismatches, misaligned optical centers -- and wants a corrected specification
- The user is building a new product and must define icon grid rules, corner radius tokens, and metaphor guidelines before sourcing or commissioning icons
- The user needs to establish size variant rules, including how icons should simplify at 16px versus 24px versus 48px, and how stroke weight scales across breakpoints
- The user is extending an existing icon library (adding 10 new icons to a set of 40) and needs to match the established parameters precisely
- The user is defining icons for a specific platform context -- a mobile nav bar, a toolbar, a status indicator strip -- where optical sizing and grid constraints differ from general UI icons
- The user wants metaphor selection guidance for abstract concepts that resist literal depiction (security, collaboration, performance, intelligence)

**Do NOT use when:**
- The user wants to design a logo or wordmark (use `logo-design-brief` -- logos require entirely different alignment, negative space, and reproduction rules)
- The user wants to build a full design system including color tokens, typography scales, spacing, and component libraries (use `design-system-foundations` -- icon specification is a component of that larger system)
- The user wants to generate icons using AI image generation tools (use an AI image generation skill -- the output format and process differ entirely)
- The user wants to create illustrations, spot art, or decorative graphics that are not constrained to a fixed-size grid (icon design is specifically grid-constrained)
- The user wants to animate a complex motion graphic or lottie file from scratch beyond basic icon micro-interactions (animation sequencing is a separate discipline)
- The user wants to design data visualization symbols, cartographic markers, or infographic icons that require semantic encoding rules beyond visual metaphor (those follow separate visualization design standards)

---

## Process

### Step 1: Gather Icon Set Requirements

Before defining any parameters, establish the full scope of what the icon set must accomplish. Incomplete intake leads to a specification that breaks down when edge cases appear.

- **Purpose and context:** Determine whether these are UI icons (toolbar, sidebar, navigation), communication icons (marketing site, empty states, onboarding), status indicators (success, error, warning, info), or category icons (product taxonomy, wayfinding). Each has different density and legibility requirements. UI toolbar icons at 24px live next to text labels and need high contrast. Empty-state illustrations at 96px can carry nuance.
- **Icon count:** The number directly affects organization strategy. Under 20 icons can be managed as a flat list. 20-60 icons need category groupings. Over 60 icons require a naming taxonomy, a reference sheet, and formal governance to prevent duplication (two different "share" metaphors appearing in the same set).
- **Target rendering sizes:** Ask specifically where each size is used -- "we need 16px in the data table row, 24px in the main nav, 32px on feature cards, and 48px in the empty state." Different sizes require genuinely different design decisions, not just scaling.
- **Style preference with rationale:** Outlined icons (stroke-only) read as lightweight and modern; they work well at 24px but require careful minimum-stroke management at 16px. Filled icons carry more visual weight and are easier to recognize at small sizes -- this is why most mobile navigation bars use filled icons for selected states. Duotone adds dimension without full color. Mixed sets (outlined default, filled active) require that both versions of every icon exist.
- **Brand and platform context:** If a brand uses circular avatars, pill buttons, and 8px corner radius, sharp-cornered icons will feel inconsistent. Identify existing radius tokens, primary color palette, and any existing icon style the new set must match or replace. Platform conventions -- iOS Human Interface Guidelines, Material Design, Fluent Design -- each prescribe different grid sizes, stroke weights, and corner philosophies that users may want to align with or deliberately deviate from.
- **Export requirements:** SVG for web (scalable, styleable with CSS currentColor), PNG sprite sheets for older contexts, PDF for print documentation, component integration for design tool libraries. Export format affects how stroke vs. fill is specified (CSS-styleable SVGs require strokes defined as `currentColor`, not hardcoded hex values).

---

### Step 2: Define the Icon Grid

The grid is the non-negotiable foundation. Every proportion, alignment, and size decision flows from it. A grid is not just a canvas size -- it is a system of zones that enforce optical consistency across icons that depict visually disparate things.

- **Canvas size selection:** The standard UI icon grid sizes are 16x16px (compact, dense interfaces), 20x20px (iOS standard, some Material variants), 24x24px (the most common web UI size, recommended default), 32x32px (feature call-out, some native app contexts), and 48x48px or larger (hero/empty-state size, where icons begin to function like small illustrations). Do not invent unusual sizes like 22px or 28px unless the platform explicitly requires it.
- **Live area definition:** The live area is the inner boundary where icon content must stay. Standard padding is 10% of the canvas on each side. For a 24px grid: 2px padding creates a 20x20px live area. For a 16px grid: 1px padding creates a 14x14px live area. For a 32px grid: 2px padding creates a 28x28px live area. Never let strokes or fills touch the outer canvas edge.
- **Keyline shapes:** Keylines are not decorative -- they are optical balancing tools. A circle and a square of the same width look different in weight because the circle's corners recede. Icons built to a circle keyline (such as a sun icon or an avatar) must be slightly larger than icons built to a square keyline (such as a folder or a document) to appear the same visual weight. The keyline system for a 24px grid: Circle = 20px diameter; Square = 18x18px; Portrait rectangle = 18x20px; Landscape rectangle = 20x18px. Icons that are naturally wide (landscape) use the landscape keyline; icons that are naturally tall (portrait, person) use the portrait keyline.
- **Pixel grid alignment:** All anchor points must land on whole-pixel coordinates at the design grid size. No 0.5px, no 0.33px. At 24px, a stroke centered on a whole-pixel coordinate with a 1.5px weight will have edges at 0.25px offsets -- this is acceptable because modern rasterizers handle sub-pixel stroke rendering well. However, at 16px with a 1px stroke, every anchor point must be whole-pixel with stroke centers on whole-pixel coordinates to avoid anti-aliasing blur.
- **Grid modularity:** For larger sets (40+ icons), define a modular grid within the live area -- a 4-unit or 8-unit internal grid. For a 24px grid with a 20px live area, a 4-unit internal grid creates 5px units, letting elements snap to common proportions. This keeps internal spacing consistent: a gap between two parallel lines is always 2px or 4px, never 3px.

---

### Step 3: Define Stroke and Fill Parameters

Stroke and fill rules are the most frequently violated aspect of icon sets. A set that starts with 2px strokes but drifts to 1.5px by icon #25 looks unprofessional even when the metaphors are well-chosen.

- **Stroke weight by grid size:** These are the standard professional recommendations. 16px grid: 1px stroke (1.5px is technically valid but creates very heavy icons). 20px grid: 1.5px stroke. 24px grid: 1.5px or 2px stroke. 32px grid: 2px stroke. 48px grid: 2px or 2.5px stroke. The rule is that stroke weight as a percentage of grid size should fall between 6-8% for most UI icons. At 24px, 1.5px = 6.25%, 2px = 8.3%. Both are valid; choose based on desired visual weight.
- **Stroke cap style:** Round caps add 0.5 * stroke-weight length to each open path end. This means a horizontal line drawn from x=4 to x=20 with a 2px round cap will visually extend to x=3 and x=21. Account for this when aligning elements near the live area edge. Use round caps for friendly, approachable interfaces. Use butt caps for technical, precise, or utilitarian interfaces. Square caps are rarely used in modern icon design -- they behave like butt caps in optical positioning but extend like round caps in length, creating alignment confusion.
- **Stroke join style:** Round joins are consistent with round caps -- use them together. Miter joins create sharp points at corners; the miter limit controls when sharp joins automatically convert to bevel joins (the default miter limit in most drawing tools is 4). For a 2px stroke with miter joins, very acute angles (below 30 degrees) will convert to bevels automatically. This is acceptable but must be tested at the smallest render size.
- **Filled icon rules:** For solid/filled icons, optical weight must be managed manually because the rasterizer does not automatically balance visual mass. A filled circle and a filled square at the same pixel dimensions will not appear the same weight -- the square will look heavier. Filled icons should use the same keyline system as outlined icons so a filled "notification bell" and a filled "settings gear" appear equal in visual weight even if their bounding boxes differ slightly. Minimum counter space (gaps inside filled shapes, like the interior of a letter form or the center of a target icon) must be at least 2px at the design grid size.
- **Duotone specification:** Duotone icons use a base shape plus a secondary accent shape. The secondary shape is typically the same primary color at 16-25% opacity, or a literal second color from the brand palette. The critical rule: the icon must be fully legible with the secondary layer removed entirely. Secondary shapes add depth and brand expression -- they cannot carry meaning that the primary layer does not already convey.
- **CSS currentColor compatibility:** For web SVG icons that must respond to theme changes (dark mode, hover states, brand color overrides), all strokes and fills must be specified as `currentColor` in the SVG, not as hardcoded hex values. This means designing icons as single-color assets with opacity variations (for duotone, use a separate path with `opacity: 0.2`) rather than hardcoded two-color specifications.

---

### Step 4: Define Corner Radius

Corner radius is one of the most powerful consistency signals in an icon set. Inconsistent corners are immediately visible even to non-designers -- it creates a subliminal sense that the icons "do not belong together."

- **Radius selection relative to stroke weight:** A common professional rule is to set corner radius equal to stroke weight. A set with 2px strokes uses 2px corner radius. This creates visual harmony because the curve of rounded corners visually echoes the curve of round stroke caps. For a 1.5px stroke set, use 1.5px or 2px radius (round up to the nearest 0.5px for practical workability).
- **Exterior vs. interior corners:** Exterior corners use the defined radius. Interior corners -- the inside of a shape like a folder tab or a bracket shape -- use a different radius formula. Interior radius = exterior radius - stroke weight. So for 2px exterior radius with 2px stroke weight, interior radius = 0px (sharp interior corners). For 2px exterior radius with 1.5px stroke: interior radius = 0.5px. This prevents the visual "bulging" that occurs when interior corners are over-rounded.
- **Semantic exceptions to the radius rule:** Circular elements (loading spinners, badges, radio buttons, avatars) always use full radius (50%). Pointed semantic elements (arrows, chevrons, play buttons when depicted as triangles, warning triangles) use sharp corners (0px radius) because rounding the tips diminishes their directional or warning character. These exceptions must be explicitly listed in the specification.
- **Radius tokens vs. hardcoded values:** If the product has a design token system with a radius scale (e.g., `radius-sm: 2px`, `radius-md: 4px`), the icon corner radius should reference the same scale. This ensures that if the product updates its visual personality to be "softer" by increasing radius tokens, icon updates can be evaluated in context.

---

### Step 5: Define Perspective, Orientation, and Optical Balance

Perspective consistency is the second most-violated rule in large icon sets, especially sets built by multiple designers over time.

- **Perspective selection:** Flat/2D icons are the overwhelming standard for UI icon sets. They scale well, work at all sizes, and require no shading or depth simulation. They are also the most compatible with CSS color theming. Front-facing 3D icons (slight perspective projection) appear in some consumer-facing marketing contexts but create serious alignment and visual weight problems when mixed with flat icons. Isometric icons (30-degree angle projection) are occasionally used for feature icons or empty states at 48px and above but should never be mixed with flat 2D UI icons. Choose one perspective and apply it universally.
- **Facing direction for directional icons:** In left-to-right (LTR) interface contexts, directional motion icons face right: arrows, play, forward, export, next, send. Backward/undo icons face left. Vertical directional icons (upload, download, sort, scroll) maintain their vertical axis. In bidirectional interfaces (RTL/LTR switching), directional icons must be mirrored -- this must be designed explicitly, not assumed to happen automatically with CSS transforms (some icons like checkmarks should not mirror).
- **Optical center vs. geometric center:** Geometrically centered icons can appear to sit too high in their bounding box because the human visual system reads horizontal balance differently from vertical balance. Heavier shapes at the bottom of an icon feel grounded; heavier shapes at the top feel unbalanced. Many icons appear optically centered when shifted 0.5-1px down from their geometric center. Test every icon at its final render size against a true grid line to confirm optical alignment.
- **Rotation conventions:** Icons that represent physical objects with a natural orientation (scissors, pencil, wrench, ruler) are traditionally shown at a 45-degree angle pointing toward the upper-right -- this is an established convention that conserves horizontal space while conveying the tool's form. Do not rotate these icons arbitrarily; use the canonical 45-degree angle unless the product's visual language explicitly establishes a different convention.

---

### Step 6: Define Metaphor Selection Rules

Metaphor selection is the most intellectually demanding part of icon design because it requires simultaneous understanding of visual form, cultural convention, and cognitive load.

- **The four-tier metaphor hierarchy:** Apply in order: (1) Concrete literal -- the icon directly depicts the concept as a physical object (envelope for email, trash can for delete, magnifying glass for search). (2) Concrete functional -- the icon depicts something that performs the function (scissors for cut, paint bucket for fill, funnel for filter). (3) Conventional arbitrary -- the icon has no visual relationship to the concept but is universally understood through learned convention (hamburger menu for navigation, three dots for overflow menu, gear for settings). (4) Abstract metaphorical -- the icon suggests the concept through visual analogy (lightning bolt for speed/power, shield for security, handshake for agreements). Use tier 1 or 2 when available. Use tier 3 when it is established enough that users will not need to read the label to understand it. Use tier 4 only when tiers 1-3 fail and always with an accompanying text label.
- **Digital affordance vs. physical metaphor:** Many digital concepts have no real-world physical counterpart. For these, rely on established digital conventions before inventing abstract metaphors. "Sync" is depicted as circular arrows (convention), not as a server rack (abstract technical). "Cloud storage" is depicted as a cloud with an arrow (convention), not as a data center. The moment you deviate from established digital conventions, the icon requires a label.
- **Metaphor differentiation within a set:** Audit the icon set for metaphor collisions -- cases where two different concepts might be depicted with similar-looking icons. "Share" and "export" are notoriously confused (the share icon with an arrow pointing up was originally an iOS-specific convention now used broadly; the box-with-arrow-right is used for export in web contexts). Document the chosen convention explicitly and note what the icon is NOT used for.
- **Cultural and regional considerations:** The mailbox metaphor for email varies regionally (US-style mailbox with flag vs. European slot mailbox). Hand gesture icons (thumbs up, OK circle, pointing hand) have culturally specific meanings that vary significantly across regions. Currency icons (dollar sign, euro sign) are literal in their regional meaning. Color associations (red for stop/danger in Western contexts; red for luck in East Asian contexts) affect whether a red warning icon works universally. Flag these in the specification if the product is global.
- **Cognitive load and combinability:** Simple icons (1-2 conceptual elements) are universally faster to process than compound icons (3+ elements). A "new document" icon combining a page + a plus sign is at the limit of what reads quickly at 24px. A "shared encrypted document" icon combining a page + a lock + two people silhouettes is too complex -- it will not read at 24px. If an icon concept requires 3+ combined elements to be unambiguous, reconsider whether the icon needs a label or whether the concept should be renamed to something more visually expressible.

---

### Step 7: Define Size Variant Rules

Icons used at multiple sizes are not simply scaled versions of each other. Each size has a different detail budget and different optical properties.

- **The detail budget principle:** At 16px, the live area is 14x14px after 1px padding. At 1px stroke weight, the maximum meaningful detail is approximately 3-4 distinct strokes before the icon becomes visually noisy. At 24px (20x20px live area), the budget is approximately 5-6 strokes. At 48px (44x44px live area), 8-10 strokes. An icon designed at 24px with 6 strokes needs a separate "16px variant" that removes inner details, simplifies curves, and potentially restructures the metaphor slightly to remain recognizable.
- **Stroke weight scaling:** Do not simply proportionally scale stroke weight. The perceptual weight of a stroke relative to the icon's visual mass follows a different curve. For a set with 1.5px stroke at 24px: use 1px at 16px (not 1px -- the proportional scale), use 2px at 32px and 48px. The progression 1px / 1.5px / 2px covers the full UI size range for most icon sets.
- **16px specific constraints:** No diagonal strokes thinner than 1.4px (they render lighter than horizontal/vertical strokes at the same weight due to anti-aliasing -- this is the Xiaolin Wu anti-aliasing effect). No gap smaller than 2px between parallel elements. Circular shapes should be on a whole-pixel diameter (avoid 15px or 13px diameter circles -- use 14px or 12px). Reduce corner radius to 1px or 0px.
- **48px and above:** At 48px, icons begin to function as illustrations and can support interior details, subtle line weight variation, and two-tone treatment without legibility risk. However, the same grid proportions must be maintained -- a 48px icon should feel like a proportionally scaled version of the 24px icon with more detail, not a fundamentally different visual treatment.

---

### Step 8: Compile and Document the Icon Design Guide

The guide itself must be actionable for a designer who was not in the room when decisions were made.

- **Cover every parameter in the specification tables** -- grid dimensions, live area, keyline shapes, stroke weight, stroke cap, stroke join, corner radius, minimum feature size, minimum counter space, perspective, direction convention, metaphor taxonomy.
- **Include a metaphor guide table** listing every planned icon with its concept name, metaphor type, a brief plain-English description of what the icon depicts, and any notes about what it must be distinguished from.
- **Document exceptions explicitly** -- if three icons in a 40-icon set break the corner radius rule (arrows, circles, and a specific badge icon), list each one by name with the reason.
- **Include a "Do NOT" list** -- common failure modes for this specific set, not generic icon design advice.
- **Specify naming convention** using the format `category-concept[-variant]` (e.g., `nav-home`, `action-edit`, `status-success-filled`, `object-calendar-16`). Names must be lowercase, hyphenated, no spaces, no special characters.

---

## Output Format

```
## Icon Design Guide: [Product/Set Name]

### Overview
- **Icon count:** [number and category breakdown]
- **Primary grid size:** [px x px]
- **Style:** [outlined / filled / duotone / mixed]
- **Target sizes:** [list with context for each size]
- **Platform context:** [web / iOS / Android / cross-platform]
- **Export format:** [SVG / PNG / component / PDF]

---

### Grid Specification
| Property              | Value           | Notes                                                   |
|-----------------------|-----------------|---------------------------------------------------------|
| Canvas size           | [X]x[X]px       | Base design grid                                        |
| Live area             | [X]x[X]px       | Content boundary (canvas minus padding)                 |
| Padding               | [X]px each side | Breathing room and cross-icon optical alignment         |
| Keyline: circle       | [X]px diameter  | For circular/symmetric icons                            |
| Keyline: square       | [X]x[X]px       | For boxy/object icons                                   |
| Keyline: portrait     | [X]x[X]px       | For tall icons (person, document, notification)         |
| Keyline: landscape    | [X]x[X]px       | For wide icons (toolbar actions, media controls)        |
| Internal grid unit    | [X]px           | Modular snap unit inside the live area                  |

---

### Stroke and Fill Specification
| Property              | Value                   | Notes                                                 |
|-----------------------|-------------------------|-------------------------------------------------------|
| Stroke weight         | [X]px                   | Single value, consistent across ALL icons             |
| Stroke cap            | [Round / Butt / Square] | [rationale tied to brand personality]                 |
| Stroke join           | [Round / Miter / Bevel] | [must match cap style for consistency]                |
| Miter limit           | [4 / other]             | Controls acute angle join behavior                    |
| Exterior corner radius| [X]px                   | All non-semantic corners                              |
| Interior corner radius| [X]px                   | Calculated: exterior radius minus stroke weight       |
| Minimum feature size  | [X]px                   | Smallest detail at this grid size                     |
| Minimum counter space | [X]px                   | Gap between parallel strokes or filled shapes         |
| Fill opacity (duotone)| [X]%                    | Secondary layer opacity (if duotone)                  |

---

### Style Rules
1. [Rule about stroke weight enforcement]
2. [Rule about keyline usage for optical balance]
3. [Rule about detail budget per icon]
4. [Rule about gap/counter space enforcement]
5. [Rule about CSS currentColor or color token usage]
6. [Rule about filled vs. outlined state usage]

---

### Perspective and Orientation
- **Projection:** [Flat 2D / Front 3D / Isometric]
- **Directional icons:** Face [right / left] -- rationale: [LTR/RTL context]
- **Object orientation:** [Face-on / Canonical 45-degree angle / Profile]
- **Optical center offset:** [0px / 0.5px down] -- adjust per icon as needed

---

### Metaphor Guide
| Concept          | Metaphor Type    | Icon Description                           | Distinguish From       |
|------------------|------------------|--------------------------------------------|------------------------|
| [concept]        | [concrete/conventional/abstract] | [plain-English description]  | [confusable concept]   |

---

### Size Variants
| Size   | Canvas | Live Area | Stroke | Ext. Radius | Int. Radius | Detail Level        |
|--------|--------|-----------|--------|-------------|-------------|---------------------|
| 16px   | 16x16  | 14x14     | [X]px  | [X]px       | [X]px       | Simplified variant  |
| 24px   | 24x24  | 20x20     | [X]px  | [X]px       | [X]px       | Standard            |
| 32px   | 32x32  | 28x28     | [X]px  | [X]px       | [X]px       | Standard            |
| 48px   | 48x48  | 44x44     | [X]px  | [X]px       | [X]px       | Enhanced detail     |

---

### Naming Convention
- **Format:** `[category]-[concept][-variant][-size]`
- **Categories:** `[list categories for this set]`
- **Examples:** `[realistic name examples for this set]`
- **Rules:** lowercase, hyphenated, no spaces, no special characters, no version numbers

---

### Exception Registry
| Icon Name         | Rule Broken              | Reason                            | Approved Alternative Value |
|-------------------|--------------------------|-----------------------------------|---------------------------|
| [icon name]       | [which rule]             | [semantic or optical reason]      | [actual value used]        |

---

### Do NOT
- [Anti-pattern specific to this set's style]
- [Anti-pattern specific to this set's platform]
- [Anti-pattern specific to this set's size constraints]
- [Anti-pattern specific to metaphor risks in this domain]
- [Anti-pattern about color/theme compatibility]
```

---

## Rules

1. **Stroke weight is a single value per grid size, no exceptions.** A 1.5px icon next to a 2px icon in the same bar or list is perceived as broken, even if both are individually well-designed. If a specific icon genuinely requires a heavier or lighter stroke for optical balance (a very thin element like an asterisk vs. a very heavy element like a filled shield), achieve balance by adjusting the icon's bounding shape to the appropriate keyline, not by changing stroke weight.

2. **All icons in a set are designed on the same canvas size.** Never design some icons at 24px and others at 20px in the same set because "this one fits better." All icons go on the same grid. If an icon looks too small on the 24px grid, use a larger keyline -- expand to the circle keyline instead of the square keyline. If it still looks too small, the metaphor is too complex.

3. **Corner radius must be applied programmatically, not visually estimated.** "Round it a little" is not a specification. Every non-semantic corner uses exactly the defined radius value. The specification must state the exact pixel value and list every exception by icon name.

4. **Live area padding is a minimum, not a target.** Some icons naturally have visual breathing room within the live area. Padding ensures no icon bleeds to the canvas edge -- it does not mean every icon must fill the live area to its boundary. A small icon like a bullet or dot may occupy only 8x8px within a 20x20px live area, and this is correct.

5. **Metaphors must survive label removal.** Every icon in a UI set should be tested in isolation, without any adjacent text label, to verify it communicates something intelligible. If an icon conveys nothing without its label, either the metaphor must be improved or the icon must always be deployed with a label (which is a design decision that must be documented, not discovered accidentally).

6. **The 16px variant is a separate design, not a scale.** Exporting a 24px icon and rendering it at 16px is not a 16px icon -- it is a blurry 24px icon. The 16px variant requires separate review of every anchor point for pixel alignment, separate review of whether interior details remain legible, and explicit simplification of any element below the 2px minimum feature size.

7. **Outlined and filled icons must coexist at the same visual weight.** In sets that use outlined icons for default state and filled icons for selected/active state, the filled version of every icon must appear visually similar in mass to its outlined counterpart. This usually means the filled variant is slightly smaller (occupying 90% of the keyline area rather than 100%) to compensate for the additional visual mass added by the fill.

8. **No hardcoded colors in a CSS-deployed SVG icon set.** All SVG strokes and fills must reference `currentColor` so that icon color is controlled by CSS, not baked into the asset. This is mandatory for theme compatibility (dark mode, high contrast mode, hover/focus states). Exceptions: multi-color icons used purely as decoration (not interactive) may hardcode colors, and this must be explicitly noted in the specification.

9. **The metaphor guide must include "Distinguish From" notes for any concept with a known visual collision.** "Share" vs. "export," "delete" vs. "remove," "close" vs. "clear," "settings" vs. "preferences" -- these pairs are routinely confused. The specification must explicitly document which metaphor is used for which concept and flag the distinction.

10. **Diagonal stroke anti-aliasing is a real constraint at small sizes.** At 16px and below, diagonal strokes at 45 degrees will render at a slightly lighter visual weight than equivalent horizontal and vertical strokes due to anti-aliasing sampling. Compensate by increasing diagonal stroke weight by 10-15% OR by restricting icon designs at 16px to primarily orthogonal (horizontal and vertical) elements. If diagonals are used, test actual rendered output, not vector preview.

---

## Edge Cases

### Pixel-Perfect Rendering at 16px

The 16px grid is the hardest size to design for. Every design decision that worked at 24px must be re-examined.

At 16px, the practical live area is 14x14px after 1px padding. A 1px stroke occupies 7% of the canvas height -- already proportionally heavier than the same stroke at 24px. Half-pixel anchor points cause anti-aliasing artifacts that make clean strokes look fuzzy at actual pixel rendering size (as opposed to vector preview, which shows crisp sub-pixel shapes). Every anchor point must be on a whole-pixel coordinate, not 0.5px, not 0.33px.

Specific adaptations required for a 16px variant: remove any interior detail that is thinner than 2px at this size; convert open paths with gaps narrower than 2px into solid shapes; increase corner radius to 0px or 1px (because at 16px, a 2px radius on a 14px shape looks visually heavy); test diagonal strokes at actual screen resolution before finalizing. Some icons need a fundamentally different approach at 16px -- a house icon with an interior window detail at 24px becomes a house silhouette without the window at 16px.

---

### Very Large Icon Sets (100+ Icons)

Sets above 60-80 icons will develop inconsistencies unless governance structures are in place from the start.

Category organization: Define 5-8 categories and assign every icon to one category before drawing begins. Common categories for product UI: Navigation, Actions, Objects, Status, Media, Communication, Data. No icon should exist without a category.

Naming: Use the convention `category-concept[-modifier]` strictly -- `action-edit`, `action-edit-filled`, `status-success`, `status-success-sm`. Do not use `icon-` as a prefix (redundant). Do not use version numbers in names (`edit-v2` is a version control failure, not a naming convention).

Duplication audit: Before adding any new icon, search the existing set for visual or semantic overlap. "Plus" and "add" should not both exist. "Trash" and "delete" should be the same icon. Create a canonical concept list before assigning metaphors to prevent two designers independently solving the same concept differently.

Visual consistency review: At every 20-icon milestone, export the entire set as a single reference sheet (10 icons per row at 100% grid size) and review for weight drift, perspective drift, and metaphor confusion. Problems caught at 60 icons are fixable; problems caught at 140 icons require a partial redesign.

---

### Bidirectional Interface Support (RTL/LTR)

Not all icons mirror when the interface switches from LTR to RTL layout. This is a nuanced area with specific rules established by platform guidelines.

Icons that SHOULD be mirrored for RTL: directional arrows (right-arrow becomes left-arrow), navigation arrows (forward becomes back), icons depicting objects with an implicit reading direction (document pages, speaker/audio directing right), and any icon showing a sequence progressing left-to-right.

Icons that should NOT be mirrored for RTL: checkmarks, circular arrows (refresh/sync), warning triangles, progress indicators, icons representing physical objects with fixed chirality (scissors -- left-handed scissors are a different product, not an RTL accommodation), and clock-related icons (clocks are conventionally read the same in all cultures).

The RTL specification must be included in the icon guide as a per-icon annotation, not as a blanket rule. Each icon in the set must be marked: "mirror in RTL," "do not mirror," or "review."

---

### Animated Icon Micro-Interactions

Icon animation -- the hamburger-to-X transition, the loading spinner, the success checkmark reveal -- requires extending the base specification with motion parameters.

Define animation as: (1) start state (which matches the static icon specification exactly), (2) end state (which also matches the static specification), (3) keyframes for any intermediate states, (4) duration in milliseconds (UI micro-interactions: 150-300ms; loops: 1200-2000ms per cycle), and (5) easing curve (ease-out for elements entering the screen, ease-in for elements leaving, ease-in-out for transitions between states, linear for continuous loops like spinners).

Animation must stay within the icon canvas. No element should translate outside the grid boundary during animation. The stroke weight, corner radius, and all static parameters apply to every keyframe, not just the start and end states.

For CSS/SVG animation: specify whether the animation uses CSS keyframes, SVG SMIL (deprecated in some browsers), or a JavaScript animation library. This affects how the specification is structured and handed off to developers.

---

### Multi-Theme Icon Sets (Dark Mode, High Contrast)

Icons must work in at least three visual contexts: light theme, dark theme, and high-contrast/accessibility mode.

For light theme: icons are typically dark (neutral-700 to neutral-900 on a light background) with no fill except in filled variants.

For dark theme: icons invert to light (neutral-100 to neutral-300 on a dark background). If icons use `currentColor` in SVG and inherit text color from the CSS context, this is handled automatically. If icons have hardcoded values, dark theme variants must be separately exported.

For high-contrast mode (Windows High Contrast, forced-colors media query in CSS): icons must remain recognizable when all colors are replaced by system-defined colors (white on black or black on white, no grays). This means icons cannot rely on opacity-based secondary layers (duotone secondary layers will disappear). Icons must communicate their full meaning through primary stroke/fill alone. Test every icon with a forced-colors stylesheet applied.

Accent-colored icons (a red error icon, a green success icon) need separate review at high contrast -- the meaning carried by color must also be carried by shape (error = X or triangle with exclamation, not just red circle).

---

### Icon Reuse Across Multiple Products or Brand Families

When an icon set must serve multiple products (a suite of B2B apps sharing a design system) or multiple brand expressions (same product, different white-label skins), the specification must define what is variable and what is fixed.

Fixed parameters: metaphor, canvas size, live area, keyline shapes, relative stroke weight percentage, internal grid modularity. These ensure icons remain recognizable and proportionally consistent across products.

Variable parameters: absolute stroke weight (may increase or decrease by 0.5px for a "heavier" vs. "lighter" brand personality), corner radius (may decrease for a more serious enterprise brand vs. increase for a more playful consumer product), color (controlled by CSS token, not by icon specification).

Document the "variability matrix" explicitly -- which parameters can be adjusted per brand skin, within what range, and which parameters are locked. This prevents the scenario where a partner team modifies the icons in ways that break cross-product consistency.

---

### Icons for Non-Standard Contexts (Maps, Data Tables, Status Badges)

Some icon use cases fall outside the standard UI toolbar/sidebar context and require modified specifications.

Map and wayfinding icons: Must remain legible at sizes as small as 8-12px when embedded in cartographic contexts. Use filled/solid style only (outlined icons at 8px are illegible). Simplify to 1-2 shapes maximum. Color carries semantic meaning (red = danger, green = safe, blue = water), so design must account for color-blind users -- pair color with shape differentiation.

Data table row icons: Typically 12-16px, inline with text. Must not exceed the text line height visually. Use 1px stroke or filled style. Align to text baseline, not to a separate vertical center. Horizontal padding between icon and text: 4-6px.

Status badge icons: Often displayed at 8-10px inside a colored badge (a green circle with a checkmark). At this size, the icon is a symbolic accent, not a primary communication element -- the badge color carries the meaning. Design for maximum simplicity: a single mark (check, X, exclamation, dot) with no secondary detail.

---

## Example

**Input:** "We're building a project management SaaS application. Need an icon design guide for approximately 40 icons that will appear in the main navigation sidebar (24px), inline in data table rows (16px), and on the empty state feature cards (48px). We want a clean, professional style -- not playful, not brutalist. We already have a design token system where `radius-sm` is 2px and `radius-md` is 4px. Our brand's primary text color is `color-text-primary` (near-black in light theme, near-white in dark theme). The app is for a global audience including RTL markets."

---

**Output:**

## Icon Design Guide: ProjectFlow SaaS

### Overview
- **Icon count:** ~40 icons across 5 categories (Navigation, Actions, Objects, Status, Data)
- **Primary grid size:** 24x24px
- **Style:** Outlined (stroke-based) for default state; filled for active/selected states
- **Target sizes:** 16px (data table inline), 24px (sidebar navigation, primary UI), 48px (empty state feature cards)
- **Platform context:** Web application, cross-browser SVG, responsive layout
- **Export format:** SVG with `currentColor` for all strokes and fills; component integration for design tool library
- **Audience note:** RTL mirroring required -- per-icon annotations in the metaphor guide indicate which icons mirror

---

### Grid Specification
| Property              | Value         | Notes                                                           |
|-----------------------|---------------|-----------------------------------------------------------------|
| Canvas size           | 24x24px       | Base design grid for all primary icons                         |
| Live area             | 20x20px       | 2px padding on each side                                       |
| Padding               | 2px each side | Ensures icons never touch canvas edge; aids optical alignment   |
| Keyline: circle       | 20px diameter | Circular/symmetric icons (avatar, loading spinner, status dot)  |
| Keyline: square       | 18x18px       | Object icons (folder, document, calendar, checkbox)             |
| Keyline: portrait     | 18x20px       | Tall icons (person/member, filter panel, notification bell)     |
| Keyline: landscape    | 20x18px       | Wide icons (toolbar actions, media controls, horizontal arrows) |
| Internal grid unit    | 2px           | All internal spacing snaps to 2px multiples                     |

---

### Stroke and Fill Specification
| Property               | Value     | Notes                                                            |
|------------------------|-----------|------------------------------------------------------------------|
| Stroke weight          | 1.5px     | Consistent across all 40 icons at the 24px grid                 |
| Stroke cap             | Round     | Professional without being playful; consistent with rounded UI   |
| Stroke join            | Round     | Matches round caps; prevents sharp miter artifacts at joints     |
| Miter limit            | 4         | Fallback only; round joins supersede in practice                 |
| Exterior corner radius | 2px       | References `radius-sm` design token; consistent with UI controls |
| Interior corner radius | 0.5px     | Calculated: 2px exterior minus 1.5px stroke weight              |
| Minimum feature size   | 2px       | Smallest detail at 24px grid (e.g., badge dot, gap in dashes)   |
| Minimum counter space  | 2px       | Gap between parallel strokes or enclosed open shapes             |
| Fill opacity (duotone) | N/A       | Not used in this set; filled variants use 100% opacity solid fill|
| Color reference        | `currentColor` | All strokes/fills inherit CSS text color; no hardcoded hex   |

---

### Style Rules
1. Stroke weight is 1.5px at 24px canvas with round caps and round joins -- no individual icon may deviate from this. If an icon reads as too light (overly thin metaphor), the icon design must be revised to use a denser form, not a heavier stroke.
2. Every icon is optically centered using the appropriate keyline. A folder icon (boxy) is built to the 18x18px square keyline; an avatar/person icon (taller than wide) is built to the 18x20px portrait keyline. Keyline selection must be documented per icon in the metaphor guide.
3. No icon contains more than 3 enclosed shapes at the 24px grid. Complexity beyond 3 enclosed shapes will not survive the 16px simplification step and signals an over-complex metaphor.
4. All gaps between parallel stroke elements are a minimum 2px. This applies to dashes, strikethrough lines, hatching, and any compound shape with internal cutouts.
5. SVG export: All `stroke` and `fill` attributes are set to `currentColor`. Opacity variations (background layers, badge backgrounds) use a wrapping `<g>` element with `opacity` attribute rather than a separate color value, ensuring single-color theme compatibility.
6. Filled variants for active/selected states: The filled version of each outlined icon reduces the occupying area to 90% of the keyline to compensate for added visual mass. A filled folder (18x18 keyline at 24px) is drawn at approximately 16x16px effective fill area to match the optical weight of its outlined counterpart.

---

### Perspective and Orientation
- **Projection:** Flat 2D -- no perspective, no drop shadows, no gradients, no 3D depth cues
- **Directional icons:** Face right for LTR layouts (arrow-right, forward, send, export, expand). RTL mirroring per the annotation column in the Metaphor Guide.
- **Object orientation:** Face-on for all planar objects (documents, folders, calendar pages). Canonical 45-degree upper-right angle for tool metaphors (pencil, wrench, ruler). No arbitrary angles.
- **Optical center offset:** Visually review each icon at 100% render size; icons with heavy top-weighted forms shift 0.5px downward from geometric center. Document per-icon offsets in the exception registry if they exceed 1px.

---

### Metaphor Guide
| Concept           | Keyline    | Metaphor Type   | Icon Description                                      | RTL Mirror? | Distinguish From          |
|-------------------|------------|-----------------|-------------------------------------------------------|-------------|---------------------------|
| Home / Dashboard  | Square     | Concrete        | Simple house outline, pitched roof, no chimney        | No          | -- |
| Projects          | Portrait   | Concrete        | Stacked layers / three rectangles staggered            | No          | Documents (single page)   |
| Tasks / To-do     | Square     | Concrete        | Checkbox with checkmark (rounded corners, 2px radius) | No          | Checkmark-only (no box)   |
| Calendar          | Square     | Concrete        | Rect with top tab bar and 2x2 dot grid interior       | No          | Clock (circular)          |
| Notifications     | Portrait   | Concrete        | Bell shape with small horizontal base bar             | No          | Alert triangle (status)   |
| Settings          | Circle     | Conventional    | 6-tooth gear, centered on circle keyline              | No          | Preferences (same icon)   |
| Search            | Landscape  | Concrete        | Magnifying glass, circle left + handle extending lower-right 45° | No | Filter (funnel) |
| Filter            | Portrait   | Concrete        | Downward-narrowing funnel/triangle with 3 horizontal lines | No    | Sort (up/down arrows)     |
| Sort              | Portrait   | Concrete        | Two vertical arrows pointing opposite directions      | Yes         | Filter (funnel)           |
| Add / Create      | Circle     | Conventional    | Plus sign, optionally in circle for action clarity    | No          | Expand (different context)|
| Edit              | Landscape  | Concrete        | Pencil at 45° upper-right angle                       | Yes         | Write (same icon, document context) |
| Delete / Remove   | Square     | Concrete        | Trash can, open lid variant for delete action         | No          | Archive (box with down arrow) |
| Archive           | Landscape  | Concrete        | Open box with downward arrow entering it              | No          | Delete (trash can)        |
| Close / Dismiss   | Square     | Conventional    | X mark, two lines crossed at 45°                     | No          | Delete (trash can context)|
| Save              | Square     | Conventional    | Floppy disk outline (established digital convention)  | No          | Download (arrow downward) |
| Download          | Portrait   | Concrete        | Downward arrow with horizontal base line beneath      | No          | Save (floppy disk)        |
| Upload            | Portrait   | Concrete        | Upward arrow with horizontal base line beneath        | No          | Export (box + arrow)      |
| Export            | Landscape  | Concrete        | Box outline with arrow pointing right-upward out of it | Yes        | Share (arrow-up for mobile), Upload |
| Share             | Portrait   | Conventional    | Node + two branching lines (network share icon)       | No          | Export (box + arrow)      |
| Member / User     | Portrait   | Concrete        | Head circle + shoulder arc, gender-neutral silhouette | No          | Team (multiple people)    |
| Team              | Landscape  | Concrete        | Two person silhouettes overlapping slightly           | Yes         | Member (single person)    |
| Message / Comment | Landscape  | Concrete        | Speech bubble with tail at lower-left                 | Yes         | Email (envelope)          |
| Email / Inbox     | Landscape  | Concrete        | Envelope outline, flap closed                         | No          | Message (speech bubble)   |
| Attachment        | Portrait   | Concrete        | Paperclip, single loop with descending stem           | No          | Link (chain links)        |
| Link              | Landscape  | Concrete        | Two chain links connected horizontally                | No          | Attachment (paperclip)    |
| Duplicate / Copy  | Square     | Concrete        | Two overlapping rectangles, top-right offset          | No          | Paste (clipboard)         |
| Move              | Square     | Abstract        | Four-directional arrow (cross with arrowheads)        | No          | Drag handle (dots)        |
| Drag Handle       | Portrait   | Conventional    | Six dots in 2x3 grid                                  | No          | More options (three dots) |
| More Options      | Portrait   | Conventional    | Three horizontal dots (web convention)                | No          | Drag handle (six dots)    |
| Status: Success   | Circle     | Conventional    | Filled circle + white checkmark interior              | No          | Task complete (checkbox)  |
| Status: Error     | Circle     | Conventional    | Filled circle + white X interior                      | No          | Close button (standalone X)|
| Status: Warning   | Landscape  | Conventional    | Triangle with exclamation mark interior               | No          | Error (circle)            |
| Status: Info      | Circle     | Conventional    | Filled circle + white lowercase "i" interior          | No          | Notification (bell)       |
| Status: In Progress | Circle   | Conventional    | Partial circle arc (loading/progress indicator style) | No          | Loading spinner (animated)|
| Collapse / Chevron Down | Landscape | Conventional | V-shape pointing downward, 1.5px stroke           | No          | Expand (opposite direction)|
| Expand / Chevron Right  | Portrait  | Conventional | V-shape pointing right                            | Yes         | Forward arrow (with stem) |
| Overflow / Ellipsis | Landscape | Conventional  | Three horizontal dots, same as More Options           | --          | Duplicate of More Options -- same icon |
| Document / File   | Portrait   | Concrete        | Rect with folded upper-right corner                   | No          | Project (stacked layers)  |
| Folder            | Landscape  | Concrete        | Folder shape with rounded tab at upper-left           | No          | Project (stacked layers)  |
| Priority / Flag   | Portrait   | Concrete        | Flag on a vertical pole                               | Yes         | Bookmark (no pole)        |
| Bookmark          | Portrait   | Concrete        | Pennant/ribbon shape with V notch at bottom           | No          | Flag (has pole)           |

---

### Size Variants

| Size   | Canvas  | Live Area | Stroke | Ext.
