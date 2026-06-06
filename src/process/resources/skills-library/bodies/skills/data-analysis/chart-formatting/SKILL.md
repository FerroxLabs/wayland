---
name: chart-formatting
description: |
  Produces a complete chart formatting specification including axis labels, tick mark spacing, gridline density, legend placement, annotation placement, data label formatting, and title hierarchy. Eliminates chart junk while preserving the data signal.
  Use when the user has a chart that needs professional formatting or wants a formatting template for consistent chart styling.
  Do NOT use for selecting the chart type (use chart-type-selector), choosing a color palette (use color-in-data), or designing a full dashboard (use dashboard-design).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-visualization design template"
  category: "data-analysis"
  subcategory: "data-visualization"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Chart Formatting

## When to Use

**Use this skill when:**
- A user shares a chart (screenshot, description, or data) and says it looks cluttered, amateurish, hard to read, or "like a default Excel chart"
- A user asks for a formatting specification or style guide to apply consistently across multiple charts in a report, deck, or publication
- A user wants to reduce visual noise -- specifically mentions gridlines, 3D effects, excessive tick marks, overlapping labels, or redundant legends
- A user needs to adapt a chart from one display medium to another (e.g., converting a dashboard chart for use in a printed PDF report or a conference slide)
- A user is formatting a specific chart element in isolation: axis scale, tick interval, legend placement, annotation style, data label formatting, or title hierarchy
- A user is preparing charts for accessibility (high contrast, pattern fills, screen reader-compatible structure)
- A user says their charts are inconsistent across a document and wants to establish a single formatting standard
- A user is preparing a chart for publication in a trade journal, annual report, or external investor presentation where professional standards are expected

**Do NOT use when:**
- The user has not yet chosen a chart type and is deciding between bars, lines, scatter, or other forms -- use `chart-type-selector` first
- The user needs to decide which color encodes which data dimension or category -- use `color-in-data`
- The user is designing a multi-chart dashboard layout, determining panel arrangement, or setting cross-chart interaction behavior -- use `dashboard-design`
- The user is building an infographic that combines illustration, text flow, and data -- use `infographic-planning`
- The user needs to choose a statistical visualization method (box plots vs. violin plots, confidence intervals vs. error bars) -- use `statistical-chart-selection`
- The user's primary problem is that the data itself is wrong, incomplete, or needs transformation -- formatting cannot fix bad data
- The user needs to format a table rather than a chart -- table formatting follows different principles around row spacing, alignment, and column hierarchy

---

## Process

### Step 1: Establish Chart Context

Before issuing any formatting guidance, gather the minimum necessary context. Ask if not provided:

- **Chart type:** Vertical bar, horizontal bar, grouped bar, stacked bar, 100% stacked bar, line (single/multi-series), area, scatter, bubble, dot plot, heatmap, small multiples, waterfall, or other. Each type has specific formatting rules that differ from the others.
- **Key message:** What is the single finding the viewer should walk away with? If the user cannot state this in one sentence, the chart may need restructuring before formatting.
- **Display medium:** Projected presentation (PowerPoint, Keynote, Google Slides), printed report (PDF, Word), web dashboard (embedded HTML/SVG), email body, or academic/journal publication. Medium determines minimum font sizes, resolution requirements, and color fidelity.
- **Physical or pixel dimensions:** Width x height. For slides, the standard is 1280x720px (16:9) or 960x540px. For reports, common column widths are 3.5 inches (single column), 6.5 inches (full text width), or 7.5 inches (full page). For web, note viewport breakpoints.
- **Number of data series:** One series or multiple. Multiple series require legend or direct labeling decisions.
- **Number of data points:** Fewer than 10, 10-30, or more than 30. This governs whether data labels are feasible and how dense the axis tick marks must be.
- **Brand or style constraints:** Specific fonts, color palettes, or logo placement requirements. Note these but apply formatting best practices within those constraints.

### Step 2: Apply the Formatting Priority Hierarchy

Format elements in strict priority order. Higher-priority elements claim visual weight; lower-priority elements must recede. Violating this hierarchy is the primary cause of cluttered charts.

