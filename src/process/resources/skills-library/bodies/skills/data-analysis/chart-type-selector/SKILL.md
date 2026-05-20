---
name: chart-type-selector
description: |
  Determines the correct chart type for a specific data comparison by applying chart selection logic based on analytical intent (ranking, trend, distribution, composition, correlation, geographic). Produces a complete chart specification with axis assignments, color palette, labels, and formatting rules.
  Use when the user has data to visualize and needs to know which chart type to use or wants a full chart configuration.
  Do NOT use for dashboard layout with multiple charts (use dashboard-design), formatting an existing chart (use chart-formatting), or choosing colors (use color-in-data).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-visualization analysis design"
  category: "data-analysis"
  subcategory: "data-visualization"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Chart Type Selector

## When to Use

**Use this skill when:**
- A user presents a dataset or data description and asks "what chart should I use?" or "how should I visualize this?" -- including cases where they describe fields, rows, and the question they want to answer
- A user has selected a chart type and wants validation -- especially when they have chosen a pie chart for more than 6 segments, a 3D chart, or a bar chart for a continuous time series
- A user wants a complete chart configuration, not just a type recommendation -- including axis assignments, scale decisions, color assignments, annotation placement, and title wording
- A user is building a single-chart slide for an executive presentation and needs the visualization to communicate one clear finding
- A user's data has multiple possible analytical framings (e.g., data can be framed as a comparison, trend, or composition) and they need help choosing which framing is most powerful
- A user is encoding more than two variables in a single chart and needs guidance on which visual channels (position, size, color, shape) to assign to which fields
- A user is preparing a chart for a public-facing report, publication, or accessible document where visual accuracy and clarity standards are higher than average
- A user wants to replace an existing chart that is not communicating effectively -- they describe what is wrong with the current chart and want a better alternative

**Do NOT use when:**
- The user needs to lay out multiple charts together as a dashboard with filters, drill-downs, or shared context -- use `dashboard-design` instead
- The user already knows the chart type and wants to adjust padding, fonts, gridline weight, tick density, or other stylistic properties -- use `chart-formatting` instead
- The user's primary question is which color palette to apply to an existing chart, or whether colors meet accessibility contrast requirements -- use `color-in-data` instead
- The user is designing an infographic where visual metaphors, icons, and narrative layout replace data-accurate charts -- use `infographic-planning` instead
- The user's data is geospatial and the core question is about spatial clustering, routing, or regional aggregation at a level that requires a full GIS analysis -- defer to a mapping-specific skill
- The user wants a data table, not a chart -- some data comparisons (especially precise values with many decimal places) are better served by tables than by visual encoding, and this skill should redirect to that conclusion when appropriate
- The user has fewer than 4 data points total -- a chart is unlikely to be more useful than a simple sentence or formatted number callout

---

## Process

### Step 1: Establish the Single Analytical Question

Before touching chart type, extract the one question the chart must answer. This is not the same as asking what data is available.

- Ask: "What is the one thing a viewer should know after looking at this chart for five seconds?"
- Distinguish between the **data subject** (revenue, users, temperature) and the **analytical intent** (is revenue growing? which product has the most revenue? what share of revenue comes from each product?)
- If the user gives a vague intent like "show my sales data," push back with specific framing options: "Are you showing which region sold the most, how sales have changed over time, or what share of total sales each product represents?"
- Map the stated intent to one of six canonical analytical frames: **Ranking, Trend, Distribution, Composition, Correlation, or Geographic**
- If the user insists on two questions in one chart, identify which is primary and which is secondary -- the primary question determines the chart type; the secondary may be addressed through annotation, a reference line, or a subtitle
- Document the resolved analytical question explicitly before proceeding -- it becomes the chart title seed

### Step 2: Inventory the Data Structure

Collect precise information about the data before selecting a chart type. Chart type selection depends entirely on the data types, counts, and relationships involved.

- **Identify every field involved:** For each field, determine whether it is nominal categorical (unordered labels like product names), ordinal categorical (ordered labels like survey ratings), continuous quantitative (unbounded numbers like revenue), discrete quantitative (counted integers like headcount), or temporal (dates, times, periods)
- **Count the categories:** Less than 5 categories, 5 to 10, 10 to 20, or 20+ each unlock different chart types and rules
- **Count the data points per series:** n < 30 triggers different recommendations for distribution charts (dot plots instead of histograms) and scatter plots (individual labels become feasible)
- **Identify the number of series:** One series (single metric over time or across categories), two to four series (manageable multi-series charts), or five or more series (requires small multiples or faceting instead of overlaid series)
- **Check for negative values:** Pie, donut, and area charts cannot handle negatives correctly -- this eliminates those types before the analytical intent step
- **Check for extreme outliers:** A single outlier can collapse the scale on a bar or line chart, forcing all other values to appear near-zero -- flag this early so the chart specification addresses it
- **Identify the ratio of signal to noise:** Highly variable time-series data (e.g., daily stock prices) may need smoothing (7-day rolling average) before plotting -- the raw data chart type is not sufficient

