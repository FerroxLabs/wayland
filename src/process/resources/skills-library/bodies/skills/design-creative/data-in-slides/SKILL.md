---
name: data-in-slides
description: |
  Produces chart specifications for presentation slides including chart type
  selection for each data comparison, simplified data optimized for
  presentations, and insight headlines above each chart. Uses Decision 8
  chart selection logic with presentation-specific simplification.
  Use when the user asks to add data or charts to a presentation, visualize
  data in slides, or show numbers in a slide deck.
  Do NOT use for standalone data visualization outside presentations (use
  chart-type-selector), full dashboard design (use dashboard-design), or
  slide deck overall structure (use slide-deck-structure).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "presentation data-visualization template"
  category: "design-creative"
  subcategory: "presentation-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Data In Slides

## When to Use

Use this skill when the user's request falls into one of these scenarios:

- The user asks to add charts, graphs, or data visualizations to a presentation deck and needs to know which chart type to use and how to configure it
- The user has raw data (spreadsheet values, survey results, financial metrics, operational KPIs) and wants to translate it into presentation slides for a specific audience
- The user needs to simplify complex or high-volume data into a presentation-ready form -- reducing categories, rounding numbers, and surfacing a single headline insight per slide
- The user is preparing a business review (quarterly business review, board deck, investor update, sales kickoff) and needs data slides that communicate clearly at projection distance and at the pace of a live presentation
- The user wants to know how to write slide headlines that state conclusions rather than chart descriptions -- the "insight headline" pattern
- The user has a specific analytical comparison in mind (ranking, trend, part-to-whole, before/after, single metric callout) and wants the right chart type mapped to that comparison type
- The user asks how to highlight a key data point visually -- which bar to color, where to put callout text, how to de-emphasize context data without removing it

**Do NOT use this skill when:**

- The user needs a complete slide deck built from scratch -- use `slide-deck-structure` to define the narrative arc and slide sequence first, then use this skill for the data slides within that structure
- The user needs a standalone data visualization for a report, PDF, or web page that will not be presented live -- use `chart-type-selector` instead, which allows higher data density and more complex chart types appropriate for self-paced reading
- The user is designing a business dashboard with multiple simultaneous metrics -- use `dashboard-design`, which handles layout grids, filter controls, and real-time data considerations that are irrelevant in presentation contexts
- The user needs to perform data analysis, calculate statistics, or interpret raw data before deciding what to visualize -- use a data-analysis skill to derive the insight first, then return to this skill to visualize the result
- The user needs an infographic (qualitative diagrams, process flows, icon-based statistics) rather than quantitative charts -- use an infographic design skill that handles icon selection and illustrative layouts

---

## Process

### Step 1: Establish the Analytical Intent Before Touching Chart Types

The single most common mistake in presentation data design is choosing a chart type before articulating what comparison the data is meant to make. Chart type selection is deterministic once the comparison type is known. Always resolve the analytical intent first.

Ask the user -- or infer from context -- which of these six comparison types applies:

- **Ranking:** Which categories have more or less of something? (market share by competitor, NPS by region, revenue by product line)
- **Trend:** How has a single value or multiple values changed over time? (monthly revenue, quarterly churn rate, weekly active users over 12 months)
- **Part-to-whole:** What proportion does each category represent of the total? (budget allocation, revenue mix by segment, headcount by department)
- **Before/After or Point Comparison:** How do two specific states differ? (this year vs. last year, actual vs. target, with-feature vs. without-feature)
- **Correlation/Relationship:** Does one variable move with another? (spend vs. conversion rate, team size vs. output, price vs. demand)
- **Single Metric with Context:** What is the headline number and how does it compare to a reference? (current ARR vs. target, NPS score vs. industry benchmark, deal close rate vs. last quarter)

If the data could support multiple comparison types, ask which conclusion the presenter needs the audience to walk away with. The comparison type is a communication decision, not a mathematical one.

### Step 2: Select the Chart Type Using Decision 8 Logic

Once the comparison type is confirmed, map directly to the chart type. Do not deviate from this mapping without an explicit reason.

| Comparison Type | Recommended Chart | Slide-Specific Constraints | Never Use Instead |
|---|---|---|---|
| Ranking | Horizontal bar chart | Max 7 bars; sort descending by value, never alphabetically | Vertical bar (labels truncate), pie chart |
| Trend (1-2 series) | Line chart | Annotate start and end values on the line itself; no more than 3 lines | Area chart with fill (obscures crossover), bar chart for time data |
| Trend (3-4 series) | Line chart with emphasis | Highlight 1-2 lines in color, gray out context lines | Stacked area (impossible to read individual series) |
| Part-to-whole (1 level) | Donut chart | Max 5 segments; label percentages inside or adjacent; leave hole empty | Pie chart (donut is visually clearer at distance), 3D pie |
| Part-to-whole (2 levels) | 100% stacked horizontal bar | Use for comparing composition across 2-4 groups side by side | Nested donut (illegible on projected screens) |
| Before/After or Point Comparison (2 values) | Two large numbers side by side with arrow | Show the delta prominently; no chart needed | Bar chart with 2 bars (underuses the emotional impact of large numbers) |
| Before/After or Point Comparison (3-7 values) | Clustered bar chart (side-by-side pairs) | Group by category, not by time period | Grouped bar with >3 groupings (becomes unreadable) |
| Correlation | Scatter plot | Only if the audience is analytically literate; add trend line; label only outliers | Line chart (implies sequence, not relationship) |
| Distribution | Do not use histogram in presentations | Replace with: "median was X, 80% of respondents fell between Y and Z" as a stat callout | Histogram, box plot (too technical for presentation pace) |
| Single Metric | Large number with comparison | 72pt+ font for the primary number; secondary comparison in 24-28pt below | Any chart type (overkill for one number) |