- **Priority 1 -- Data elements:** Bars, lines, points, areas. These must be the most visually prominent objects on the chart. Highest contrast, largest size, clearest color.
- **Priority 2 -- Title and subtitle:** Second thing the viewer encounters. Must carry the finding, not a description. Positioned top-left.
- **Priority 3 -- Axis labels and tick marks:** Provide interpretive scaffolding. Should be readable but visually subordinate to data. Use lighter weight, smaller size, and muted color.
- **Priority 4 -- Annotations and reference lines:** Highlight specific findings, targets, or benchmarks. More visually prominent than gridlines but less prominent than data elements.
- **Priority 5 -- Legend:** Necessary only when color, shape, or line style distinguishes multiple series and direct labeling is impractical. Keep it compact and borderless.
- **Priority 6 -- Gridlines:** Pure reference scaffolding. Must be the lightest visible element. #DEDEDE or lighter at 0.5pt. If removed entirely, data labels must take their place.
- **Priority 7 -- Everything else:** Axis lines, tick line marks, borders, backgrounds. Default posture is to remove unless absence creates ambiguity.

### Step 3: Specify Title and Subtitle

The title is the single most-read element in any chart. Most charts fail here by using descriptive titles ("Sales by Month") instead of assertive titles ("Sales Grew 31% in Q4").

- **Title content rule:** State the finding, not the variables. "Customer acquisition cost fell below $50 for the first time in 2024" beats "Customer Acquisition Cost Over Time."
- **Title for exploratory charts:** If the chart is exploratory (no single finding yet), use a neutral but specific title: "Revenue by Region, Q1-Q4 2024" -- include the time period and scope.
- **Font size by medium:** Presentation: 22-28pt. Report (full-width chart): 14-16pt. Report (half-width chart): 12-14pt. Dashboard panel: 12-14pt. Email inline: 12pt.
- **Font weight:** Bold for title, Regular for subtitle. Never use italic for titles -- it reads as tentative.
- **Alignment:** Left-aligned in all contexts. Centered titles require the eye to hunt for the start of the text. Left alignment anchors to the same edge as the data.
- **Subtitle role:** Carries methodology notes ("Values in USD thousands, not adjusted for inflation"), date ranges, sample sizes, or data source attribution. Never repeat the title text.
- **Subtitle placement:** Directly below the title, 4-6pt smaller, regular weight, color #666666 or 40% black.
- **Title capitalization:** Title case for the title (first letter of each major word). Sentence case for the subtitle.

### Step 4: Format Axes with Precision

Axes are the most technically demanding formatting element. Errors here directly distort data interpretation.

**Y-axis scale rules:**
- Bar charts and column charts: Always start at zero. A truncated Y-axis on a bar chart is a perceptual lie -- bar length encodes magnitude, and that encoding only works when the baseline is zero.
- Line charts: Zero baseline is preferred but not mandatory. If all values fall between 85 and 105, a zero-anchored axis collapses all variation into a flat line and hides the signal. Use a contextually meaningful minimum (e.g., 80) and add a Y-axis break marker (double diagonal line) or a note: "Y-axis begins at 80."
- Scatter plots: Match the axis range to the data range with 5-10% padding on each side. Do not force zero on scatter axes.
- Percentage axes: 0% to 100% for 100% stacked charts. For other percent charts, use data range with 5% padding.

**Tick interval selection:**
- Always use round-number intervals: 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000. Never use intervals of 3, 7, 11, or other non-round numbers.
- Target 4-6 gridline intervals on the Y-axis. Fewer than 4 provides insufficient reference; more than 6 creates clutter.
- For currency: $500K intervals on a $0-$3M axis (6 intervals). For percentages: 5% or 10% intervals. For dates: round to the natural period (months, quarters, years) rather than irregular intervals.
- Suppress minor tick marks. They add ink without adding information in most business charts.

**Axis label formatting:**
- Always include units in the axis label: "Revenue ($M)" not "Revenue." Exception: dates on the X-axis are self-explanatory.
- X-axis label rotation: 0 degrees (horizontal) is always preferred. Rotate to 45 degrees only when labels overlap at 0 degrees. Rotate to 90 degrees only as a last resort. Never rotate Y-axis tick labels.
- Abbreviate long axis labels: Jan/Feb/Mar not January/February/March, Q1 not Quarter 1, FY24 not Fiscal Year 2024.
- Axis title font size: 2pt smaller than data labels. Tick label font size: 10-12pt for reports, 14pt for presentations.
- Remove the axis line (the spine) when horizontal gridlines are present -- it is redundant.

### Step 5: Specify Gridlines with Surgical Restraint

Gridlines exist to help the viewer estimate values they cannot read directly from data labels. They are scaffolding, not decoration.