### Step 3: Apply the Chart Type Decision Framework

Match the analytical intent and data structure to a specific chart type using the full decision table below. Always check the "When to deviate" column -- the default is a starting point, not a mandate.

| Analytical Intent | Data Structure | Default Chart Type | When to Deviate |
|---|---|---|---|
| **Ranking** -- which item is largest/smallest | Categorical + one quantitative field | Horizontal bar chart, sorted descending (largest at top) | Lollipop chart if values are close together and bars become visually indistinct; dot plot if bars waste ink on long nearly-equal bars |
| **Trend -- continuous** | Temporal + one or more quantitative fields | Line chart, x-axis = time | Area chart only if cumulative volume is the insight (not rate of change); never use bars for daily/weekly/monthly continuous trends |
| **Trend -- discrete periods** | Temporal with meaningful gaps between periods (fiscal years, quarters presented as independent) | Vertical bar chart, x-axis = period | Line chart if the user wants to emphasize the direction of change across periods |
| **Distribution -- one variable** | One continuous quantitative field, n ≥ 30 | Histogram with equal-width bins | KDE (kernel density estimate) overlay when bin choice is sensitive; empirical CDF when cumulative probability is the question |
| **Distribution -- one variable, small n** | One continuous quantitative field, n < 30 | Dot plot (strip plot) or beeswarm | Box plot loses too much information at small n; histograms are misleading below 30 observations |
| **Distribution -- comparing across groups** | One continuous quantitative field + one categorical grouping | Box plot (shows median, IQR, whiskers, outliers) | Violin plot if distribution shape matters, not just spread; ridge plot (joy plot) if there are many groups (5+) |
| **Composition -- static snapshot** | Categorical + one quantitative field summing to a meaningful whole, 2 to 6 categories | Donut chart (with center total), pie chart only for 2 categories | Waffle chart when precision matters and audience is non-technical |
| **Composition -- static snapshot, many categories** | Categorical + one quantitative field, 7+ categories | 100% stacked horizontal bar | Treemap if hierarchical breakdown exists; group tail categories into "Other" for any chart type |
| **Composition -- change over time** | Temporal + categorical + one quantitative field | Stacked area chart (absolute) or 100% stacked area chart (share) | Stacked bar chart if periods are discrete and the viewer needs to read values off individual bars |
| **Correlation -- two variables** | Two continuous quantitative fields | Scatter plot | Add regression/LOESS trend line if relationship direction is the finding; bubble chart if a third quantitative variable is meaningful (encode as size, not color) |
| **Correlation -- matrix** | Three or more continuous quantitative fields, showing all pairwise relationships | Scatter plot matrix (SPLOM) | Correlation heatmap if showing coefficient values rather than raw data relationships |
| **Geographic -- regional aggregate** | Geographic regions + one quantitative field | Choropleth map (sequential color scale for one metric, diverging scale for above/below baseline) | Cartogram if population size must be corrected for; avoid choropleth if large land-area regions dominate visually but have small populations |
| **Geographic -- point locations** | Latitude/longitude + one or more fields | Dot map (proportional symbol map if size encoding a quantity) | Heatmap overlay if point density is the story and individual points overlap |

### Step 4: Apply the Small-Multiples Test

Before finalizing the chart type, run this test: if the user's data has more than one grouping variable or more than 4 to 5 series, a single chart almost always fails.

- **Rule:** When overlaying more than 4 series on a line chart, split into small multiples (a grid of identical charts, one per series) -- each panel uses the same axes and scale so comparisons are made by eye position, not by color discrimination
- **Small multiples work for:** line trends by region (each region gets one panel), distributions by product category, scatter plots by customer segment
- **Small multiples do NOT work for:** comparing a single trend across the whole dataset (one chart is correct) or when the panels would have so few data points that each panel is meaningless
- **Threshold:** More than 5 overlaid line series = small multiples. More than 7 stacked bar series = 100% stacked bar plus "Other" grouping. More than 6 bubble chart categories = split into two charts or switch to scatter matrix.
- If small multiples are needed, note this in the specification -- small multiples is not a separate chart type but a layout decision applied on top of the base chart type