**Absolute prohibitions for presentation charts:**
- **3D charts of any kind:** They distort proportional accuracy and are never worth the visual interest they create
- **Dual-axis charts:** Two Y-axes require the audience to pause and decode the chart while the presenter is speaking -- live audiences will misread them
- **Pie charts:** Humans cannot accurately compare arc lengths; donut charts are marginally better only because the central hole eliminates the misleading area comparison at the center
- **Waterfall charts:** Acceptable in financial reports read at the reader's own pace; not appropriate for live presentation contexts unless the audience is a finance team familiar with the format

### Step 3: Simplify the Data to Presentation Resolution

Presentations operate at a different data resolution than reports or dashboards. A report can show 24 months of data across 12 product lines. A slide can show 4-6 time periods across 3-4 product lines. Apply these reductions methodically:

**Category reduction:**
- If ranking data has more than 7 categories, show the top 5 by value and group everything below into a single "All others" bar. Label "All others" with its aggregate value so the chart remains arithmetically honest.
- If trend data has more than 4 series, identify the 2 most important series for the insight (the ones the headline references) and show 1-2 context series in gray. Drop the rest entirely or note them in a footnote.
- If part-to-whole data has more than 5 segments, group the smallest into "Other." The threshold: any segment below 5% of the total should be considered for grouping unless it is the specific segment the insight is about.

**Time period reduction:**
- Monthly data over 2+ years: aggregate to quarters unless the insight is about a specific month
- Monthly data for 1 year: show all 12 months only if the trend pattern requires it; otherwise show Q1 through Q4
- Daily or weekly data: never show in a presentation; aggregate to the level that makes the trend visible without noise
- Label only the time periods that matter: the start, the end, and any inflection points. Do not label every period.

**Number rounding rules (mandatory):**
- Millions: $4,287,341 → $4.3M (one decimal place; drop the "4.30M" trailing zero)
- Billions: $1,847,000,000 → $1.8B
- Percentages: 67.4% → 67% for rankings and part-to-whole; 67.4% → 67% unless the decimal is the insight (e.g., "just barely above the 67.3% threshold")
- Large counts: 147,382 users → 147K users
- Ratios: 3.27x → 3.3x; never more than one decimal place
- Currency with units: always include the unit on the first label; subsequent labels can omit it if the unit is established

**Contextual anchoring (mandatory):**
A number without a reference point has no emotional weight for an audience. Every data point that appears on a slide must have at least one comparison point:
- vs. prior period (year-over-year, quarter-over-quarter, month-over-month)
- vs. target or plan
- vs. industry benchmark or competitor
- vs. a stated threshold (regulatory minimum, SLA requirement, satisfying threshold)
- vs. the same metric for a different segment shown on the same chart

### Step 4: Write the Insight Headline

The insight headline is the most leveraged sentence in the entire presentation. An executive who sees nothing but the headline during a fast slide transition should still understand what the slide is trying to communicate.

**The headline is a conclusion, not a label.**

Diagnostic test: Read the headline aloud. If someone could respond "so what?" the headline is a label, not an insight.

| Label headline (wrong) | Insight headline (right) |
|---|---|
| "Q3 Revenue by Region" | "Western region drove 60% of Q3 revenue growth" |
| "Customer Satisfaction Scores" | "API Suite satisfaction fell 11 points -- the only product below target" |
| "Headcount by Department" | "Engineering grew 40% while Sales headcount stayed flat" |
| "Monthly Active Users" | "MAU crossed 1M for the first time in October, up from 820K in January" |
| "Budget Allocation" | "72% of the budget is in three programs -- talent, cloud, and marketing" |

**Headline writing rules:**
- State the most important number in the headline. "60% of growth" is more compelling than "Western region was the growth leader."
- If there are two important numbers, include both in one sentence: "Cloud Platform surged 17 points while API Suite fell 11"
- Keep headlines to one line (under 80 characters) where possible; two lines at most
- Never use hedge language in headlines: "appears to show," "may indicate," "potentially suggests" -- these signal a presenter who does not trust their own data
- If the data genuinely does not support a clear conclusion, say so directly: "Q3 results were flat -- no region outperformed by more than 2 points"

### Step 5: Define the Visual Emphasis Strategy

