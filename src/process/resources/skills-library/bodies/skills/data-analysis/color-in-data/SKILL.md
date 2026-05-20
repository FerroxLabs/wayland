---
name: color-in-data
description: |
  Applies color to data visualizations by selecting sequential, diverging, or categorical palettes based on data type. Specifies hex codes for each element, ensures colorblind accessibility with WCAG contrast ratios, and documents usage rules.
  Use when the user needs to choose colors for charts, dashboards, or data-driven graphics.
  Do NOT use for brand color palette design (use color-palette-design in the design category), chart type selection (use chart-type-selector), or chart formatting beyond color (use chart-formatting).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-visualization design accessibility"
  category: "data-analysis"
  subcategory: "data-visualization"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Color In Data

## When to Use

**Use this skill when:**
- A user needs to assign colors to a chart, dashboard, map, or data-driven graphic and must decide between palette types, specific hex values, or accessibility requirements
- A user asks how to make their visualization colorblind-friendly, or has received feedback that their chart is hard to read for some users
- A user is encoding meaning into color -- direction (up/down, positive/negative), magnitude (low/high), or category membership -- and needs a principled approach
- A user is building a multi-chart dashboard and needs a consistent color system that works across bar charts, line charts, scatter plots, and maps simultaneously
- A user is designing a choropleth map, heat map, diverging heatmap, or bivariate map and needs to select perceptually uniform color scales
- A user is choosing colors for a highlight pattern (one element stands out, all others recede) or a comparison pattern (two specific data series are contrasted against each other)
- A user needs to annotate a visualization with colored reference lines, threshold bands, or anomaly markers and must ensure those annotation colors don't conflict with the data encoding

**Do NOT use when:**
- The user is designing a brand color palette with primary, secondary, and accent colors (use `color-palette-design` in the design category -- brand color systems follow different rules than data encoding systems)
- The user is selecting which chart type to use for their data (use `chart-type-selector` -- chart type and color are separate decisions, and color cannot compensate for a mismatched chart type)
- The user wants to format axis labels, gridlines, tick marks, chart titles, or annotation typography (use `chart-formatting` -- typography and structural formatting are distinct from data encoding)
- The user is planning an infographic where illustration, icons, or decorative color dominate (use `infographic-planning` -- infographic color is primarily aesthetic, not data-driven)
- The user is asking about color in UI design, button states, or interactive component states (use `ui-component-design` -- semantic UI color like error/success states operates under different constraints than continuous data encoding)
- The user wants to pick a chart type to replace color encoding entirely (use `chart-type-selector` to first confirm whether color is the right encoding channel for the data)

---

## Process

### Step 1: Identify What Color Is Actually Encoding

Before choosing any palette, establish the precise data-to-color mapping. This determines everything downstream.

- Ask: "What does color represent in this chart?" -- The answer will be one of four things: (a) a quantitative value on a single scale (temperature, revenue, density), (b) a deviation from a reference point (variance from budget, z-score, profit/loss), (c) group membership with no implied order (product line, country, department), or (d) emphasis -- one element highlighted, all others muted
- Distinguish between **data color** and **annotation color**: data colors encode variables; annotation colors (reference lines, threshold bands, callout arrows) must not mimic any data color hue at similar saturation
- Determine whether color is the **primary** encoding channel or a **redundant** channel: if the x-axis already shows the category name on a bar chart, color is redundant reinforcement -- this gives more flexibility; if color is the only way to distinguish elements (as in a multi-line chart with overlapping lines), accessibility constraints are stricter
- Find out how many distinct visual states the color system must communicate: for sequential palettes, count the number of needed quantization steps; for categorical palettes, count the categories exactly -- the number drives palette structure completely
- Ask whether the visualization will appear on screen only, in print (CMYK), or both -- screen-optimized hex values can shift significantly in CMYK print output, requiring separate palette specifications

### Step 2: Select the Correct Palette Architecture