- **Default rule:** Horizontal gridlines only (Y-axis reference). Vertical gridlines almost never add value to categorical X-axes.
- **Color:** #E0E0E0 (15% black) for standard use. #EEEEEE (6% black) for dense charts with many gridlines. Never darker than #CCCCCC for non-emphasized gridlines.
- **Weight:** 0.5pt to 0.75pt. Never 1pt or heavier for regular gridlines.
- **Gridlines vs. data labels:** These are alternative reference systems. Use gridlines when there are more than 8-10 data points (labels would crowd). Use data labels when there are fewer than 8 data points (gridlines are unnecessary). Do not use both on the same chart.
- **Emphasis gridlines:** One gridline may be heavier (1pt, #AAAAAA) to mark a threshold, target, average, or benchmark. This is an annotation, not a standard gridline.
- **When to remove all gridlines:** When the chart is projected on a slide and the message is directional (up/down/trend) rather than quantitative, gridlines add noise. Remove them and label only the key data points.

### Step 6: Specify Legend and Series Labels

The legend is the most commonly misused chart element. It forces the viewer's eye to shuttle back and forth between the legend key and the data -- a cognitive load that direct labels eliminate.

- **Remove the legend entirely when:** The chart has only one data series (the title or subtitle identifies it). The series can be labeled directly on the chart (end-of-line labels for line charts, bar labels for grouped bars).
- **Direct labeling:** For line charts with 2-4 series, place the series name at the right end of each line in matching color. This eliminates the lookup entirely. Offset labels vertically if lines converge at the endpoint.
- **Keep the legend when:** There are 5+ series, series overlap makes direct labeling difficult, or the chart will be printed in black and white with pattern fills.
- **Legend placement:** Top-right or directly above the chart. Never to the right of the chart in a portrait document (wastes horizontal space). Never below the chart in a presentation (below-the-fold for landscape slides).
- **Legend formatting:** Remove border, remove background, remove shadow. Use the same font and size as axis tick labels. Arrange legend items in the same order as they appear in the chart (top-to-bottom for vertical charts, left-to-right for horizontal).

### Step 7: Specify Data Labels and Annotations

These two elements are distinct. Data labels show the value of every (or selected) data point. Annotations are editorial -- they explain significance, mark thresholds, or highlight outliers.

**Data labels:**
- Use when the viewer needs to read specific values and the chart has fewer than 10-12 data points.
- Suppress data labels when there are 15+ data points -- labels will overlap or crowd, defeating their purpose.
- Selective labeling strategy: Label only the highest value, lowest value, most recent value, or the specific data point referenced in the title. This focuses the viewer's attention where the message is.
- Number format must exactly match the axis format. If the Y-axis shows "$M", labels show "$2.1M" not "$2,100,000" or "2.1."
- Font size: 2pt smaller than axis tick labels. Bold only for the specifically highlighted value.
- Position: Above bars (column charts), to the right of bars (horizontal bar charts), above/beside points (scatter, line). Never inside a bar that is too short to contain the label.

**Annotations:**
- Maximum 3 per chart. Each annotation competes with the data for the viewer's attention. More than 3 creates a visual hierarchy crisis where nothing is primary.
- Style: Use a thin connector line (0.75pt, #888888, no arrowhead or small open arrowhead) connecting the annotation text box to the data point. Text box has no border, no background fill, or very light fill (#F9F9F9) if overlap with data elements is unavoidable.
- Reference lines (horizontal or vertical): Use a dashed line (#AAAAAA, 1pt, dashed 3pt/3pt) for targets, averages, benchmarks. Label the line directly (e.g., "Industry avg: $1.4M") rather than putting the label in a separate legend.
- Annotation text: Specific and declarative. "Target: $2M" or "Acquisition closed Oct 14" -- not "Important" or "See note."

### Step 8: Produce and Deliver the Specification

Compile every decision into the standardized output format below. The specification must be complete enough that a person who has never seen the original chart can format a new one consistently.

- List every element that was removed and explain why (e.g., "removed drop shadows -- add ink without encoding information").
- Flag any trade-offs made (e.g., "retained gridlines despite having 8 data points because the chart will be printed and values cannot be labeled without crowding").
- If the user's brand constraints conflict with best practices, note both: what best practice recommends and what the brand standard requires. Let the user decide -- do not silently override their requirements.
- Include a "quick reference" summary with the 5-6 most critical specs (font size, gridline color, primary data color, title format) for fast implementation.

---

## Output Format

```
## Chart Formatting Specification

---

### Chart Context

| Element               | Value                                         |
|-----------------------|-----------------------------------------------|
| Chart type            | [exact type]                                  |
| Display medium        | [Presentation / Report / Dashboard / Email]   |
| Dimensions            | [W x H in px or inches]                       |
| Data points per series| [count]                                       |
| Number of series      | [count]                                       |
| Key message           | [The single finding this chart communicates]  |
| Brand constraints     | [Font, colors, or template requirements]      |

---

### Quick Reference (Top 6 Specs)

| Spec                  | Value                                         |
|-----------------------|-----------------------------------------------|
| Title font            | [Family, size, weight]                        |
| Axis tick font        | [Family, size, weight]                        |
| Primary data color    | [hex]                                         |
| Gridline style        | [color hex, weight, or "None"]                |
| Data labels           | [All / Selective / None]                      |
| Legend                | [Visible / Direct labels / Hidden]            |

---

### Title and Subtitle

| Element            | Specification                                 |
|--------------------|-----------------------------------------------|
| Title text         | "[Finding-based title in quotes]"             |
| Title font         | [Family], [size]pt, Bold, #1A1A1A             |
| Title alignment    | Left-aligned                                  |
| Title case         | Title Case                                    |
| Subtitle text      | "[Context, date range, units note, source]"   |
| Subtitle font      | [Family], [size]pt, Regular, #666666          |
| Subtitle case      | Sentence case                                 |
| Vertical spacing   | [pt] between title and subtitle               |

---

### Axis Formatting

| Axis | Label Text           | Font    | Range         | Tick Interval | Label Rotation | Axis Line | Gridlines                   |
|------|----------------------|---------|---------------|---------------|----------------|-----------|-----------------------------|
| X    | [label with units]   | [size]pt| [start - end] | [interval]    | [0/45/90 deg]  | [On/Off]  | Off (categories)            |
| Y    | [label with units]   | [size]pt| [min - max]   | [interval]    | 0 degrees      | Off       | [On: hex, weight / Off]     |

**Axis Notes:**
- [Any specific scale decisions, zero-baseline exceptions, or formatting notes]

---

### Data Element Formatting

| Element               | Color     | Width / Size     | Border     | Fill        | Effects            |
|-----------------------|-----------|------------------|------------|-------------|--------------------|
| [Primary data element]| [hex]     | [px / pt / %]    | [None/spec]| [Solid/None]| None               |
| [Highlighted element] | [hex]     | [same/different] | [spec]     | [Solid]     | None               |
| [Secondary series]    | [hex]     | [spec]           | [spec]     | [spec]      | None               |

**Series Notes:**
- [Explain any color logic, emphasis strategy, or pattern fill requirements]

---

### Data Labels

| Setting         | Value                                             |
|-----------------|---------------------------------------------------|
| Visibility      | [All points / Selected points only / None]        |
| Which points    | [Highest, lowest, most recent, or named points]   |
| Position        | [Above / Below / Outside end / Beside]            |
| Number format   | [Exact format string, e.g., "$#,##0.0M"]          |
| Font size       | [size]pt                                          |
| Font weight     | [Regular / Bold for highlighted values only]      |
| Font color      | [hex]                                             |

---

### Legend

| Setting         | Value                                             |
|-----------------|---------------------------------------------------|
| Visibility      | [Visible / Hidden / Direct labels used instead]  |
| Position        | [Top-right / Top-center / Above chart / None]    |
| Item order      | [Top-to-bottom matching chart / Left-to-right]   |
| Border          | None                                              |
| Background      | Transparent                                       |
| Font size       | [size]pt                                          |
| Direct label placement | [Where direct labels are placed if used]  |

---

### Annotations and Reference Lines

| # | Type           | Text                          | Position               | Style                                     |
|---|----------------|-------------------------------|------------------------|-------------------------------------------|
| 1 | [Annotation/Ref line] | [Exact text]          | [Location on chart]    | [connector spec, font, color]             |
| 2 | [Annotation/Ref line] | [Exact text]          | [Location on chart]    | [connector spec, font, color]             |

---

### Elements Removed (Chart Junk Eliminated)

| Element Removed          | Reason                                                         |
|--------------------------|----------------------------------------------------------------|
| [Element name]           | [Specific reason: what cognitive or visual problem it caused]  |
| [Element name]           | [Specific reason]                                              |

---

### Implementation Notes

- [Trade-off or exception to best practice, with explanation]
- [Brand constraint that was applied]
- [Any element that requires manual adjustment after automated formatting]
```

---

## Rules

1. **Never truncate a bar chart Y-axis.** Bar length is a magnitude encoding -- it only works when the baseline is zero. A bar that starts at 80 and reaches 100 looks 100% of the bar height, not 20% of the actual value. This is not an aesthetic preference -- it is a perceptual fact validated by decades of graphical perception research.

2. **Never use 3D effects on any chart element.** 3D bars, 3D pie slices, and 3D axes all introduce angular distortion that makes it geometrically impossible to read values accurately. A 3D bar's apparent height depends on the viewing angle, not the data value. Remove immediately, no exceptions.

3. **Never use both gridlines and data labels as the reference system.** Gridlines help viewers estimate unlabeled values. Data labels make that estimation unnecessary. Using both doubles the reference information without adding signal, creating noise. Choose one: gridlines for charts with many data points (10+), data labels for charts with few data points (under 10).

4. **Chart titles must state a finding, not describe variables.** "Sales by Region" is a file name, not a title. "Northeast Region Outperformed All Others by 40% in Q3" is a title. The only exception is exploratory or reference charts where no single finding is intended -- in that case, include scope and time period: "Sales by Region, Q1-Q4 2024."

5. **Limit annotations to 3 per chart.** Every annotation is a demand on the viewer's attention. Three competing demands approach the limit of what a viewer can process while still reading the data. More than 3 means the chart is doing the work that a written analysis should do -- split the content, or replace the chart with a table-and-narrative format.

6. **Gridlines must always be lighter than the lightest data element.** If the data bars are #4682B4 (medium blue), gridlines must be no darker than #D0D0D0. If gridlines appear to compete visually with data elements, increase gridline lightness (higher hex value) until they recede. The brain assigns figure/ground based on relative contrast -- gridlines must always read as ground.

7. **Font sizes must never fall below 8pt in print or 10pt in screen/presentation contexts.** Below 8pt, text becomes inaccessible to readers with normal vision and invisible to those with impairment. If labels overlap at 8pt, the solution is label thinning (show every other), rotation (45 degrees), or abbreviation -- not font reduction.

8. **Axis tick intervals must be round numbers.** Never use intervals of 3, 7, 11, 13, or any prime number. Round intervals (1, 2, 5, 10, 25, 50, 100, 250, 500) allow the viewer to extrapolate mentally. Irregular intervals force exact reading of every tick -- they transform the axis from a reference aid into a test.

9. **Match data label format exactly to axis format.** If the Y-axis shows "$M", labels must show "$1.2M", not "$1,200,000", not "1.2", not "$1.2". A mismatch between axis and label units forces a mental unit conversion on the viewer, which adds cognitive load and risks misinterpretation.

10. **Remove every element that does not encode data or aid interpretation.** This includes: gradient fills, drop shadows, decorative borders, plot area backgrounds (use white), chart area frames, secondary Y-axis reference lines when one will do, default chart template watermarks, and any element that was included because the software put it there by default. The test for every element: "If I remove this, does the viewer lose information or interpretive ability?" If the answer is no, remove it.

11. **Direct series labels always outperform a legend.** A legend requires 2-3 eye movements (data element --> legend key --> label) to decode a series. A direct label at the end of a line or beside a bar requires 0 additional eye movements. Use direct labels whenever the chart has 2-4 series and the lines or bars do not converge at the label position.

12. **Never rely on color alone to distinguish data categories.** Approximately 8% of men and 0.5% of women have color vision deficiency. All color-encoded distinctions must be reinforced by direct labels, pattern fills, or line style variation. This is both an accessibility requirement and a print-compatibility requirement.

---

## Edge Cases

**The chart will be projected in a large room (audience 20+ meters from screen).**
Standard presentation font sizes are insufficient. Increase all text by an additional 4-6pt beyond normal presentation specs: title 28-32pt, axis labels 16-18pt, data labels 16pt. Remove all gridlines -- at distance, light gray gridlines become invisible and their faint presence creates visual noise without reference value. Use 3-4 data labels maximum on the most important values only. Increase bar width to 70-75% of category width (vs. standard 60%) so bars read clearly at distance. Use high-contrast colors -- avoid pastels and any color with less than 4.5:1 contrast ratio against the white background.

**The chart has dual Y-axes (two different scales on left and right).**
Dual Y-axis charts are nearly always misread. The viewer cannot tell which line corresponds to which axis without a color-coded legend that maps line color to axis side -- and even then, the implied correlation between the two series is false (the apparent intersection point changes when either axis is rescaled). Recommend replacing with small multiples (two separate charts, same X-axis) whenever possible. If the user insists on dual axes: use clearly different line weights (primary series: 2.5pt, secondary series: 1.5pt dashed), use a color that directly matches each line to its axis label, and add an explicit note: "Left axis: Revenue ($M). Right axis: Units Sold (thousands). Scales are independent." Never share gridlines -- draw gridlines only for the primary (left) axis.

**The chart will be published in a peer-reviewed journal or academic publication.**
Academic publishing has specific requirements that differ from business charting. Use vector formats (SVG, EPS, PDF) -- raster formats (PNG, JPG) are rejected by most journals below 300 DPI (print) or 600-1200 DPI (line art). Remove all color in the data elements unless the journal explicitly permits it -- use grayscale with pattern fills or line styles. Figure captions go below the chart (not as an in-chart title) and must be standalone-descriptive: "Figure 3. Mean response time (ms) by condition and participant group. Error bars represent 95% confidence intervals. N=120 per condition." The chart title field in the software should be blank -- the caption is the title. Axis labels must spell out abbreviations in full unless they are universal conventions (ms, Hz, km).

**The user has more than 6 series on a single line chart.**
A line chart with 7+ series is almost always unreadable -- line colors and styles run out, the legend dominates, and the viewer cannot track individual lines across the chart. Recommended interventions in order of preference: (1) Use small multiples -- one panel per series, sharing the same axes, displayed in a grid. This preserves comparison while eliminating the spaghetti problem. (2) Highlight one or two focal series in color with other series in light gray (#D0D0D0) -- the gray lines provide context without competing for attention. (3) Aggregate series into groups if individual series are not the message. If the user refuses all alternatives, use a maximum of 7 visually distinct line styles: 3 solid lines in distinct hues + 4 dashed/dotted variants, and use direct endpoint labels instead of a legend.

**The chart has a logarithmic scale.**
Log scales are legitimate for data spanning multiple orders of magnitude (e.g., population by city, stock price over 50 years, bacterial growth). Formatting requirements differ from linear scales: tick marks must fall at powers of the base (10, 100, 1000 for base-10 log; not at 500, 5000). The Y-axis must be labeled "log scale" or each tick labeled with its actual value ($10, $100, $1K, $10K). Never use a log scale for bar charts -- the bar length encoding breaks because the proportional relationship between bar heights is distorted. Use log scales for line charts and scatter plots only. Add an axis note: "Y-axis: log scale (base 10)."

**The chart contains a zero value or near-zero value in a bar chart series.**
A bar of zero height is invisible. A bar of near-zero height (e.g., $1,200 on a $0-$2M axis) is a pixel-thin line that looks like a missing value. Solutions: (1) Add a minimum visible bar height of 3px, with the actual value labeled above the bar. (2) Use a dot or marker at the zero baseline instead of an invisible bar. (3) Add a data label for the zero-height bar explicitly (e.g., "$0" or "No data") positioned slightly above the baseline. Never leave a zero-bar unlabeled -- the viewer will think it is missing data.

**The user's existing organizational template violates multiple best practices (e.g., 3D bars, dark background, centered titles, low-contrast colors).**
Do not silently apply the template. State clearly: "Your current template includes [specific elements] that reduce chart readability and data accuracy. Here is the specification following your template, and here is an alternative specification following best practices. If you have the authority to update the template, the alternative will produce more readable charts. If you must use the existing template, these are the highest-priority elements to change within that constraint: [ranked list of 3-5 most impactful changes]." Always give the user both options -- the compliant version and the best-practice version -- so they can choose based on their organizational context.

**The chart will be embedded in an email with unknown rendering environments.**
Email clients (Outlook, Gmail, Apple Mail) render images differently, and some block images by default. Use PNG format at 2x resolution (e.g., export at 1600px wide for a 800px display width) for retina display compatibility. Avoid SVG -- most email clients do not render it. Design at 600px wide maximum (standard email content width). All critical information must be readable at 600px width -- this means larger fonts (minimum 14pt for labels), fewer data points, and no small-print footnotes. Add alt text to the image that describes the chart finding: "Bar chart showing Q3 revenue by region. Northeast led with $4.2M, 40% above the next region." Include the key finding as plain text below the chart image -- some recipients will see only the alt text.

---

## Example

**Input:** "I have a line chart showing quarterly net promoter score (NPS) for three customer segments -- Enterprise, Mid-Market, and SMB -- over eight quarters (Q1 2023 through Q4 2024). It was built in Excel with default formatting: gray background, both horizontal and vertical gridlines, a centered title that says 'NPS by Segment,' values on every data point, a bordered legend in the top-right, and lines in the default Excel blue/orange/gray. It goes into a board-level PDF report. Our brand font is Inter."

---

**Output:**

## Chart Formatting Specification

---

### Chart Context

| Element                | Value                                                         |
|------------------------|---------------------------------------------------------------|
| Chart type             | Multi-series line chart                                       |
| Display medium         | Board-level PDF report (printed and screen PDF)               |
| Dimensions             | 6.5 inches wide x 3.5 inches tall (full text-width column)   |
| Data points per series | 8 (Q1 2023 -- Q4 2024)                                       |
| Number of series       | 3 (Enterprise, Mid-Market, SMB)                               |
| Key message            | Identify which segment is trending positively or negatively and the magnitude of any divergence |
| Brand constraints      | Font: Inter (all weights available)                           |

---

### Quick Reference (Top 6 Specs)

| Spec               | Value                                              |
|--------------------|----------------------------------------------------|
| Title font         | Inter, 14pt, SemiBold, #1A1A1A                     |
| Axis tick font     | Inter, 10pt, Regular, #555555                      |
| Primary data color | Enterprise: #1A6EBF, Mid-Market: #E07B39, SMB: #888888 (muted) |
| Gridline style     | Horizontal only, #E5E5E5, 0.5pt                    |
| Data labels        | Selective -- Q4 2024 endpoint only per series      |
| Legend             | Direct labels at line endpoints (no separate legend) |

---

### Title and Subtitle

| Element         | Specification                                                              |
|-----------------|----------------------------------------------------------------------------|
| Title text      | "Enterprise NPS Has Improved 18 Points While SMB Has Declined Since Q3 2023" |
| Title font      | Inter, 14pt, SemiBold, #1A1A1A                                             |
| Title alignment | Left-aligned                                                               |
| Title case      | Title Case                                                                 |
| Subtitle text   | "Net Promoter Score by customer segment, Q1 2023 -- Q4 2024. Scores range from -100 to +100." |
| Subtitle font   | Inter, 10pt, Regular, #666666                                              |
| Subtitle case   | Sentence case                                                              |
| Vertical spacing| 4pt between title and subtitle; 12pt between subtitle and chart area       |

---

### Axis Formatting

| Axis | Label Text      | Font     | Range        | Tick Interval | Label Rotation | Axis Line | Gridlines               |
|------|-----------------|----------|--------------|---------------|----------------|-----------|-------------------------|
| X    | (none needed -- quarters are self-explanatory) | Inter, 10pt | Q1 2023 -- Q4 2024 | Quarterly (all 8 labels) | 0 degrees | Off | Off |
| Y    | NPS Score       | Inter, 10pt | 0 to 80     | 20-point intervals (0, 20, 40, 60, 80) | 0 degrees | Off | On: #E5E5E5, 0.5pt |

**Axis Notes:**
- Y-axis range: Enterprise sits around 55-72, Mid-Market 38-52, SMB 44-32 (declining). Range of 0-80 captures all three with headroom. Do not start at negative values -- none of the scores are negative and starting at 0 avoids distorting the distance between series.
- Add year demarcation: Place a thin vertical reference line at the boundary between Q4 2023 and Q1 2024 (#CCCCCC, 0.75pt, dashed) to help the viewer split the two calendar years visually. Label it "2024" just above the X-axis.
- Y-axis interval of 20 produces 4 gridlines -- clean and sufficient for an NPS scale.

---

### Data Element Formatting

| Element                 | Color    | Line Weight | Marker     | Effects |
|-------------------------|----------|-------------|------------|---------|
| Enterprise series       | #1A6EBF  | 2.5pt solid | Filled circle, 5px | None |
| Mid-Market series       | #E07B39  | 2pt solid   | Filled square, 5px | None |
| SMB series (declining)  | #888888  | 1.5pt solid | Filled diamond, 5px | None |

**Series Notes:**
- Enterprise and Mid-Market are the two focal series (the divergence story). SMB is context -- slightly lighter line weight visually subordinates it without hiding it.
- Use distinct marker shapes (circle, square, diamond) in addition to color to distinguish series for black-and-white printing and color vision accessibility.
- Do not use Excel's default blue/orange/gray -- the default gray is too close to the gridline color (#E5E5E5) and will appear to disappear. Use #888888 (medium gray) for SMB to maintain 4:1 contrast against the white background.

---

### Data Labels

| Setting         | Value                                                        |
|-----------------|--------------------------------------------------------------|
| Visibility      | Selected points only                                         |
| Which points    | Q4 2024 endpoint for each series (the current state), and the Q3 2023 inflection point for SMB where decline begins |
| Position        | Right of the endpoint marker (aligned with direct series label) |
| Number format   | Integer (NPS scores are whole numbers): "72", "48", "31"     |
| Font size       | 9pt                                                          |
| Font weight     | Regular (the direct label beside it carries the series name) |
| Font color      | Matching series color                                        |

**Notes:** With 8 data points and 3 series (24 total labels), showing all labels would create severe overlap. The four selective labels (3 endpoints + 1 inflection point) convey the essential quantitative information without clutter. Gridlines handle value estimation for intermediate quarters.

---

### Legend

| Setting              | Value                                                       |
|----------------------|-------------------------------------------------------------|
| Visibility           | Hidden (replaced by direct labels)                          |
| Direct label placement | Right end of each line, 6pt to the right of the Q4 2024 marker, vertically offset if lines converge |
| Label text           | "Enterprise", "Mid-Market", "SMB"                           |
| Label font           | Inter, 10pt, SemiBold, in matching series color             |
| Label alignment      | Left-aligned to a consistent X position (right edge of chart area + 6pt) |

**Notes:** Lines diverge at Q4 2024 (Enterprise high, SMB low, Mid-Market middle), so direct labels do not overlap at the endpoint. If lines converged, stagger label Y-positions by 12pt. Chart area width should account for direct label width -- add approximately 0.8 inches of right margin to the 6.5-inch total width, making the actual plot area approximately 5.7 inches wide.

---

### Annotations and Reference Lines

| # | Type           | Text                                | Position                              | Style                                              |
|---|----------------|-------------------------------------|---------------------------------------|----------------------------------------------------|
| 1 | Reference line | "Industry benchmark: 45"            | Horizontal dashed line at Y=45        | #AAAAAA, 1pt, dashed 4pt/3pt; label at left edge of line, Inter 9pt, #AAAAAA |
| 2 | Annotation     | "SMB decline begins"                | Q3 2023 data point on SMB series      | Thin connector 0.75pt #888888, no arrowhead; text box no border, Inter 9pt, #555555 |
| 3 | Year divider   | "2024"                              | Above X-axis at Q4 2023 / Q1 2024 boundary | #CCCCCC vertical dashed line, 0.75pt; label Inter 9pt, #AAAAAA |

**Notes:** The industry benchmark line at 45 contextualizes the Mid-Market score (hovering near the benchmark) and shows SMB has fallen below it. Three annotations is the maximum -- the year divider is a light reference marker rather than a full annotation, so it does not compete visually with the two substantive annotations.

---

### Elements Removed (Chart Junk Eliminated)

| Element Removed              | Reason                                                                                             |
|------------------------------|----------------------------------------------------------------------------------------------------|
| Gray plot area background    | Adds no information; reduces contrast of all overlaid elements; use white                          |
| Vertical gridlines           | X-axis categories (quarters) do not benefit from grid reference -- viewers do not estimate X positions |
| Centered title               | Left alignment anchors to reading direction and is faster to parse; centered title replaced with finding-based left-aligned text |
| Bordered legend box          | Border draws the eye away from the data; direct labels eliminate the need entirely                 |
| All 24 data point labels     | 24 labels on an 8-quarter, 3-series chart overlap severely and compete with the data lines; replaced by 4 selective labels |
| Excel default shadows on markers | Drop shadows add ink without encoding information and blur marker positions                    |
| Chart area outer border      | No information content; adds a frame that implies the chart is a discrete object rather than part of the page |
| X-axis gridlines             | Redundant with direct quarter labels on the X-axis                                                 |
| Default Excel colors (#4472C4, #ED7D31, #A5A5A5) | Default gray is too close to gridline color; replaced with intentional palette with sufficient contrast ratios |

---

### Implementation Notes

- **Print verification:** Export the chart as a grayscale PDF to verify that the three series remain distinguishable without color. Enterprise (#1A6EBF, dark) / SMB (#888888, medium) / Mid-Market (#E07B39, medium-dark) may collapse to similar gray values. If so, add pattern reinforcement: Enterprise solid line stays, Mid-Market becomes long-dash, SMB becomes short-dash.
- **Chart area margin:** Reserve 0.85 inches of right margin for direct labels. In Excel, set the plot area right boundary to approximately 80% of the chart width, leaving the remaining 20% for labels and white space.
- **NPS scale note:** NPS ranges from -100 to +100, but all values in this dataset are positive (0-80). Starting the Y-axis at 0 rather than -100 is appropriate here -- it does not truncate bars (this is a line chart), and it correctly shows the actual spread of variation in the data.
- **PDF optimization:** Export at 300 DPI minimum for print PDF. Use the PDF/A standard if the document will be archived. Embed the Inter font to prevent substitution on systems that do not have Inter installed.