Every data slide should have exactly one visually dominant element that is the focus of the audience's attention. The rest of the chart provides context but should not compete visually.

**Color assignment:**
- The data point or series that the insight headline references gets the **primary accent color** -- typically the brand's primary action color (often a saturated blue, green, or red appropriate to the message direction)
- All other data points receive a **neutral gray** (recommended: #9B9B9B or similar mid-gray that reads clearly on both light and dark slide backgrounds)
- Use **red or warm orange** for a declining or negative metric; **blue or green** for a rising or positive metric; **gray** for context data
- Never use more than 2 distinct accent colors on a single chart. The moment you have 3 colors, the audience's eye does not know where to go.
- If the chart is a trend line comparison, the highlighted series should be 2-2.5x the stroke weight of the gray context lines

**Annotations and callouts:**
- Place annotation text directly adjacent to the data point it references -- do not rely on legends for the most important data
- Use callout box style: a small leader line pointing to the data point with a brief label ("74 -- below target")
- Show the delta as the annotation, not the absolute value, when the insight is about change: "+17 pts" not "89"
- Add a target or benchmark line as a dashed horizontal line when the insight is about whether a metric crossed a threshold

**What to remove:**
- Remove the Y-axis entirely if you annotate key values directly on the chart -- axes are reference tools, annotations are communication tools
- Remove grid lines entirely for presentations; if gridlines are needed for readability, use one set of light horizontal lines only (no vertical)
- Remove the chart border
- Remove the legend if all series are labeled directly on the chart (preferred) or if there is only one series

### Step 6: Design the Slide Layout

A data slide has five zones. Every element must be placed in exactly one zone. Do not layer elements across zones.

```
┌─────────────────────────────────────────────────────────┐
│  INSIGHT HEADLINE                                (Zone 1)│
│  28-32pt bold, left-aligned, max 2 lines                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│     CHART AREA                                 (Zone 2) │
│     60-70% of slide height                              │
│     Centered horizontally or slightly right-weighted   │
│                                                          │
├──────────────────────┬──────────────────────────────────┤
│  KEY CALLOUT         │  SUPPORTING CONTEXT    (Zone 3)  │
│  Left or overlay     │  1-3 short bullets               │
│                      │  or a single stat box            │
├──────────────────────┴──────────────────────────────────┤
│  SOURCE: [Source name], [Date]                 (Zone 4) │
│  9-10pt, gray, bottom-left                              │
└─────────────────────────────────────────────────────────┘
```

**Zone-specific rules:**
- **Zone 1 (Headline):** Never truncate. If the insight needs more than 2 lines, the headline is too long -- rewrite it. No subtitle below the headline unless the subtitle adds a number not in the headline.
- **Zone 2 (Chart):** Maintain at least 15% whitespace margin on all four sides of the chart area. A chart that bleeds to the slide edge looks unpolished. Leave breathing room.
- **Zone 3 (Callout/Context):** Optional zone. Use a single large callout number or 2-3 short bullet points that extend the insight. Never put a second chart in Zone 3 -- that creates a multi-message slide.
- **Zone 4 (Source):** Mandatory. Every data slide must have a source citation. Format: "Source: [Organization name or internal system], [Month Year]"

**Slide background considerations:**
- White or very light gray (#F5F5F5) backgrounds work for most presentation contexts and allow maximum chart contrast
- Dark backgrounds (corporate navy, charcoal) require adjusted chart colors: use lighter neutrals (white-gray series) and bright accent colors; ensure all text is white or very light
- Never use a gradient background behind a data chart -- it creates false color gradations that can interfere with color-coded data

### Step 7: Specify the Complete Chart Configuration

For each slide, produce a complete chart specification that another person could recreate exactly -- or that a slide tool (PowerPoint, Google Slides, Keynote) could be configured to match.

Define each of the following parameters explicitly:

- **Chart type and orientation** (horizontal bar, line, donut, clustered bar, large number)
- **X-axis:** label text or "none"; whether tick labels are shown; rotation if needed
- **Y-axis:** label text or "none"; axis range (always state the minimum and maximum to prevent misleading scaling); whether the axis is visible
- **Data series:** exact column names and values to include; confirm what has been excluded and why
- **Color assignments:** specify which series or data point gets the accent color, which get gray, and the specific color code or descriptor
- **Annotations:** exact text, position, and which data point each annotation references
- **Benchmark/target lines:** the specific value, line style (dashed), and label text
- **Legend:** position or "none"; whether series labels are placed directly on the chart instead
- **Grid lines:** "none" or "light horizontal only"
- **Chart border:** "none"
- **Font sizes:** axis labels (10-12pt), data labels (11-13pt), callout annotations (13-16pt)

---

## Output Format

```
## Data Slides Specification: [Presentation Name or Context]

**Audience:** [executive / business-general / technical-analytical]
**Presentation Format:** [live projected / emailed deck / printed handout / video recording]
**Deck Context:** [Where these slides sit in the overall structure, e.g., "Evidence section, slides 8-12 of 18"]

---

### Slide [N] of [Total]

**Insight Headline:** [Full headline as it appears on the slide -- a conclusion, not a label]
**Sub-headline (optional):** [One-line qualifier if needed, 14-16pt below headline]

**Comparison Type:** [ranking | trend | part-to-whole | before-after | correlation | single metric]
**Chart Type:** [horizontal bar | line chart | donut | stacked bar | clustered bar | scatter | large number callout]
**Justification:** [One sentence explaining why this chart type for this comparison]

**Data (simplified for presentation):**

| [Column Header] | [Column Header] | [Column Header] |
|---|---|---|
| [value] | [value] | [value] |
| [value] | [value] | [value] |
| All others (if applicable) | [aggregate] | -- |

**Data Simplification Applied:**
- Original: [what was in the raw data]
- Shown: [what appears on the slide]
- Excluded: [what was removed and why]
- Rounded: [which values were rounded and to what precision]

**Chart Configuration:**
- X-axis: [label text or "none"] | Range: [min to max] | Tick labels: [shown/hidden]
- Y-axis: [label text or "none"] | Range: [min to max] | Visible: [yes/no]
- Primary accent color: [which series/data point] in [color name or hex]
- Secondary accent color (if needed): [which series] in [color name or hex]
- Neutral color: [remaining series] in [gray descriptor or hex]
- Annotation 1: "[callout text]" pointing to [data point reference]
- Annotation 2 (if needed): "[callout text]" pointing to [data point reference]
- Benchmark line: [value] dashed, labeled "[label text]" or "none"
- Legend: [position: top-right / bottom / none; or "direct labels on chart"]
- Grid lines: [none | light horizontal only at Y-axis increments]
- Chart border: none

**Slide Layout:**
- Zone 1 -- Headline: top-left, [font size]pt bold
- Zone 2 -- Chart: [position and approximate % of slide area]
- Zone 3 -- Callout/Context: [text or stat, position]
- Zone 4 -- Source: "[Source name], [Month Year]" -- bottom-left, 9pt gray

**Production Notes:** [Any specific instructions for the slide builder, e.g., "Use brand red #CC2200 for the declining series, not default red"]

---

[Repeat block for each data slide]

---

## Appendix Data Slides (if applicable)

### Appendix Slide [N]: Full Data Table -- [Topic]

[Full unrounded data table for reference; no chart needed; reference from main slide]
```

---

## Rules

1. **Never select a chart type before confirming the comparison type.** Chart type is the output of a comparison-type decision, not a stylistic preference. "What chart looks good?" is the wrong question. "What comparison am I making?" is the right question.

2. **The insight headline must contain at least one specific number from the data.** Vague insights ("performance improved") are useless. Specific insights ("satisfaction rose 17 points to an all-time high of 89") are actionable. If you cannot put a number in the headline, the slide does not yet have an insight -- it has an observation.

3. **Never use 3D charts, dual-axis charts, or pie charts under any circumstances.** 3D charts distort proportional accuracy. Dual-axis charts require cognitive decoding that a live audience cannot perform while listening to a speaker. Pie charts make arc-length comparisons that humans perform poorly. All three are available in every slide tool and all three should be refused.

4. **Reduce every dataset to 7 data points or fewer on a single chart.** Research on presentation cognition consistently shows that audiences cannot track more than 5-7 distinct items in a chart during a live presentation. If the data has 15 categories, show the top 5 and aggregate the rest. If the trend has 8 series, highlight 2 and gray out 2, then remove the other 4.

5. **Use exactly one accent color per chart to indicate the insight-relevant data point or series.** If you use two accent colors (for example, blue for the winner and red for the biggest loser), this is an explicit two-color strategy: document it. Never use three or more accent colors -- the audience's eye will not know where to look first.

6. **Round all numbers to the minimum precision needed to convey the message.** Precision beyond what is needed creates cognitive noise. The standard: dollar values round to one decimal place at the nearest unit abbreviation ($4.3M); percentages round to whole numbers unless the decimal is the news; ratios round to one decimal place. Never show raw unrounded data in a presentation unless the specific digits are the point.

7. **Every data point shown on a slide must have a comparison reference.** A standalone number (47%) has no meaning. The same number with a reference (47%, up from 31% last year, against a target of 50%) has three layers of meaning. If a comparison reference does not exist for a particular data point, state that explicitly and ask the user to supply one before finalizing the slide.

8. **Source attribution is mandatory on every data slide without exception.** "Source: Internal CRM data, Q4 2024" takes 8 words and 9pt font in the bottom-left corner. Slides without source attribution undermine credibility in board, investor, and executive contexts. If the source is proprietary internal data, say "Internal [System Name] data, [Date]."

9. **One insight per slide.** If the data supports two distinct conclusions (e.g., one product improved while another declined), those are two slides, not one. The exception is a deliberate comparison headline: "Product A improved while Product B declined" -- this is one insight stated with two supporting data points, acceptable on one slide if both data points are visible in a single chart.

10. **Data shown in the presentation must be arithmetically consistent with the source data.** Rounding is acceptable; distortion is not. If you show $4.3M in the slide but the source says $4.28M, that is rounding. If you show $4.3M in the slide because it looks better than $3.9M, that is distortion. Always round in the direction of the true value, never in the direction of the preferred narrative.

11. **Always check that Y-axis scale starts at a meaningful baseline.** A common manipulation: a bar chart with a Y-axis starting at 75 to make a change from 78 to 89 look like a 100% increase in bar height. Either start the axis at zero, or explicitly annotate the true values on the bars and acknowledge the axis starts above zero with a break symbol.

12. **Never label every single data point on a chart.** Label the start value, the end value, and the inflection point on trend lines. Label only the top bar and the bottom bar on ranking charts (readers can estimate the middle values). Label the largest segment and the insight segment on donut charts. Labeling everything clutters the chart and defeats the purpose of visual hierarchy.

---

## Edge Cases

### Data That Does Not Support a Clear Insight

If the data is genuinely flat, mixed, or inconclusive, the insight headline should say exactly that. Write: "No clear regional leader in Q3 -- all markets within 3 points of each other." This is not a failure; it is an insight. Flat data is meaningful in business contexts (it may mean a market has stabilized, that an intervention had no effect, or that external conditions are uniform). Do not manipulate the chart scale to manufacture a visual trend that does not exist in the numbers.

When data is inconclusive, consider: can the presenter use this slide to set up a question for the audience ("Why are all regions performing identically -- is this a data collection issue or a genuine plateau?")? That framing turns an inconclusive slide into a constructive discussion catalyst.

### Very Small Datasets (2-3 Data Points)

Do not use a bar chart or line chart for 2-3 data points. A bar chart with two bars looks empty and the visual mechanism (bar height difference) conveys nothing that two printed numbers would not convey better. Use instead:

- **Two large numbers side by side** with their labels below, a delta indicator (↑17% or +$2.1M) between them, and a brief reference ("vs. prior year" or "vs. target")
- **One large primary number** with the secondary comparison number to its right in smaller text
- Use 64-72pt font for the primary metric and 24-28pt for the comparison figure

### Audience Expects Full Data Detail (Board of Directors, Finance Team, Audit Committee)

Some audiences -- particularly boards, investment committees, and finance teams -- expect to be able to interrogate the data themselves and will ask detailed questions during the presentation. The main slide should still follow presentation simplification rules (headline, simplified chart, insight emphasis). However, always prepare an appendix slide with the full unrounded data in a structured table. Reference the appendix explicitly: "The complete breakdown by month and by region is in Appendix A -- I am happy to walk through that if helpful." The appendix slide does not need a headline; it needs a clear title, well-formatted columns, and row and column totals where appropriate.

### Long Time Series (Monthly or Weekly Data Over Multiple Years)

Never show 36 monthly bars on a bar chart in a presentation. The bars become too narrow to read, and the trend is lost in the granularity. Apply this decision hierarchy:

1. If the insight is about the long-term trajectory: aggregate to annual data (3-5 years shows as 3-5 bars or data points on a line)
2. If the insight is about recent acceleration or deceleration: show the last 4-6 quarters and note on the chart "prior period data available in appendix"
3. If the insight is about a specific event (a policy change, product launch, or crisis): show the 6-month window around the event, annotate the event date with a vertical reference line, and gray out the periods before and after if they are not the point

If monthly granularity is truly required, use a line chart (not bars) and annotate only the relevant months. Gray all other months. A line chart can handle more data points than a bar chart before becoming unreadable.

### Correlation or Regression Data for a Mixed-Literacy Audience

Scatter plots are the correct chart type for correlation data, but they require the audience to understand the implicit meaning of point clouds, clustering, and trend lines. If the audience includes non-analytical senior executives, do not use a scatter plot unless you can explain the chart type in 15 seconds before making your point. Alternative approaches:

- **Narrative replacement:** Replace the scatter plot with a single sentence: "Our analysis of 500 accounts shows that accounts with more than 5 product integrations have 3x lower churn -- the correlation is statistically significant." Show this as a large-number callout, not a scatter plot.
- **Simplified scatter with callout zones:** Use a 2x2 quadrant diagram (high/low on each axis) with representative examples plotted in each quadrant. This is not statistically precise but communicates the pattern to a general audience.
- Reserve true scatter plots for analytical audiences (data science teams, research presentations, academic contexts) where the chart format is understood without introduction.

### Multi-Language or Multi-Currency Presentations

When presenting data that spans multiple currencies or when the audience includes international stakeholders:

- Always specify the currency and the conversion rate used: "$4.3M USD (converted at 1.08 EUR/USD as of [date])"
- If the slide will be presented in a non-English context, column headers and axis labels should be in the audience's primary language -- values and number formats should follow local conventions (European format uses period as thousands separator and comma as decimal separator)
- Do not mix currencies within a single chart without a conversion. A bar chart comparing €2.1M (Europe revenue) and $4.3M (US revenue) is arithmetically misleading unless both are converted to a common currency and labeled as such.

### The "Chart Zoo" Problem -- Multiple Charts Requested for One Slide

Users sometimes ask for multiple charts on a single slide -- for example, "Can I put the revenue chart and the satisfaction chart on the same slide?" For live presentations, the answer is almost always no. Two charts on one slide creates competing attention anchors. The audience cannot watch the presenter, listen to the narration, AND decode two charts simultaneously.

**When to maintain the single-chart-per-slide rule:**
- Always, for live oral presentations to any audience

**When a multi-chart layout is acceptable:**
- Emailed decks read at the recipient's own pace -- a 2-chart layout is acceptable if both charts support the same insight headline
- Printed handouts (conference leave-behinds, analyst packs) -- up to 4 charts per page is acceptable with appropriate labeling
- The slide is explicitly a "summary" or "scorecard" slide at the end of a section -- up to 4 KPI tiles (large number + context) in a 2x2 grid is acceptable as a recap

---

## Example

**Input:** "I need slides showing our SaaS product's performance for a quarterly business review to the executive team. We have: ARR is $12.4M, up from $9.8M last year. Net Revenue Retention is 118%, up from 109% last year. Churn rate by customer segment -- Enterprise 2%, Mid-Market 8%, SMB 21%. Customer count grew from 840 to 1,140 this year. CAC payback period is 14 months, down from 19 months. Gross margin is 74%, steady from last year."

**Output:**

---

## Data Slides Specification: SaaS Quarterly Business Review

**Audience:** Executive team (CEO, CFO, board observers) -- executive data literacy, scanning for key conclusions, limited tolerance for chart explanation
**Presentation Format:** Live projected, 16:9 widescreen
**Deck Context:** Performance evidence section, following narrative slides that set up the growth story -- these slides provide the quantitative proof

---

### Slide 1 of 5

**Insight Headline:** ARR reached $12.4M -- 27% year-over-year growth, ahead of 25% target

**Comparison Type:** Single metric with before/after context
**Chart Type:** Large number callout with comparison
**Justification:** A single primary metric with year-over-year context is more impactful as a large number layout than a two-bar chart -- the emotional weight of the number at large scale communicates better than bar height difference

**Data (simplified for presentation):**

| Metric | Value |
|---|---|
| Current ARR | $12.4M |
| Prior Year ARR | $9.8M |
| YoY Growth | +27% |
| Target Growth | 25% |
| ARR vs. Target | +$0.4M above target |

**Data Simplification Applied:**
- Original: $12,387,000 current; $9,801,000 prior year
- Shown: $12.4M and $9.8M
- Excluded: Monthly ARR progression (available in appendix if board requests it)
- Rounded: Both values to one decimal place at the million level; growth rate rounded to whole percent (actual: 26.4%, shown as 27% -- note that 27% rounds favorably from 26.4%; confirm with user whether to show 26% to be conservative or 27% for rounding-up convention)

**Chart Configuration:**
- Layout: Large number display, no chart axes
- Primary large number: "$12.4M" -- centered, 72pt bold, brand blue
- Secondary figure: "$9.8M last year" -- below and right, 24pt, gray
- Delta callout: "+27%" with upward arrow, 36pt, brand blue, between the two figures
- Target reference: "Target: 25% growth (+$2.5M)" in gray below the delta -- shows the beat
- Benchmark line: none (not a chart, so N/A)
- Legend: none
- Grid lines: none

**Slide Layout:**
- Zone 1 -- Headline: "ARR reached $12.4M -- 27% year-over-year growth, ahead of 25% target" -- top-left, 28pt bold
- Zone 2 -- Primary number: "$12.4M" centered at 72pt, "$9.8M last year" at 24pt gray below-right
- Zone 3 -- Delta and context: "+27% ↑" in brand blue 36pt; "Target was 25%" in gray 18pt below it
- Zone 4 -- Source: "Source: Internal billing system (Stripe), Q4 2025" -- bottom-left, 9pt gray

**Production Notes:** The "+27%" delta figure should be the second-largest element on the slide after "$12.4M" -- it is the proof that the headline's "ahead of target" claim is true. Do not make the prior-year figure or the target figure compete visually.

---

### Slide 2 of 5

**Insight Headline:** Net Revenue Retention hit 118% -- existing customers are expanding faster than they churn

**Comparison Type:** Single metric with before/after and threshold context
**Chart Type:** Large number callout with comparison and benchmark line reference
**Justification:** NRR is a single executive KPI; the most important context points are the year-over-year improvement and the 100% threshold (the break-even point between expansion and contraction). A large number layout with a clear 100% reference communicates this instantly.

**Data (simplified for presentation):**

| Metric | Value |
|---|---|
| Current NRR | 118% |
| Prior Year NRR | 109% |
| YoY Change | +9 percentage points |
| Industry benchmark (SaaS median) | 106% |
| Threshold meaning | >100% = expansion exceeds churn |

**Data Simplification Applied:**
- Original: NRR values are typically calculated to one decimal place (e.g., 118.3% and 109.1%); rounded to whole percentages for executive presentation
- Excluded: NRR by customer segment (SMB NRR is likely significantly below 100%; if shown, it will require explanation -- move to appendix or a dedicated slide)
- Rounded: To nearest whole percentage point

**Chart Configuration:**
- Layout: Large number display, no chart axes
- Primary large number: "118%" -- centered, 72pt bold, brand green (growth color)
- Secondary figure: "109% last year" -- 24pt gray, below and right
- Delta callout: "+9 pts" -- 36pt green with upward arrow
- Threshold reference: A visual horizontal rule at the "100% = break-even" level with the label "100% = zero net churn" in gray 14pt -- not a Y-axis, just a labeled reference line integrated into the layout
- Industry benchmark callout: Small box to the right: "Industry median: 106%" in gray
- Legend: none

**Slide Layout:**
- Zone 1 -- Headline: top-left, 28pt bold
- Zone 2 -- "118%" at 72pt centered, with "109% last year" at 24pt gray below-right
- Zone 3 -- Delta "+9 pts ↑" at 36pt green; "100% = zero net churn" reference line; "Industry median: 106%" in gray box right side
- Zone 4 -- Source: "Source: Internal subscription analytics, Q4 2025" -- bottom-left, 9pt gray

---

### Slide 3 of 5

**Insight Headline:** SMB churn at 21% is masking strong Enterprise retention -- segments are diverging

**Comparison Type:** Ranking with emphasis on divergence
**Chart Type:** Horizontal bar chart (3 bars, sorted descending by churn rate)
**Justification:** Three customer segment churn rates require a comparison across categories (ranking comparison). Horizontal bars allow the segment names to display clearly without truncation. The visual divergence between 21% SMB and 2% Enterprise is the insight.

**Data (simplified for presentation):**

| Segment | Annual Churn Rate | Direction vs. Prior Year |
|---|---|---|
| SMB | 21% | worsening |
| Mid-Market | 8% | stable |
| Enterprise | 2% | improving |

**Data Simplification Applied:**
- Original: All values rounded from decimal data (SMB: 20.7% → 21%; Mid-Market: 7.9% → 8%; Enterprise: 2.1% → 2%)
- Excluded: Monthly churn progression by segment (available in appendix)
- Shown order: Sorted highest to lowest churn (SMB first) -- this order emphasizes the problem at the top and the strength at the bottom, matching the insight narrative

**Chart Configuration:**
- X-axis: "Annual Churn Rate (%)" -- label shown; range 0% to 25% (starts at zero -- mandatory); tick marks at 0%, 5%, 10%, 15%, 20%, 25%
- Y-axis: Segment names -- "SMB", "Mid-Market", "Enterprise" -- no axis label needed
- Primary accent color: SMB bar in brand red (#CC2200) -- the problem data point
- Secondary accent color: Enterprise bar in brand green (#1A7A3C) -- the strength data point
- Neutral color: Mid-Market bar in mid-gray (#9B9B9B)
- Annotation 1: "21%" value label at the end of the SMB bar, in white inside the bar, 14pt bold
- Annotation 2: "2%" value label at the end of the Enterprise bar, in white inside the bar, 14pt bold
- Annotation 3: "8%" value label for Mid-Market, 14pt gray
- Callout box on SMB bar: "Requires intervention" -- small red callout box with leader line, 12pt
- Callout box on Enterprise bar: "World-class retention" -- small green callout box, 12pt
- Benchmark line: Vertical dashed line at 5% labeled "5% = industry benchmark" in gray 10pt (this makes Enterprise's position below benchmark even more striking)
- Legend: none -- bars are directly labeled with segment names on Y-axis
- Grid lines: none
- Chart border: none

**Slide Layout:**
- Zone 1 -- Headline: "SMB churn at 21% is masking strong Enterprise retention -- segments are diverging" -- top-left, 28pt bold (note: this headline is 2 lines; acceptable given the dual-insight content that is intentionally one slide because the divergence IS the single insight)
- Zone 2 -- Horizontal bar chart, left-aligned, 65% of slide width, centered vertically
- Zone 3 -- Right of chart: Two stat tiles stacked -- "Enterprise: 2% churn" in green and "SMB: 21% churn" in red, each at 24pt with directional arrows (↓ improving for Enterprise, ↑ worsening for SMB)
- Zone 4 -- Source: "Source: Internal CRM churn data, Q4 2025" -- bottom-left, 9pt gray

**Production Notes:** The benchmark line at 5% is important -- without it, 2% and 8% look like they are in similar territory. The 5% reference makes Enterprise's 2% look exceptional and Mid-Market's 8% look above-acceptable. Confirm whether the 5% median is the right benchmark for this specific SaaS category (horizontal SaaS median churn tends to be 5-7% annually; vertical SaaS can vary significantly).

---

### Slide 4 of 5

**Insight Headline:** Customer count grew 36% to 1,140 -- growth rate accelerating into Q4

**Comparison Type:** Before/after with trend context
**Chart Type:** Large number with YoY comparison (two numbers side by side plus percentage delta)
**Justification:** The count data has only two primary reference points (start of year: 840, end of year: 1,140). Two data points do not warrant a bar chart. A side-by-side large number layout communicates the magnitude of the jump more effectively.

**Data (simplified for presentation):**

| Period | Customer Count | Net New Customers |
|---|---|---|
| Start of Year | 840 | -- |
| End of Year | 1,140 | +300 |
| Growth Rate | +36% | -- |

**Data Simplification Applied:**
- Original customer counts are whole numbers -- no rounding needed
- Excluded: Monthly new customer acquisition progression (if available, move to appendix; Q4 acceleration claim in headline needs support -- either show quarterly breakdown or remove the "accelerating into Q4" qualifier from the headline if data is not available to support it)
- Important: The headline includes "growth rate accelerating into Q4" -- confirm with user that Q4 specifically showed higher net adds than Q1-Q3 before including this qualifier. If not verifiable, simplify headline to "Customer count grew 36% to 1,140 -- 300 net new customers this year"

**Chart Configuration:**
- Layout: Two large numbers side by side, no chart axes
- Left number: "840" at 48pt gray (prior year, de-emphasized)
- Center: Arrow "→ +300 customers → +36% ↑" at 32pt brand blue
- Right number: "1,140" at 72pt brand blue (the destination number -- the headline number)
- Below right number: "End of year" label at 16pt gray
- Below left number: "Start of year" label at 16pt gray
- Optional quarterly bar chart (small, inset): If quarterly data is available, a small 4-bar chart (Q1-Q4 net new customers) in the lower right of Zone 3 shows the acceleration narrative
- Legend: none

**Slide Layout:**
- Zone 1 -- Headline: top-left, 28pt bold
- Zone 2 -- Side-by-side numbers as specified, centered
- Zone 3 -- If quarterly breakdown available: small bar chart showing quarterly net adds, 30% of slide width, bottom-right; otherwise a single stat: "+300 net new customers in 2025"
- Zone 4 -- Source: "Source: Internal CRM, Q4 2025" -- bottom-left, 9pt gray

---

### Slide 5 of 5

**Insight Headline:** CAC payback improved from 19 to 14 months -- sales efficiency at a 3-year high

**Comparison Type:** Before/after comparison with trend context
**Chart Type:** Two large numbers side by side with delta callout (same pattern as customer count slide; consistent format signals a "financial efficiency metric" category to the audience)
**Justification:** Two data points; large-number format is appropriate. The benchmark context (what is "good" for CAC payback in SaaS) is as important as the year-over-year improvement.

**Data (simplified for presentation):**

| Metric | Value |
|---|---|
| Current CAC Payback Period | 14 months |
| Prior Year CAC Payback Period | 19 months |
| Improvement | -5 months (-26%) |
| SaaS benchmark (efficient) | <18 months |
| Gross Margin | 74% (flat YoY -- not the driver of payback improvement) |

**Data Simplification Applied:**
- No rounding needed on month figures
- Gross margin (74%, flat) included as a supporting context note, not as a primary chart element -- it confirms that the payback improvement came from sales efficiency, not from margin expansion
- "3-year high" qualifier in headline requires historical data to support -- confirm with user that prior years showed 22+ months or similar to justify this superlative

**Chart Configuration:**
- Layout: Two large numbers side by side
- Left number: "19 months" at 48pt gray
- Center: Arrow "→ -5 months → -26% ↓ (improvement)" at 28pt green
- Right number: "14 months" at 72pt brand green (positive direction -- shorter payback is better)
- Benchmark callout: Below the right number -- "Industry benchmark: <18 months" in gray -- shows the company is now within efficient range
- Supporting note: Bottom of Zone 3 -- "Gross margin steady at 74% -- payback improvement driven by sales efficiency" at 16pt gray (this pre-empts the CFO question "did payback improve because margins went up?")
- Legend: none

**Slide Layout:**
- Zone 1 -- Headline: top-left, 28pt bold
- Zone 2 -- Side-by-side number layout as specified, centered
- Zone 3 -- Benchmark callout and gross margin supporting note
- Zone 4 -- Source: "Source: Internal finance model, Q4 2025" -- bottom-left, 9pt gray

**Production Notes:** In the QBR context, the CFO will immediately ask whether the payback improvement is a gross margin effect. The pre-emptive "Gross margin steady at 74%" note in Zone 3 deflects that question before it is asked. This is an example of anticipating audience questions in the slide design.

---

## Appendix Slides (Recommended)

### Appendix A: Monthly ARR Progression, Q1-Q4 2025

Full month-by-month ARR data table; no chart needed; reference from Slide 1 if board requests detail.

### Appendix B: NRR by Customer Segment

SMB NRR, Mid-Market NRR, and Enterprise NRR separated -- note that SMB NRR is likely below 100% and requires explanation; present with context or defer to a separate discussion.

### Appendix C: Full Churn Data by Month and Segment

Monthly churn rates for all three segments over all four quarters; supports Slide 3 claims about segment divergence.