**Sequential palettes** -- for ordered, one-directional quantitative data:
- Use when data has a natural minimum and maximum with meaningful gradation between them: population density, page load time, customer satisfaction score, revenue, temperature
- Structure: single hue from low-saturation/high-lightness (low values) to high-saturation/low-lightness (high values); or a multi-hue progression where hue shifts from yellow-green to blue as value increases
- Perceptually uniform options to use as defaults: Blue (#EFF3FF to #08519C), Green (#EDF8E9 to #006D2C), Purple (#F2F0F7 to #54278F), Orange (#FEE6CE to #A63603) -- these sequences follow CIELAB perceptual uniformity so equal data steps look like equal visual steps
- For continuous data (gradient), specify the two endpoint hex codes and the interpolation space -- use CIELAB or OKLCH interpolation, never RGB interpolation (RGB mid-blend creates perceptual dead zones, particularly through the gray zone between blue and yellow)
- For discrete steps (choropleth maps), use 5-7 classes maximum; 3 classes if the data distribution is heavily skewed or the audience is non-technical
- Never use black as the high-value endpoint on a sequential scale -- it visually reads as "missing data" or "error" to most audiences; use dark navy, dark teal, or dark plum instead

**Diverging palettes** -- for ordered data with a meaningful, interpretable midpoint:
- Use when the zero, average, mean, or budget target is conceptually important and the audience needs to instantly distinguish "above" from "below": profit vs. loss, deviation from benchmark, correlation coefficients (−1 to +1), Likert scale responses (strongly disagree to strongly agree), temperature anomaly from historical average
- Structure: two sequential palettes joined at a neutral midpoint -- the two end hues must be maximally distinct under all color vision deficiencies
- Best-validated diverging combinations: Blue (#2166AC) -- White (#F7F7F7) -- Red (#B2182B); Blue (#4393C3) -- White -- Orange (#D6604D); Purple (#762A83) -- White -- Green (#1B7837); Teal (#018571) -- White -- Brown (#A6611A)
- The midpoint must be light gray (#F7F7F7), white, or near-white -- never a saturated hue at the midpoint, as saturated middle values create false visual emphasis on the neutral region
- When the data is strongly asymmetric (most values are above zero with a long left tail of negatives), use an asymmetric diverging palette: compress the steps on the short side and expand them on the long side
- Specify the midpoint value explicitly in the documentation: "White (#F7F7F7) = $0 revenue," not just "White = neutral"

**Categorical palettes** -- for nominal data with no inherent order:
- Use when color distinguishes group membership: product line, geographic region, experimental condition, customer segment, survey cohort
- Structure: hues must be maximally spaced in perceptual hue angle around the HSL color wheel, at consistent saturation (50-65%) and lightness (45-60%) -- this ensures no single category appears more "important" than others by accident
- Strict maximum: 7 colors for screen, 5 colors for print. Human preattentive color discrimination reliably fails beyond 7 distinct hues when those hues are used simultaneously at small sizes
- A validated 7-color accessible categorical palette (IBM Carbon Design System-derived, Okabe-Ito compatible): Blue (#648FFF), Orange (#FE6100), Teal (#009E73), Gold (#FFB000), Purple (#785EF0), Red (#DC267F), Gray (#767676) -- these are distinguishable in protanopia, deuteranopia, and tritanopia
- The Okabe-Ito 8-color palette is the most widely validated colorblind-safe categorical palette in the scientific literature: Black (#000000), Orange (#E69F00), Sky Blue (#56B4E9), Bluish Green (#009E73), Yellow (#F0E442), Blue (#0072B2), Vermillion (#D55E00), Reddish Purple (#CC79A7)
- Avoid semantic color conflict: do not use red for a category that is not inherently "bad" or dangerous; do not use green for a category that is not inherently "good" or safe -- semantic color associations override categorical reading in audiences

**Highlight/emphasis palettes** -- for single-element focus:
- Use when the visualization argues a specific point: "This one product outperformed all others," "This month was anomalous"
- Structure: one saturated focal color (the highlighted element) plus one muted, desaturated neutral (all other elements) -- typically a medium-saturation hue at 60-70% lightness for the highlight and a neutral gray (#BEBEBE or #D9D9D9) for the background elements
- The highlight color should carry semantic meaning when possible: use orange or blue for neutral emphasis, red for danger/loss, green for success/growth
- Do not use more than two levels of emphasis -- "primary highlight" and "everything else" -- adding a "secondary highlight" introduces ambiguity about the hierarchy

### Step 3: Generate the Specific Color Set With Full Specifications

For every color in the palette, specify all of the following -- partial specification creates ambiguity in implementation:

- **Hex code** (6-digit, e.g., #4682B4) -- the authoritative specification
- **RGB triplet** (e.g., 70, 130, 180) -- for software tools that require RGB input
- **HSL values** (e.g., H:207°, S:44%, L:49%) -- for making systematic adjustments to saturation or lightness while preserving hue
- **CMYK approximation** if print output is required (e.g., C:61%, M:28%, Y:0%, K:29%) -- note that CMYK equivalents are approximations and may vary by print profile
- **Human-readable name** -- for communication with non-technical stakeholders ("Steel Blue," not "#4682B4," in the presentation to the executive team)
- **Data assignment** -- exactly which data value, category, or range this color represents
- **Text overlay specification** -- whether white (#FFFFFF) or near-black (#1A1A1A) text on this background meets 4.5:1 WCAG AA contrast; calculate this using the relative luminance formula: L = 0.2126R + 0.7152G + 0.0722B where R, G, B are linearized (values ÷ 255, then apply gamma correction: if ≤ 0.04045, divide by 12.92; otherwise, ((value + 0.055) / 1.055) ^ 2.4)

For sequential and diverging palettes, also specify:
- The interpolation endpoints and midpoint hex codes
- The number of discrete quantization steps if discretizing a continuous scale
- The data value mapped to each step's lower and upper bound

### Step 4: Verify Colorblind Accessibility

Color vision deficiency affects approximately 8% of males and 0.5% of females of Northern European descent. Verification is non-optional.

- **Deuteranopia** (green receptor absent): affects ~5% of males; red and green appear similar brownish-yellow; a purely red-green palette is unreadable -- verify by simulating deuteranopia using the Brettel-Viénot-Mollon algorithm or by desaturating and shifting hues toward yellow-brown
- **Protanopia** (red receptor absent): affects ~1% of males; red appears dark, nearly black, while green appears similar to deuteranopia; red data colors lose both their hue and their brightness cue -- verify that red-colored elements are not distinguished from dark elements by brightness alone
- **Tritanopia** (blue receptor absent): affects ~0.003% of the population; blue and yellow appear similar; blue-yellow diverging palettes are compromised -- use Blue-White-Red or Purple-White-Green for maximum safety
- **Achromatopsia** (complete color blindness): extremely rare (~0.003%); design as if color is entirely unavailable -- this means every data element must be distinguishable by position, shape, pattern, or label alone, with color as pure reinforcement

**Verification method without simulation software:**
- Convert each palette color to grayscale: Luminance = 0.299R + 0.587G + 0.114B (where R, G, B are 0-255 integers)
- If two colors have luminance values within 40 points of each other, they may appear identical or nearly identical in grayscale and likely conflict in some form of color vision deficiency
- Check specifically that the two hues used in any diverging palette have clearly distinct grayscale luminance values -- this is the single most common failure point

**Alternative encoding requirements:**
- Color must never be the only differentiating channel in any chart that will be published, printed, or shared with a general audience
- On line charts: pair each line color with a distinct marker shape (circle, square, triangle, diamond, cross) at data points
- On bar charts: pair color with direct value labels on or near each bar, or use pattern fills (hatch, cross-hatch, dot) in addition to fill color
- On maps: include a graduated symbol layer or add numeric labels to regions, especially in the five most critical value zones
- On scatter plots: pair color with shape encoding -- the combination of hue + shape encodes two categorical variables and survives all CVD types

### Step 5: Verify WCAG Contrast Ratios

WCAG 2.1 specifies contrast requirements that apply directly to data visualization text elements and large color blocks:

- **4.5:1** minimum contrast ratio for normal text (data labels under 18pt/24px, axis labels, legend text, tooltips)
- **3:1** minimum for large text (chart titles over 18pt, large header values) and for non-text graphical elements (bars, lines, shapes where their boundary conveys meaning)
- **7:1** for AAA-level accessibility, required in some government and healthcare publication standards

**Contrast ratio calculation:**
- Contrast Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color's relative luminance and L2 is the darker color's relative luminance
- A white background (#FFFFFF) has luminance 1.0; pure black (#000000) has luminance 0.0
- A color with luminance 0.18 on white: (1.0 + 0.05) / (0.18 + 0.05) = 4.57:1 -- just passes AA for text

**Common problem cases:**
- Yellow and gold hues almost always fail against white backgrounds: #FFD700 on #FFFFFF yields approximately 1.7:1 -- never use yellow for text-bearing elements on white
- Medium saturated colors (saturation 50-70%, lightness 50%) typically land at 2:1 to 3.5:1 against white -- they pass for large non-text elements but fail for data labels
- Dark backgrounds change the calculation completely: #4682B4 (Steel Blue) yields about 3.3:1 on white but approximately 5.0:1 on dark navy #0D1B2A

### Step 6: Test the Palette as a System

Individual color correctness is necessary but not sufficient. Test the palette as a complete system:

- **Simultaneous contrast**: Place all palette colors adjacent to each other on the intended background color. Colors that appeared distinct in isolation may appear to merge, shift hue, or create vibration when placed side-by-side. Particularly watch for: red/magenta adjacency (appear to bleed), blue/purple adjacency (appear identical at small sizes), yellow-green/green adjacency (merge at distance)
- **Size scaling test**: What works at full chart size must work at thumbnail size (as in dashboard widgets or presentation slides viewed from 10+ feet). Reduce the palette preview to 200×150px. If any two colors are indistinguishable at that size, they will fail in real use
- **Background compatibility**: Verify the palette on the actual background color of the visualization -- never on white if the dashboard uses a dark gray (#1E1E1E) background. A palette that is beautiful on white often becomes muddy or overly bright on dark backgrounds
- **Print/grayscale test**: Convert the palette to grayscale and confirm that all elements remain distinguishable by value (lightness). This tests both print safety and photocopier/PDF scan survival

### Step 7: Document Usage Rules and Anti-Patterns

The color specification is only complete when the rules for using it correctly are written down:

- Assign each categorical color to a specific named entity -- never leave assignment to the implementer's discretion
- Specify what to do when a new category appears that was not in the original design: is there a designated "overflow" color (typically a neutral gray), or must the entire palette be redesigned?
- State explicitly which colors are semantically fixed (red always means negative, always, without exception) versus which are arbitrary (teal assigned to Product C has no inherent meaning)
- Document the background color the palette was designed for and the minimum padding/spacing between colored elements (to prevent simultaneous contrast interference)
- Specify whether opacity/transparency is permitted: for most data encoding, partial opacity changes the perceived hue and destroys the calibrated accessibility ratios -- specify "use at 100% opacity unless stacking translucent elements in a density plot"

### Step 8: Deliver the Specification in the Structured Format

Compile all outputs from the previous steps into the Output Format defined below. Ensure every field is populated with specific values -- no field should be left as a placeholder or described with a general term.

---

## Output Format

```
## Data Visualization Color Specification

### Palette Summary
- **Palette type:** [Sequential / Diverging / Categorical / Highlight]
- **Color encoding:** [Exact description of what color represents, e.g., "Revenue deviation from 2023 baseline in USD"]
- **Number of colors:** [N]
- **Visualization context:** [Chart type, tool/platform, screen/print, background color]
- **Accessibility target:** [WCAG AA / WCAG AAA / Section 508 / Internal only]

---

### Color Assignments

| # | Name | Hex | RGB | HSL | Assigned To | On-Color Text |
|---|------|-----|-----|-----|-------------|---------------|
| 1 | [name] | #[hex] | [R, G, B] | [H°, S%, L%] | [data value or category] | #[FFFFFF or 1A1A1A] |
| 2 | [name] | #[hex] | [R, G, B] | [H°, S%, L%] | [data value or category] | #[FFFFFF or 1A1A1A] |
| 3 | [name] | #[hex] | [R, G, B] | [H°, S%, L%] | [data value or category] | #[FFFFFF or 1A1A1A] |
[Continue for all colors]

**[For sequential/diverging palettes only]**
- **Low endpoint:** #[hex] = [data value or label]
- **Midpoint (diverging only):** #[hex] = [data value or label, e.g., "$0" or "Average"]
- **High endpoint:** #[hex] = [data value or label]
- **Interpolation space:** [CIELAB / OKLCH / HSL] (note: avoid RGB)
- **Number of discrete steps:** [N, or "continuous gradient"]

---

### Accessibility Verification

#### WCAG Contrast Ratios

| Foreground Color | Background | Luminance Fg | Luminance Bg | Contrast Ratio | WCAG Level | Notes |
|------------------|------------|--------------|--------------|----------------|------------|-------|
| #[hex] [name] | #[bg hex] | [L value] | [L value] | [ratio]:1 | [AA / AA Large / AAA / Fail] | [any caveat] |
[Repeat for every foreground-background pair that appears in the visualization]

#### Colorblind Simulation Results

| Color Pair | Deuteranopia | Protanopia | Tritanopia | Luminance Diff | Safe? |
|-----------|-------------|-----------|-----------|----------------|-------|
| [color A] vs [color B] | [appearance] | [appearance] | [appearance] | [delta L] | [Yes / Conditional / No] |
[Repeat for every pair that must be distinguished]

#### Alternative Encoding Channels
- **Shape:** [e.g., "Line chart markers: circle (Series 1), square (Series 2), triangle up (Series 3)"]
- **Pattern:** [e.g., "Bar fills: solid (Category A), diagonal hatch 45° (Category B), cross-hatch (Category C)"]
- **Label:** [e.g., "Direct value labels on all bars -- color identity redundant"]
- **Position:** [e.g., "Grouped bars with explicit spacing -- position encoding is primary"]

---

### System Test Results
- **Simultaneous contrast issues:** [None identified / describe any problem and resolution]
- **Small size test (200×150px):** [All colors distinct / list any pairs that merge]
- **Grayscale test:** [List grayscale luminance values for each color and confirm distinctness]
- **Background compatibility:** [Confirmed on [color] background / list any issues]

---

### Usage Rules

1. **Category assignment is fixed:** [Color name] always represents [category] -- reassignment is not permitted across views or reports
2. **Overflow rule:** If a [N+1]th category is added, use #[hex] ([name]) as the overflow color -- do not add a new hue
3. **Opacity restriction:** All data colors used at 100% opacity. Transparency permitted only for [specify exception, e.g., density overlays]
4. **Highlighting protocol:** When emphasizing a single element, desaturate all non-highlighted elements to #[neutral gray hex] and use the assigned color at full saturation for the highlight
5. **Annotation colors:** Reference lines use #[hex], threshold bands use #[hex] at [N]% opacity -- these are reserved and must not duplicate any data encoding color
6. [Any additional context-specific rules]

### Do NOT Use
- [Anti-pattern specific to this palette, with reason]
- [Anti-pattern specific to this palette, with reason]
- [Anti-pattern specific to this palette, with reason]
```

---

## Rules

1. **Never use red and green as the sole differentiators between two categories** -- deuteranopia and protanopia together affect ~6-7% of males; in a presentation to 50 people, statistically 2-3 people cannot distinguish a pure red-green pair. Use Blue-Orange, Blue-Red, or Purple-Yellow-Green instead

2. **Always pair color with a second encoding channel** -- color alone cannot communicate data to users with color vision deficiency, users viewing grayscale printouts, or users in poor lighting conditions; the second channel (shape, pattern, label, position) must convey the same categorical distinction independently

3. **Sequential palettes must encode low values as light and high values as dark** -- this convention is universal and hardwired in audience expectations; reversing it (dark = low, light = high) causes systematic misreading, especially in choropleth maps where dark regions are instinctively read as "more"

4. **Limit categorical palettes to 7 colors maximum; prefer 5 or fewer** -- beyond 7, preattentive color discrimination fails; audiences must consciously match each element to the legend, which destroys the purpose of color encoding; if more than 7 categories exist, group small categories into "Other" (#BEBEBE) and present a separate table for detail

5. **For diverging palettes, the midpoint must be neutral -- specifically, luminance ≥ 0.85** -- this corresponds to hex values like #F7F7F7, #FFFFFF, or #EFEFEF; a saturated midpoint creates false visual emphasis on the neutral region and makes it appear that mid-range values are the most significant

6. **Every hex code must be explicitly specified -- never describe a color as "blue" or "a lighter shade"** -- color descriptions are ambiguous across tools; #4682B4 and #5B9BD5 are both "medium blue" but produce different contrast ratios and shift differently under color vision deficiency simulation

7. **Do not use RGB interpolation for sequential or diverging gradients** -- RGB-interpolated gradients pass through a desaturated gray zone between certain hue pairs (blue to yellow becomes gray-green in the middle) and appear perceptually non-uniform; always specify CIELAB or OKLCH interpolation for any gradient

8. **Do not use rainbow / ROY G BIV palettes for sequential data** -- rainbow palettes are perceptually non-uniform (yellow and cyan appear lighter than red and blue even at the same saturation), create false visual boundaries between hue transitions, and perform poorly under all three types of color vision deficiency simultaneously; they remain inappropriate regardless of audience familiarity with them

9. **Calculate WCAG contrast ratios using the correct luminance formula -- do not estimate by eye** -- a color that looks high-contrast can have a ratio as low as 2:1; specifically, mid-range saturated colors (lightness 45-55% in HSL) at saturation 60%+ reliably deceive visual estimation; the formula is (L1 + 0.05) / (L2 + 0.05) with gamma-linearized RGB channels

10. **Annotation colors (reference lines, threshold bands, callout boxes) must not share any hue within 30° of any data encoding color** -- annotation colors that are close in hue to data colors cause visual confusion about whether the annotation is a data point or a reference marker; annotation colors should be neutral (dark gray #3D3D3D for lines, light warm gray #F2EFE9 for background bands) unless the annotation itself is semantically color-coded

11. **Specify the intended background color in the palette documentation** -- a palette designed for a white background (#FFFFFF) often fails on a light gray dashboard background (#F4F4F4) or a dark mode background (#1E1E1E); the contrast ratios change, some colors become invisible, and sequential palettes may need their endpoints adjusted

12. **When using opacity for overlapping elements (density plots, bubble overlap, choropleth with overlay), recalculate the effective displayed color at each opacity level** -- 60% opacity of #4682B4 on white (#FFFFFF) displays as #90B4D3, which has a different contrast ratio and must be checked independently

---

## Edge Cases

### User Has a Brand Color That Must Be Used

Start by determining whether the brand color is being used as a **data encoding color** or a **structural/decorative color** (borders, backgrounds, title bar).

- Calculate the brand color's relative luminance immediately: if luminance < 0.3 (dark colors like navy, deep red, forest green), it can serve as the high-value endpoint of a sequential scale or one pole of a diverging scale
- If luminance is between 0.3 and 0.7 (mid-range colors), the brand color likely conflicts with both light and dark adjacent palette elements -- consider using it as the highlight color in a highlight/emphasis scheme rather than as one element of a categorical set
- If luminance > 0.7 (light colors like pale yellow, cream, light sky blue), the brand color will fail WCAG contrast against white backgrounds and should be reserved for decorative elements, backgrounds, or hover states only
- Build the remaining palette colors around the brand color's hue angle: if the brand color is at 210° (blue), space additional categorical colors at approximately 50°-70° intervals around the hue wheel (210°, 30°, 100°, 280°) to maximize perceptual distance while maintaining the brand color's prominence
- If the brand color is a pure red (#CC0000 or similar) or pure green (#00CC00 or similar), it cannot safely be used as one of a red-green pair; use it as a single emphasis color or shift the opposing palette member to blue, orange, or purple

### User Needs More Than 7 Categories

This is the most frequent categorical color problem and has exactly one correct solution structure:

- **Step 1**: Identify the "long tail" -- in most datasets, 3-5 categories account for 80%+ of the data value; identify which categories these are
- **Step 2**: Assign distinct hues to the 5-7 most important categories (by data volume, business priority, or audience interest)
- **Step 3**: Assign all remaining categories to a single neutral gray (#A8A8A8 or similar) labeled "Other" in the legend
- **Step 4**: If the user insists all categories must remain individually distinguishable, recommend switching to small multiples (one panel per category), a faceted view, or a table with conditional formatting instead of a single chart with color encoding
- **Do not**: Add more hues beyond 7, use different saturations of the same hue to represent different categories (audiences interpret saturation as quantity, not identity), or use very similar adjacent hues (cerulean and periwinkle appear identical in real chart conditions)

### Dark Mode / Dark Background Dashboard

Dark backgrounds (typically #121212 to #2D2D2D) require specific palette adjustments -- a white-background palette cannot be applied directly:

- **Sequential palettes**: Reverse the convention slightly -- on dark backgrounds, near-black low-value colors disappear into the background; shift the low-value endpoint to a medium-dark color (e.g., #1F4E79 instead of #DEEBF7) and keep the high-value endpoint bright and saturated (#74B9E8 or #FFFFFF)
- **Categorical palettes**: Increase lightness of all palette colors by 10-15 points (in HSL) -- colors at 45% lightness on white become unreadable on dark backgrounds; target 60-70% lightness on dark backgrounds
- **Contrast recalculation**: All contrast ratios must be recalculated against the dark background, not against white -- a color with 3.5:1 contrast on white may have 8:1 contrast on dark navy, or conversely a light color with 4.5:1 on white may have only 1.8:1 contrast if the background is lighter gray
- **Glow/halo artifact**: On very dark backgrounds, high-saturation colors (especially red, orange, yellow) can appear to "glow" and bleed visually into adjacent elements -- reduce saturation by 10-15% if this occurs, or add a 1-2px dark border between adjacent colored elements
- **Grayscale print from dark mode**: Warn the user that dark-background visualizations print very poorly -- the colored data elements will print as dark shapes on a dark background; provide an explicit light-mode export specification for print use

### Print Visualization (CMYK Output)

Screen (sRGB) to print (CMYK) conversion introduces systematic color shifts that can corrupt a carefully designed palette:

- Blue hues (#0000FF and nearby) shift reliably in CMYK and typically reproduce well; however, purple-blue (#7B5EA7 and similar) often shifts noticeably toward blue-gray or green-gray
- Red-orange and coral hues shift significantly: a digital coral (#E8724A) that reads as orange-ish on screen often prints as a flat brick red, potentially looking too similar to a pure red in the palette
- Bright greens and cyans shift less in CMYK than purples, but neon/electric green (#00FF7F) cannot be reproduced in CMYK at all -- it must be substituted
- For print: specify Pantone Solid Coated equivalents for the most critical 2-3 colors in the palette; the Pantone book provides the closest achievable ink match
- Test the palette by requesting a physical proof (or a digital ink simulation) before final publication
- Always test the grayscale version: print environments sometimes output to black-and-white laser printers, and the grayscale luminance values of the palette must provide sufficient differentiation (minimum luminance difference of 40 points on 0-255 scale between any two adjacent categories)

### Bivariate Color Encoding (Two Variables Simultaneously)

Bivariate maps and matrices encode two data dimensions in a single color -- this is an advanced technique that requires specific structure:

- **Grid structure**: Use a 2x2, 3x3, or maximum 4x4 color grid; a 3x3 grid (9 cells) is the practical maximum for audience interpretability
- **Axis assignment**: One variable controls hue (e.g., blue to orange on the horizontal axis), the other controls lightness (light to dark on the vertical axis); the combination produces 9 distinct colors
- **Corner anchors**: Define the four corner colors explicitly; the interior cells are derived by interpolation. Example 3x3 grid: top-left (high-A, low-B) = #B3D9EE; top-right (high-A, high-B) = #2166AC; bottom-left (low-A, low-B) = #F7F7F7; bottom-right (low-A, high-B) = #B2182B
- **Legend matrix**: A bivariate legend must always be a 2D color matrix, not a single legend bar -- the 1D bar cannot communicate two dimensions simultaneously; the matrix must have axis labels showing both variable names and their direction
- **Accessibility challenge**: Bivariate palettes are inherently hard for color vision deficiency; always supplement with two separate univariate maps shown side-by-side as an alternative view, and state clearly in the caption which diagonal of the bivariate map represents the convergence of both extreme values

### User Wants to Encode Uncertainty or Confidence

Visualizing statistical uncertainty through color is a specialized application with specific conventions:

- Use saturation (chroma) as the uncertainty encoding channel, not hue or lightness: high certainty = high saturation; low certainty = low saturation / grayed-out version of the same hue; this allows the hue to still encode the primary data dimension
- Do not use separate categorical colors for "certain" and "uncertain" -- this creates ambiguity about whether hue or saturation is the meaningful channel
- When encoding a confidence interval band around a line chart, use the line chart's color at 15-25% opacity for the band; the band color will blend with the background but remain visually associated with the line
- Specify the exact opacity percentage for uncertainty bands and document it -- "light blue" is not sufficient; the opacity must be explicit because it changes the effective contrast ratio
- If showing multiple confidence levels (50%, 80%, 95% intervals), use 3 opacity tiers: 35%, 20%, and 10% opacity; the outermost (widest) band should always be the most transparent

### Existing Visualization With Incorrect Colors

When a user brings an existing chart with problematic colors and asks for a fix:

- First, identify the specific failure mode: is it a WCAG contrast failure, a CVD safety failure, a palette-type mismatch (sequential palette used for categorical data), or a semantic conflict (green used for declining metric, red used for growing metric)?
- For WCAG failures: calculate the current contrast ratio, then adjust the lighter of the two conflicting colors toward greater darkness (lower lightness in HSL) until the ratio clears 3:1 or 4.5:1; do not change hue if the hue is doing meaningful encoding work
- For CVD failures: the most common fix is to replace one member of a red-green pair with blue, orange, or purple, while keeping the other; verify the fix with a luminance difference check (delta-L ≥ 40)
- For palette-type mismatch: a sequential palette on categorical data is a structural error -- the fix requires redesigning with a categorical palette; inform the user that this is not a color tweak but a palette architecture change
- For semantic conflicts: present the user with the cultural color convention (red = loss/danger, green = growth/safe in Western business contexts) and ask whether they want to align with the convention or explicitly override it; if overriding, add a clear written label because the color will work against audience expectation

---

## Example

**Input:** "I'm building a dashboard in Power BI that shows monthly sales performance for 6 regional offices. The chart is a grouped bar chart with bars for each region per month. The dashboard background is dark gray (#1E1E1E). It needs to be accessible. I don't have any mandatory brand colors."

---

## Data Visualization Color Specification

### Palette Summary
- **Palette type:** Categorical (6 unrelated geographic regions, no implied order)
- **Color encoding:** Regional office identity -- each hue identifies one of 6 offices consistently across all dashboard charts
- **Number of colors:** 6
- **Visualization context:** Grouped bar chart, Power BI, screen-only, dark gray background (#1E1E1E)
- **Accessibility target:** WCAG AA (4.5:1 for data labels; 3:1 for bar fill elements)

---

### Color Assignments

| # | Name | Hex | RGB | HSL | Assigned To | On-Color Text |
|---|------|-----|-----|-----|-------------|---------------|
| 1 | Azure | #56B4E9 | 86, 180, 233 | 202°, 77%, 63% | North Region | #1A1A1A |
| 2 | Vermillion | #E06033 | 224, 96, 51 | 20°, 72%, 54% | South Region | #1A1A1A |
| 3 | Bluish Green | #38B09A | 56, 176, 154 | 171°, 52%, 45% | East Region | #1A1A1A |
| 4 | Gold Amber | #E6A817 | 230, 168, 23 | 42°, 82%, 50% | West Region | #1A1A1A |
| 5 | Soft Violet | #A882DD | 168, 130, 221 | 269°, 57%, 69% | Central Region | #1A1A1A |
| 6 | Reddish Pink | #D4608C | 212, 96, 140 | 335°, 55%, 60% | Northwest Region | #1A1A1A |

**Notes on hue spacing:** Starting at 202° (Azure/blue), hues are spaced at approximately 50°-70° intervals (20°, 171°, 42°, 269°, 335°) to maximize perceptual distance. No two hues fall within 30° of each other. Saturation is consistent at 52-82% and lightness at 44-69%, tuned for visibility on a dark (#1E1E1E) background.

---

### Accessibility Verification

#### WCAG Contrast Ratios (all measured against dark background #1E1E1E, luminance 0.014)

| Foreground Color | Background | Fg Luminance | Bg Luminance | Contrast Ratio | WCAG Level | Notes |
|-----------------|------------|-------------|-------------|----------------|------------|-------|
| #56B4E9 Azure | #1E1E1E | 0.399 | 0.014 | 8.5:1 | AAA | Excellent for bar fills and labels |
| #E06033 Vermillion | #1E1E1E | 0.206 | 0.014 | 5.6:1 | AA | Passes for text and large elements |
| #38B09A Bluish Green | #1E1E1E | 0.185 | 0.014 | 5.1:1 | AA | Passes for text and large elements |
| #E6A817 Gold Amber | #1E1E1E | 0.399 | 0.014 | 8.5:1 | AAA | Excellent; confirm not too similar to Azure in luminance |
| #A882DD Soft Violet | #1E1E1E | 0.256 | 0.014 | 6.7:1 | AA | Passes; check against Reddish Pink adjacency |
| #D4608C Reddish Pink | #1E1E1E | 0.145 | 0.014 | 4.1:1 | AA Large / 3:1 bar fills | Use for large bar elements; add direct label if used as text under 18pt |
| #1A1A1A (text) | #56B4E9 (bar) | 0.010 | 0.399 | 10.6:1 | AAA | Data labels on Azure bars |
| #1A1A1A (text) | #E06033 (bar) | 0.010 | 0.206 | 5.6:1 | AA | Data labels on Vermillion bars |
| #1A1A1A (text) | #38B09A (bar) | 0.010 | 0.185 | 5.1:1 | AA | Data labels on Bluish Green bars |
| #1A1A1A (text) | #E6A817 (bar) | 0.010 | 0.399 | 10.6:1 | AAA | Data labels on Gold Amber bars |
| #1A1A1A (text) | #A882DD (bar) | 0.010 | 0.256 | 6.7:1 | AA | Data labels on Soft Violet bars |
| #1A1A1A (text) | #D4608C (bar) | 0.010 | 0.145 | 4.1:1 | Use white text instead | Switch to #FFFFFF for text on Reddish Pink: 12.7:1 |

#### Colorblind Simulation Results

| Pair | Deuteranopia | Protanopia | Tritanopia | Grayscale Luminance Δ | Safe? |
|------|-------------|-----------|-----------|----------------------|-------|
| Azure vs. Vermillion | Distinguishable (blue vs. dark yellow-orange) | Distinguishable (blue vs. dark tan) | Distinguishable (appear as blue vs. yellow-red) | ΔL = 0.193 (193 pts) | Yes |
| Azure vs. Bluish Green | Distinguishable (blue vs. blue-gray, slight risk) | Distinguishable (blue vs. gray-green) | Problematic: both shift toward similar greenish-gray | ΔL = 0.214 | Conditional -- add shape markers |
| Vermillion vs. Reddish Pink | Both shift toward similar brown-orange | Both shift toward dark tan -- risk | Distinguishable | ΔL = 0.061 (61 pts) | Conditional -- ensure not adjacent in bar grouping |
| Gold Amber vs. Reddish Pink | Gold shifts toward bright yellow; Pink shifts toward orange-yellow -- risk of merge | Gold bright yellow; Pink dark tan -- distinguishable | Problematic: both accessible hue angles shift similarly | ΔL = 0.254 | Conditional -- add label redundancy |
| Soft Violet vs. Azure | Distinguishable (violet shifts toward blue but remains lighter) | Distinguishable | Distinguishable | ΔL = 0.143 | Yes |
| All 6 colors in grayscale | Grayscale values: Azure 0.399, Amber 0.399, Violet 0.256, Vermillion 0.206, Green 0.185, Pink 0.145 | -- | -- | Azure and Amber identical in gray | Separate Azure and Amber bars using spacing; add pattern fills |

**Key finding from colorblind simulation**: Azure (#56B4E9) and Gold Amber (#E6A817) have identical grayscale luminance (both ≈ 0.399). In an achromatic print or extreme CVD case, these two regions are indistinguishable. Resolution: assign Azure and Gold Amber to the two regions with the most data points (North and West, likely the highest revenue regions) and ensure they are never placed in adjacent bar positions within the same month grouping.

#### Alternative Encoding Channels
- **Pattern fills**: North Region (Azure) uses solid fill; South Region (Vermillion) uses diagonal hatch 45°; East Region (Bluish Green) uses diagonal hatch 135° (counter-diagonal); West Region (Gold Amber) uses horizontal hatch; Central Region (Soft Violet) uses dot grid fill; Northwest Region (Reddish Pink) uses cross-hatch. Power BI supports custom fill patterns through Deneb/Vega-Lite custom visual.
- **Labels**: Direct data labels are enabled on all bars showing the sales value in thousands (e.g., "$2.4M"). This makes color redundant for reading individual values.
- **Legend**: Dashboard legend shows color swatch + region name + current month total. Region name is the primary identifier; color is reinforcement.

---

### System Test Results
- **Simultaneous contrast**: Vermillion (#E06033) adjacent to Reddish Pink (#D4608C) in the bar grouping creates mild vibrational border -- resolved by ensuring these two regions are always separated by at least one bar of a different hue in the grouped bar ordering (ordering: Azure, Gold Amber, Bluish Green, Soft Violet, Vermillion, Reddish Pink)
- **Small size (200×150px) test**: All 6 colors distinct at reduced size. Soft Violet and Reddish Pink come closest to merging -- confirmed still distinguishable at 200px width due to sufficient hue and lightness separation
- **Grayscale luminance values**: Azure 102 (out of 255), Gold Amber 102, Soft Violet 65, Vermillion 53, Bluish Green 47, Reddish Pink 37. Azure and Gold Amber are identical in grayscale -- documented above, resolved via ordering and pattern fills
- **Background compatibility**: All 6 colors verified on #1E1E1E dark background. No color falls below 3:1 contrast against the background for large (bar-sized) elements. Reddish Pink (#D4608C) is the weakest at 4.1:1 and requires white text for data labels.

---

### Usage Rules

1. **Fixed regional assignment**: Azure (#56B4E9) is permanently North Region, Vermillion (#E06033) is permanently South Region, Bluish Green (#38B09A) is permanently East Region, Gold Amber (#E6A817) is permanently West Region, Soft Violet (#A882DD) is permanently Central Region, Reddish Pink (#D4608C) is permanently Northwest Region -- these assignments must not be changed between dashboard pages or reports
2. **Bar ordering within groups**: Within each monthly bar group, bars must appear in the fixed order: Azure, Gold Amber, Bluish Green, Soft Violet, Vermillion, Reddish Pink -- this order separates the two most visually similar pairs (Azure/Amber are positions 1 and 2 but the color difference is large; Vermillion/Pink are positions 5 and 6, separated by 3 bars of contrasting color)
3. **Overflow rule**: If a 7th region is added, use #BEBEBE (Neutral Gray) as the overflow color -- do not add a 7th hue; instead, the new region should be reviewed to determine whether it merits being promoted to replace one of the existing 6, or appears as "Other" until a full palette redesign
4. **Opacity restriction**: All region colors at 100% opacity for bar fills. If a bar is selected/highlighted in Power BI interactivity, all non-selected bars reduce to 30% opacity of their assigned color; the selected bar stays at 100%
5. **Annotation colors**: Monthly target line uses #F0F0F0 (Light Gray) at 80% opacity; year-over-year comparison line (if added) uses #FFFFFF at 60% opacity -- neither color falls within 30° hue angle of any of the 6 region colors
6. **Text on Reddish Pink**: Any text, number, or label placed on a Reddish Pink (#D4608C) bar must use #FFFFFF (white), not #1A1A1A -- contrast of white on Reddish Pink is 12.7:1 (AAA); contrast of dark on Reddish Pink is 4.1:1 which is borderline for small text
7. **Light mode export**: For PDF exports or external presentations on white backgrounds, the palette must be re-tuned: reduce lightness of each color by 12 points in HSL to maintain readability -- the dark-mode palette will appear washed out on white

### Do NOT Use
- Do not use red (#CC0000 or similar pure red) as a substitute for Vermillion (#E06033) -- pure red creates a semantic "error/danger" signal that dominates the categorical reading; Vermillion reads as a color, not an alarm
- Do not use the Reddish Pink (#D4608C) color for any status indicator, alert badge, or error message on the dashboard -- its reserved function is Northwest Region identity only; using it for UI states will cause audience confusion about whether a UI element represents a region
- Do not adjust any palette color to increase its contrast against white backgrounds without rechecking its contrast against the dark (#1E1E1E) background -- optimizing for white will typically desaturate the color and reduce contrast on dark backgrounds
- Do not place Azure (#56B4E9) bars and Gold Amber (#E6A817) bars immediately adjacent to each other in any chart that will be printed or photocopied -- they are identical in grayscale luminance and will appear as the same color in print