### Step 5: Determine the Full Chart Configuration

For the selected chart type, specify every visual element. Never leave an element to default.

**Axes:**
- **X-axis label:** Use the actual field name in human-readable form, plus units in parentheses where applicable (e.g., "Revenue (USD thousands)" not "rev_usd_k")
- **Y-axis label:** Same rule; never leave axis unlabeled
- **Y-axis range for bar charts:** Always start at zero. There is no exception. Truncated bar chart axes are one of the most common sources of misleading data visualization.
- **Y-axis range for line charts:** May start at non-zero ONLY when the metric cannot meaningfully reach zero (e.g., human body temperature in Celsius -- a range of 35 to 42 is honest), the baseline-zero would collapse all variation, AND a note is placed on the chart stating the axis does not start at zero
- **X-axis tick marks for time series:** Monthly data -- label every 3 months (Q1, Q2...); daily data -- label every 7 days; hourly data -- label every 6 hours. Never label every single tick if there are more than 12 ticks.
- **Axis tick rotation:** Rotate category labels 45 degrees only if there are more than 8 categories and labels exceed 8 characters. Prefer horizontal labels -- rotate only as a last resort.

**Color:**
- For categorical series: use a qualitative palette (ColorBrewer Set2 or Okabe-Ito are perceptually uniform and colorblind-safe). Assign the most important series the most visually prominent color.
- For sequential data (low to high values on a choropleth): use a single-hue sequential scale (light to dark). Recommended: single-hue blue, green, or orange scales.
- For diverging data (below/above zero or a baseline): use a diverging scale with a neutral midpoint (white or light gray) and contrasting hues on each end (blue-white-red is standard but not colorblind-friendly; consider purple-white-orange).
- Maximum 7 distinct colors per chart. If the data requires more, use small multiples, grouping, or a table instead.
- Highlight encoding: when one data point or series is the primary finding, use a bold accent color (coral, orange, or a vivid hue) for that element and desaturate all others to gray (#CCCCCC). This is called the "gray everything else" technique and it is highly effective for executive-facing charts.

**Data labels:**
- Fewer than 10 data points: label all points directly on the chart, eliminate the Y-axis if all values are labeled
- 10 to 20 data points: label only the maximum, minimum, first, and last values
- More than 20 data points: remove data labels entirely; use a tooltip (interactive) or caption (print)
- For bar charts: place labels at the end of each bar, inside the bar if the bar is wide enough, outside if not; never place labels at the base of the bar

**Annotations:**
- Reference lines: add a horizontal reference line for targets, averages, or regulatory thresholds -- always label the line directly (not just in the legend)
- Callout annotations: use for one to three key events that explain data behavior (e.g., "Product launch," "Policy change," "System outage") -- place the callout text above or below the annotated point, connected by a subtle line
- Never annotate more than three points on a single chart -- beyond three, annotations become noise

### Step 6: Write the Finding-Based Title and Subtitle

The chart title is the most important text element. It must state the insight, not describe the data.

- **Wrong:** "Revenue by Product Category, 2023"
- **Right:** "Cloud storage drove 61% of total revenue in 2023, up from 44% in 2022"
- The title should make the chart self-sufficient -- a reader who only reads the title should still learn something
- The subtitle carries the "what/when/who" metadata: the metric definition, date range, data source, sample size, or unit of measurement
- Title length: aim for 8 to 12 words. More than 15 words is a sentence, not a title.
- Avoid question titles ("Is revenue growing?") except in exploratory data contexts where the chart is presented as a hypothesis, not a conclusion

### Step 7: Document Anti-Patterns and Alternatives Considered

The specification is incomplete without explicitly naming what was rejected and why. This step prevents the user from reverting to a bad choice.

- Name every chart type the user might intuitively reach for (pie chart for 12 categories, 3D bar chart, dual-axis chart for unrelated scales) and explain why each fails for this specific data
- If the recommended chart type has a known limitation (e.g., "box plots hide bimodal distributions"), name it and explain what to watch for
- If the data contains a known visualization hazard (e.g., Simpson's Paradox is possible when the data has a confounding group variable), flag it in the specification
- For comparison-based charts, note whether absolute values or percentage changes would serve the audience better -- and specify which was chosen and why

---

## Output Format

Deliver the chart specification in the following structure. Fill every field with specific values -- never leave a field as a placeholder.

```
## Chart Specification

### Chart Selection

| Element | Value |
|---------|-------|
| Analytical intent | [One of: Ranking / Trend / Distribution / Composition / Correlation / Geographic] |
| Specific question answered | [The exact question this chart answers, in one sentence] |
| Chart type | [Specific chart type, e.g., "Horizontal bar chart, sorted descending"] |
| Data layout | [e.g., "12 monthly observations × 1 metric" or "47 companies × 2 continuous variables"] |
| Selection rationale | [2-3 sentences: why this chart type, what alternatives were rejected and why] |
| Small multiples needed? | [Yes -- [reason and panel variable] / No] |

---

### Data Mapping

| Chart Element | Data Field | Data Type | Format Rule |
|--------------|-----------|-----------|-------------|
| X-axis | [field name] | [nominal / ordinal / continuous / temporal] | [Format, e.g., "YYYY-MM abbreviated as 'Jan 2024'"] |
| Y-axis | [field name] | [quantitative] | [Format, e.g., "$#,##0K" or "0.0%" or "#,##0 with commas"] |
| Series / Color split | [field name or "None -- single series"] | [categorical] | [List of category values] |
| Size encoding | [field name or "N/A -- not a bubble chart"] | -- | [Format or "N/A"] |
| Data labels | [field name(s)] | -- | [Format + which points get labeled] |
| Tooltip (if interactive) | [all fields to show on hover] | -- | [Format for each] |

---

### Axis Configuration

| Axis | Axis Label | Range | Tick Interval | Gridlines | Notes |
|------|-----------|-------|---------------|-----------|-------|
| X | [Human-readable label (units)] | [auto / specific min-max] | [Every N units / category] | [Off / Light gray #E5E5E5] | [Rotation if needed; date format] |
| Y | [Human-readable label (units)] | [0 to max / non-zero start with note] | [Every N units] | [Light gray #E5E5E5 / Off] | [Whether axis starts at zero; how to handle outliers] |
| Secondary Y (if dual-axis) | [label] | [range] | [interval] | [Off -- dual gridlines confuse] | [Color-match to its series] |

---

### Color Specification

| Element | Role | Color Name | Hex Code | Colorblind Safe? | Usage Rule |
|---------|------|-----------|---------|-----------------|------------|
| [Series 1 / Primary data] | Primary | [name] | [#hex] | [Yes/No] | [What it encodes] |
| [Series 2 / Secondary data] | Secondary | [name] | [#hex] | [Yes/No] | [What it encodes] |
| [Highlighted element] | Accent | [name] | [#hex] | [Yes/No] | [Specific data point or bar being emphasized] |
| Deemphasized elements | Background | Light gray | #CCCCCC | Yes | [All non-highlighted series if using gray-everything-else technique] |
| Reference line | Reference | Medium gray | #888888 | Yes | [Average / target / threshold line] |
| Chart background | Background | White | #FFFFFF | Yes | Chart area only (not page background) |

---

### Annotations

| Type | Location on Chart | Label Text | Visual Style | Purpose |
|------|------------------|-----------|--------------|---------|
| [Data label] | [e.g., "At maximum Y value, top of bar"] | ["[value] [units]"] | [Bold, 11pt, color matches series] | [State why this point is labeled] |
| [Reference line] | [e.g., "Horizontal at Y = [value]"] | ["Target: [value]"] | [Dashed gray, right-aligned label] | [What threshold or target this represents] |
| [Callout / event marker] | [e.g., "Vertical at X = [period]"] | ["[Event name]"] | [Subtle arrow + 9pt italic text] | [Explains an anomaly or inflection] |

---

### Title and Legend

- **Chart title:** [Finding-based title that states the key insight, 8-12 words]
- **Subtitle:** [Data description: metric name, date range, geography, sample size, unit of measure, data source]
- **Legend:** [Position: Top / Right / Bottom / None] -- [Reason: "None because single series" / "Right to avoid interrupting x-axis flow"]
- **Legend labels:** [Exact text for each series label -- use plain English, not field codes]

---

### Anti-Patterns Avoided

| Chart Type Considered | Why It Was Rejected |
|----------------------|---------------------|
| [chart type] | [specific reason this chart fails for this data/intent] |
| [chart type] | [specific reason] |

### Known Limitations of Selected Chart

- [Any visualization hazard in the chosen chart type that the user should monitor for, e.g., "Box plot will hide bimodal distributions -- consider checking data distribution first"]
```

---

## Rules

1. **Analytical intent determines chart type -- not the user's stated preference.** If a user requests a pie chart to show 15 product categories, do not produce a pie chart specification. Explain that pie charts fail above 6 segments (human ability to compare non-adjacent arc angles degrades sharply past 6 slices), then deliver a horizontal bar chart specification. You may acknowledge their preference and explain the trade-off, but the specification must reflect the correct chart type.

2. **Bar chart Y-axes MUST start at zero, without exception.** A bar chart encodes value through length. Truncating the axis makes small differences appear enormous -- a 2% difference can look like a 10x difference on a truncated bar chart. The only correct response when a user's bar chart data has a very high baseline (e.g., all values between 980 and 1,000) is to switch chart types (line chart or dot plot), not to truncate the axis.

3. **Line charts encode trend; bar charts encode discrete quantity.** Do not use a bar chart for continuous time-series data (daily, weekly, monthly observations that form a continuous progression). Bar charts for time data imply each period is independent. Use line charts for continuous trends. Use bar charts for fiscal years or quarters when each period is genuinely independent and comparison of period totals matters more than the trend shape.

4. **Never use 3D chart effects of any kind.** 3D pie charts systematically distort perception -- slices at the front of the chart appear larger than equal-area slices at the back due to foreshortening. 3D bar charts make the correct reference point (the top of the bar) ambiguous. 3D effects add zero information and subtract accuracy. This rule has no exceptions.

5. **Color quantity limit is 7 distinct categorical colors per chart.** Beyond 7 distinct hues, human color discrimination becomes unreliable -- viewers cannot reliably match a data point to its legend entry when there are 8+ categories. When data requires more than 7 categories: group the tail into "Other," use small multiples, or switch to a table. Use the Okabe-Ito palette (8 colors including black) or ColorBrewer qualitative palettes when colorblind safety is required.

6. **Specify colorblind safety for every color assignment.** Approximately 8% of men and 0.5% of women have red-green color deficiency. Never use red and green as the primary distinguishing colors for two series. Red-green pairs are acceptable only when supported by a second visual channel (shape, position, or pattern). The Okabe-Ito palette is specifically designed for deuteranopia and protanopia safety.

7. **Chart titles must state the finding, never the data description.** A title that reads "Sales by Region, Q1 2024" wastes the most prominent text position on the chart. A title that reads "West region outperformed all others in Q1 2024 despite supply disruptions" tells the story. The data description belongs in the subtitle. If the user does not know the finding (exploratory phase), the title should pose the question: "Which region drove Q1 growth?" -- but note this is an exploratory framing.

8. **Every chart specification must include axis labels with units.** An axis labeled "Value" or "Count" is meaningless. An axis labeled "Monthly Active Users (millions)" is specific. Include units in the axis label itself, not just in the subtitle. This is especially critical for financial data (specify currency and denomination: "Revenue (USD, thousands)"), percentages (specify what the percentage is of: "Share of Total Visits (%)"), and time-based axes (specify the period: "Week ending Sunday").

9. **Dual-axis charts require explicit justification and safety rules.** Dual-axis charts (two Y-axes on the same plot) are genuinely useful when showing two metrics that share a time axis but have incompatible scales (e.g., revenue in dollars and conversion rate as a percentage). They are genuinely dangerous when the scales are manipulated to make a correlation appear stronger than it is. Rules for dual-axis charts: (a) both axes must start at a meaningful zero or the non-zero start must be visually flagged; (b) the two series must use different mark types (bars vs. line) so the dual-axis structure is immediately apparent; (c) axis labels must be color-matched to their series; (d) add an explicit subtitle warning: "Axes have different scales."

10. **Small multiples outperform overlaid multi-series charts above 4 series.** When a user wants to overlay 6 regional trend lines on one chart, each line will cross the others, color-coding will fail, and the chart will require a legend lookup for every reading. The correct solution is 6 small panels with identical axes -- the viewer's eye does the comparison spatially, not via color memory. Specify the grid layout (2×3, 3×3, etc.), the shared axis scale, and the panel label position (top of each panel, centered).

11. **Simpson's Paradox must be flagged when group variables are present.** If the user's data includes both an aggregate metric and a group variable (e.g., average salary by company, where company size varies), a trend visible at the aggregate level may reverse within groups. This is not a chart type problem -- it is a data integrity problem that a chart cannot solve. Flag this risk in the "Known Limitations" section of the specification and recommend checking the within-group breakdown before finalizing the chart.

12. **For distribution charts, bin count in histograms must be specified explicitly.** The default bin count in most tools (Excel uses Scott's rule; many BI tools use Sturges' formula) is often wrong for the user's data. Provide the specific bin count in the specification. Use the Freedman-Diaconis rule for data with outliers: bin width = 2 × IQR × n^(-1/3). For most business data with 50 to 500 observations, 10 to 20 bins is appropriate. More than 30 bins on a histogram with fewer than 200 observations creates a noisy, spiky chart that obscures the distribution shape.

---

## Edge Cases

**User's data has one metric but wants to show both the individual values AND the total simultaneously.**
A common request: "Show each product's revenue and also show the total." Two approaches work: (1) A stacked bar chart where the total height is the grand total and each segment is a product -- this works only if part-to-whole composition is the primary intent; (2) An annotated sorted bar chart where the grand total is shown as a text annotation or reference line, not as an additional bar. Do NOT add a "Total" bar to a sorted comparison bar chart -- it dwarfs all individual bars and destroys the comparison scaling.

**User's data has an extreme outlier that collapses the scale.**
When one value is 10x or more larger than the next-largest value, a linear scale makes all other values indistinguishable. Options: (1) Switch to a log scale on the Y-axis -- appropriate for data that spans orders of magnitude (revenue by company size, follower counts); always label the axis as "log scale" and use log-spaced tick marks (1, 10, 100, 1,000); (2) Truncate the outlier bar with a break symbol (zigzag line on the bar) and a separate data label showing the true value -- acceptable for print charts where log scales confuse non-technical audiences; (3) Show the outlier in a separate annotation panel. Never silently truncate the axis.

**User wants to show correlation but data has a non-linear relationship.**
A linear regression line on a scatter plot will systematically mislead when the true relationship is curved (e.g., diminishing returns, exponential growth). If the scatter plot shows an obvious curve, fit a LOESS (locally estimated scatterplot smoothing) curve instead of a linear trend line. Specify the LOESS span parameter (0.75 is a reasonable default for most business data -- lower values follow the data more closely but may overfit). Note this in the specification and flag that the relationship is non-linear.

**User's time-series data has irregular intervals (missing months, irregular sampling).**
A standard line chart with equally-spaced x-axis positions will visually misrepresent the time gaps -- a 6-month gap will look the same as a 1-month gap if both are one tick apart. The correct approach: use a true temporal x-axis where the physical distance between points is proportional to the time gap. In most BI tools this means using a date field as a continuous axis, not a categorical axis. If the tool does not support this, add a note to the chart identifying the gap period explicitly.

**User wants to show percentage change AND absolute values on the same chart.**
The dual-axis approach (bars for absolute value, line for percentage change) is valid here but requires strict handling. The two axes must not be scaled to make the line and bar appear correlated when they are not. Specifically: do not allow the tool to auto-scale both axes to fill the chart area -- this creates a visually implied correlation that may not exist. Set the axis ranges intentionally and label both axes with their units and scales. Alternatively, use a two-panel small-multiple layout: one panel for absolute values, one for percentage change, sharing the same x-axis. This is cleaner and less misleading than dual-axis.

**User is visualizing survey data on a Likert scale (Strongly Agree to Strongly Disagree).**
Likert scale data is ordinal, not continuous. Do not use a histogram (which implies continuous data). The correct chart type is a diverging stacked bar chart: bars extend left from center for negative responses (Disagree, Strongly Disagree) and right for positive responses (Agree, Strongly Agree), with the neutral midpoint anchored at zero. Color the negative bars in cool hues and positive bars in warm hues. If comparing multiple questions, stack the questions vertically (one bar per question) to create a clean comparative view. Specify that the center anchor is the "Neutral" response and that "Neither Agree nor Disagree" respondents should be shown as a thin gray segment at the center.

**User's chart needs to work in both color and black-and-white (print publication).**
When the final output may be printed in grayscale, color alone cannot be the distinguishing channel. Supplement color with: (a) direct labels on each series (eliminating the need to match color to legend); (b) different line dash patterns for line charts (solid, dashed, dotted); (c) different fill patterns for bar charts (diagonal hatching, cross-hatching, solid) if the tool supports it. Specify the redundant encoding in the chart configuration and note which channel carries the information in both color and grayscale contexts.

**User's data contains multiple overlapping categories that are hierarchical (e.g., country → region → city).**
A single flat chart cannot show multiple levels of hierarchy simultaneously without becoming cluttered. The correct approaches are: (1) Treemap -- encodes hierarchy as nested rectangles, area encodes the quantitative value, color encodes the top-level category. Works for 2 to 3 levels of hierarchy with 5 to 50 leaf nodes. (2) Sunburst chart -- encodes hierarchy as nested rings. Visually appealing but harder to read precisely; appropriate for public communication, not analytical reports. (3) Collapsible tree chart -- appropriate for interactive dashboards only. For static reports, use a treemap and specify that only the top two levels should be labeled (leaf-level labels should appear only on hover or if the leaf rectangle is large enough to hold 8pt text).

---

## Example

**Input:** "I have quarterly sales data for 5 products over 3 years (2022, 2023, 2024). Each row is a quarter. I want to show how each product's share of total sales has changed over time. The key finding is that our legacy hardware product has been declining while our software subscription product has been growing. I'm presenting this to the executive team."

**Analysis notes:** Analytical intent = Composition over time (how the parts of a whole have shifted). Data structure = 12 time periods × 5 categorical series, each period sums to 100% of total. The key insight is a directional change in two specific series, not the absolute values. Audience = executive presentation (high clarity, low visual complexity required). An absolute stacked area chart would work, but a 100% stacked area chart is better because it directly encodes share (the analytical intent is composition-as-proportion, not total volume). The two key series should be highlighted; the other three should be deemphasized.

---

## Chart Specification

### Chart Selection

| Element | Value |
|---------|-------|
| Analytical intent | Composition -- change over time (part-to-whole shift over 12 quarters) |
| Specific question answered | How has each product's share of total quarterly sales shifted from 2022 to 2024? |
| Chart type | 100% stacked area chart |
| Data layout | 12 quarterly periods × 5 product series, values normalized to 100% per period |
| Selection rationale | A 100% stacked area chart directly encodes proportional share at every point in time and makes the directional shift between growing and declining products visible as the area bands expand and contract. A 100% stacked bar chart would also work but creates visual discontinuity between quarters; continuous area fills are more appropriate here because the periods are part of a continuous progression, not independent events. A line chart per product (share over time) was considered but would require 5 overlapping lines for a composition story that is clearer as bands. |
| Small multiples needed? | No -- 5 series on a stacked area chart is within the readable limit; the banding structure handles the series count |

---

### Data Mapping

| Chart Element | Data Field | Data Type | Format Rule |
|--------------|-----------|-----------|-------------|
| X-axis | Quarter | Temporal / Ordinal | "Q1 2022", "Q2 2022" ... "Q4 2024" -- abbreviated as "Q1'22", "Q2'22" etc. for space |
| Y-axis | % of Total Quarterly Sales | Continuous quantitative | Percentage: "0%" to "100%", ticks every 25% |
| Series / Color split | Product Name | Nominal categorical -- 5 values | Hardware (legacy), Software Subscription, Professional Services, Accessories, Other |
| Size encoding | N/A -- not a bubble chart | -- | N/A |
| Data labels | Software Subscription share at Q1 2022 (starting point) and Q4 2024 (ending point); Hardware share at Q1 2022 and Q4 2024 | Percentage, one decimal place | Label only the two key series at start and end: "44%" / "18%" for Hardware; "12%" / "38%" for Software Subscription |
| Tooltip (if interactive) | Product Name, Quarter, Share (%), Absolute Sales Value ($K) | -- | "Software Subscription: Q3 2023 -- 29% of total ($1,240K)" |

---

### Axis Configuration

| Axis | Axis Label | Range | Tick Interval | Gridlines | Notes |
|------|-----------|-------|---------------|-----------|-------|
| X | Quarter | Q1 2022 -- Q4 2024, all 12 periods | Every quarter, labeled as "Q1'22", "Q3'22", "Q1'23", "Q3'23", "Q1'24", "Q3'24" (every other quarter to reduce crowding) | Off -- the stacked bands eliminate the need for gridlines | No rotation needed for short labels |
| Y | Share of Total Sales | 0% to 100% | Every 25% (0%, 25%, 50%, 75%, 100%) | Light gray #E5E5E5 horizontal lines at 25%, 50%, 75% -- subtle, not competing with area fills | Must start at 0% and end at 100% because this is a 100% stacked chart -- the scale is fixed |

---

### Color Specification

| Element | Role | Color Name | Hex Code | Colorblind Safe? | Usage Rule |
|---------|------|-----------|---------|-----------------|------------|
| Software Subscription | Primary accent (growing) | Teal | #0D7C8F | Yes (Okabe-Ito compatible) | The story's "winner" -- most visually prominent color |
| Hardware (legacy) | Secondary accent (declining) | Coral orange | #E06C2B | Yes (Okabe-Ito compatible) | The story's "loser" -- warm hue to contrast with teal; avoid red which implies error |
| Professional Services | Supporting | Medium gray | #8C8C8C | Yes | Not the story -- deemphasized but readable |
| Accessories | Supporting | Light gray | #B8B8B8 | Yes | Not the story -- deemphasized |
| Other | Supporting | Very light gray | #D9D9D9 | Yes | Not the story -- least prominent band |
| Reference lines | Reference | Medium gray | #888888 | Yes | N/A -- no reference lines on this chart |
| Chart background | Background | White | #FFFFFF | Yes | Chart area only |

**Color note:** The two key series (Software Subscription and Hardware) use bold, contrasting colors from the Okabe-Ito palette. The three supporting series are rendered in grays. This creates a clear visual hierarchy: the executive eye immediately goes to the two colored bands and tracks their divergence over time. The gray bands provide context without competing for attention.

---

### Annotations

| Type | Location on Chart | Label Text | Visual Style | Purpose |
|------|------------------|-----------|--------------|---------|
| Data label | Top of Hardware band at Q1 2022 | "44%" | 10pt bold, coral orange (#E06C2B), placed inside the band | Anchors the starting share for Hardware so the decline is quantified |
| Data label | Bottom of Hardware band at Q4 2024 | "18%" | 10pt bold, coral orange, inside band | Shows the ending share -- with the start label, the decline from 44% to 18% is immediately clear |
| Data label | Top of Software Subscription band at Q1 2022 | "12%" | 10pt bold, teal (#0D7C8F), placed inside the band | Anchors the starting share for Software Subscription |
| Data label | Top of Software Subscription band at Q4 2024 | "38%" | 10pt bold, teal, inside band | Shows the ending share -- the growth from 12% to 38% is the core finding |
| Callout | Vertical at Q3 2023 | "Subscription pricing model launched" | 8pt italic gray, subtle vertical dashed line at Q3 2023 | Explains the inflection point where Software Subscription growth accelerated |

---

### Title and Legend

- **Chart title:** "Software subscriptions tripled their share as hardware revenue fell by more than half, 2022-2024"
- **Subtitle:** "Share of total quarterly sales by product line -- 5 products, 12 quarters. Revenue values in USD thousands. Source: ERP system, Jan 2022 -- Dec 2024."
- **Legend:** Position: Top of chart, horizontal, left-aligned -- reason: the stacked area requires a legend because band identification requires color matching; top placement keeps it close to the chart without interrupting the x-axis
- **Legend labels:** "Software Subscription", "Professional Services", "Accessories", "Other", "Hardware (Legacy)" -- listed in visual order from top to bottom of the Q4 2024 stack so the legend order matches the chart order

---

### Anti-Patterns Avoided

| Chart Type Considered | Why It Was Rejected |
|----------------------|---------------------|
| Absolute stacked area chart | Shows how total revenue changed over time, not how share changed -- the analytical intent is composition (proportions), not volume; an absolute stacked chart conflates the two and would obscure the share shift if total revenue was also growing |
| 5 overlapping line charts (one per product) | Requires color-coding 5 lines; lines will cross; viewer must look up the legend for every reading; the composition story (shares sum to 100%) is lost because each line is shown independently |
| Pie chart per quarter (12 small pie charts) | Humans cannot compare angle-encoded values across 12 pie charts accurately; and with 5 segments, the smaller segments (Accessories, Other) become illegible; the trend direction is impossible to see |
| 100% stacked bar chart | Each quarter becomes a separate bar with visible gaps between them; the visual continuity of the area fill better communicates that these are connected time periods, not independent measurements; stacked bar would be correct if the quarters were genuinely independent (e.g., different fiscal years, not consecutive quarters) |
| Treemap | Appropriate for static hierarchical composition; cannot show change over time |

### Known Limitations of Selected Chart

- 100% stacked area charts make it difficult to read the absolute value of the middle bands (Professional Services, Accessories) because their baseline shifts with every quarter as the bands below them change size. If the executive team asks "what was Professional Services share in Q2 2023?", the answer requires reading a floating segment with no fixed baseline. For this presentation, only the top and bottom bands have a fixed baseline (0% and 100%) -- the middle three bands are best read via tooltip (interactive) or via the data table appended to the slide. If precise reading of middle bands is required, consider supplementing this chart with a small table showing exact values.
- With 5 bands and only the two colored ones highlighted, the gray bands may be perceived as less important than they are. If the presenter wants to discuss Professional Services trends, a separate single-series line chart for that product should be prepared as a backup slide.
