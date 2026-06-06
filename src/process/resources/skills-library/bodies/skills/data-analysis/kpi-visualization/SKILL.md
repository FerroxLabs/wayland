---
name: kpi-visualization
description: |
  Designs the visualization layer for KPIs by selecting the display format (scorecard, gauge, sparkline, trend line), specifying target lines, threshold colors, and period-over-period comparison formats. Produces a complete visual specification for each KPI.
  Use when the user needs to display KPI metrics in a dashboard, report, or presentation with clear status indicators and context.
  Do NOT use for defining which KPIs to track (use kpi-definition), designing full dashboard layouts (use dashboard-design), or choosing chart types for non-KPI data (use chart-type-selector).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-visualization analysis template"
  category: "data-analysis"
  subcategory: "data-visualization"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# KPI Visualization

## When to Use

**Use this skill when:**
- A user has already defined KPIs (with names, current values, targets, and directionality) and needs a complete visual specification for displaying them in a dashboard, scorecard, or performance report
- A user asks "how should I display this metric?", "what format works best for showing performance against target?", or "how do I color-code my KPIs?"
- A user is building an executive dashboard, operations review, or C-suite scorecard and needs consistent visual standards across all KPI tiles
- A user wants to communicate KPI status (on-track / at-risk / off-track) at a glance through color, iconography, and layout without requiring the viewer to interpret raw numbers
- A user needs to specify period-over-period comparisons, target reference lines, threshold bands, or trend context for each metric
- A user needs to encode directional logic correctly (e.g., higher revenue = good, but higher churn = bad) so that green always means desirable and red always means undesirable
- A user is standardizing KPI display formats across multiple teams, departments, or dashboards and needs a design system specification

**Do NOT use when:**
- The user has not yet decided which KPIs to track or how to define them -- use `kpi-definition` first to establish metric ownership, formulas, data sources, and targets
- The user needs to design the full layout of a multi-panel dashboard including navigation, filters, and panel arrangement -- use `dashboard-design` for the spatial and interaction layer
- The user wants to explore data analytically using scatter plots, histograms, box plots, or correlation matrices -- use `chart-type-selector` for non-KPI analytical charts
- The user wants to format a full written report with narrative, tables, and supporting charts -- use `report-formatting`
- The user is asking about data pipeline setup, metric calculation, or data freshness -- this skill only covers the visual presentation layer
- The user needs statistical process control charts (control charts, Shewhart charts) -- those require a separate treatment of control limits and variation analysis

---

## Process

### Step 1: Audit Each KPI's Inputs Before Selecting Any Format

Before choosing a display format, gather or confirm every attribute that drives visualization decisions. Missing inputs lead to incorrect format selection or misleading displays.

- **Metric name and unit:** Confirm exact label and unit of measure (e.g., "Monthly Recurring Revenue -- USD" not just "revenue"). Units determine rounding rules.
- **Current value:** The latest actual measurement. Confirm the as-of date -- a stale KPI needs a staleness indicator.
- **Target value and target type:** Is the target a fixed number, a range (e.g., "between 95% and 105%"), a threshold (e.g., "below 2%"), or a relative goal (e.g., "+10% vs. prior year")? Each requires different visual treatment.
- **Directionality:** Explicitly confirm whether higher is better (revenue, NPS, retention), lower is better (churn, cost, error rate, cycle time), or there is a target band (response time: not too fast, not too slow; inventory: not too much, not too little). Band KPIs are the most commonly mis-designed.
- **Measurement cadence:** Daily, weekly, monthly, quarterly. This determines sparkline granularity -- a daily KPI showing weekly sparkline points loses signal; a monthly KPI showing daily points creates noise.
- **Historical data depth:** How many periods of history exist? Fewer than 6 periods means trend context is limited. Fewer than 3 periods means trends cannot be shown at all.
- **Audience and display context:** A TV dashboard in a warehouse needs 72pt numbers readable at 15 feet. A PDF board report needs printable grayscale alternatives. An embedded web dashboard can use hover tooltips for secondary data. These constraints override aesthetic preferences.
- **Comparison type priority:** What does the business consider the primary performance question -- "are we hitting target?", "are we improving vs. last period?", or "are we beating the competition?" The primary comparison drives the delta indicator format.

---

### Step 2: Select the Correct Display Format

Use the following decision framework to select the display format for each KPI. Apply it in order -- the first matching rule determines the format.

**Rule 1 -- Single current value with a target (the most common case):**
Use a **Scorecard card** (large number + status color + delta indicator). This is the default format for approximately 80% of KPIs. It is compact, scannable, and encodes status in one glance. Do not default to a gauge just because the metric is a percentage.

**Rule 2 -- Progress toward a discrete, bounded milestone:**
Use a **horizontal progress bar** when the KPI is tracking completion of a specific deliverable (e.g., "pipeline coverage: $8M of $10M target"). The bar must show the target endpoint as a fixed value, not a percentage of completion. Only use this for KPIs with a clear maximum -- do not use for metrics that can exceed the target (revenue can exceed target; project completion cannot).

**Rule 3 -- Gauge / radial format criteria (strict):**
Use a **radial gauge** only when all three conditions are met: (a) the metric is a percentage or rate, (b) the metric cannot logically exceed 100%, and (c) the target is at a specific point within the gauge arc, not at the end. Examples: server CPU utilization (target: below 80%), customer satisfaction (target: above 85%). Never use a gauge for revenue, NPS, headcount, or any KPI that can exceed its target, because the visual implies a ceiling that does not exist.

**Rule 4 -- Trend direction is the primary question:**
Use a **sparkline** (6-24 data points in a compact inline chart, no axes, no labels) when the audience needs to see directional momentum rather than exact values. Sparklines are supplementary elements on a Scorecard card, not standalone displays. A standalone sparkline with no primary number is not a KPI display -- it is a mini chart.

**Rule 5 -- Full trend trajectory with inflection points:**
Use a **trend line chart** (full axis, labeled data points, reference lines) as the context element when the KPI has significant variance, recovery events, or seasonal patterns that management actively monitors. Suitable for NPS (slow-moving, complex dynamics), market share, or any KPI where the question "when did this start changing?" matters.

**Rule 6 -- Same KPI across multiple segments:**
Use **small multiples** -- a grid of identical Scorecard cards, one per segment (region, product, team) -- with identical scales, thresholds, and card dimensions. Never combine multiple segments into one KPI card using stacked numbers; it destroys scannability.

**Format Summary Table:**

| KPI Characteristic | Recommended Format | Avoid |
|---|---|---|
| Single value vs. fixed target | Scorecard card | Gauge (unless bounded rate) |
| Progress toward a discrete deliverable | Progress bar | Radial gauge |
| Bounded rate/percentage (cannot exceed 100%) | Radial gauge or Scorecard | Progress bar |
| Direction of change is primary question | Scorecard + sparkline | Standalone sparkline |
| Full trajectory matters | Scorecard + trend line | Bullet chart |
| Same KPI, multiple segments | Small multiples | Stacked cards |
| KPI without a target | Scorecard with period-over-period delta | Status color (no target = no color) |

---

### Step 3: Design the KPI Card Layout and Information Hierarchy

Every KPI card has four information layers, arranged in strict visual priority order:

**Layer 1 -- Status (pre-attentive, perceived in under 250ms):**
The background color wash, colored left border (4px), or status badge. The viewer knows the verdict before reading any number. Use a colored left border on white cards rather than full background color -- full-color backgrounds cause eye fatigue across a 12-card dashboard and reduce contrast for the primary number.

**Layer 2 -- Current Value (primary focal point):**
The metric value, formatted and rounded, in the largest font on the card. Sizing guidelines:
- Cards 280-360px wide: 32-36pt bold
- Cards 200-280px wide: 24-28pt bold
- Cards wider than 360px (feature KPIs): 48-56pt bold
- TV dashboards at 10+ feet: minimum 72pt

Format values to reduce cognitive load -- viewers should read values, not calculate them:
- Currency: $2.4M (not $2,400,000 or $2.40M); use one decimal only when it changes the story ($2.4M vs. $2.5M -- the 0.1 matters; $24.1M vs. $24.2M -- round to $24M)
- Percentages: 3.2% (not 3.17% or 3%); use one decimal for percentages below 10%, round to whole numbers for percentages above 10% unless precision matters operationally
- Counts: 4.2K (not 4,187); use K/M/B suffixes consistently
- Ratios: 2.4x (not 2.38x)
- NPS and index scores: whole numbers only (42, not 42.3)

**Layer 3 -- Comparison and Delta (secondary, read in 1-3 seconds):**
The delta value, arrow indicator, and comparison period label. This layer answers "how is performance changing?" Rules:
- Always show the comparison period: "+8% vs. last quarter" not "+8%"
- Show both absolute and relative change when both are meaningful: "-$100K (-4%) vs. target"
- Use an up/down arrow for direction; use a flat dash (--) for changes less than 1% (or 0.5 standard deviations for volatile metrics)
- Color the delta to match the status color, not a universal up=green/down=red rule -- for churn rate, a down arrow must be green

**Layer 4 -- Trend Context (tertiary, read on demand):**
Sparkline or mini trend line in the upper-right corner of the card, or as a bottom band. Size: 80-120px wide, 30-40px tall for sparklines. Include a faint dashed target reference line within the sparkline at the target value level. Do not label the sparkline axes -- the primary number provides the anchor.

**Card anatomy (text layout, top to bottom):**
```
[KPI Label -- 12pt, #666666]          [Sparkline -- 100x36px]
[Primary Value -- 32pt Bold]
[Delta Arrow] [Delta Value -- 14pt]   [Comparison Period -- 12pt, #888888]
[Status Color Bar -- 4px left border OR bottom band]
[Target reference -- 11pt, #999999: "Target: $2.5M"]
```

---

### Step 4: Define Numeric Status Thresholds

This is the most consequential design decision. Poorly set thresholds cause alert fatigue (everything is always yellow) or false confidence (red only appears when catastrophe has occurred). Follow this framework:

**Principle: Thresholds must be operationally meaningful, not mathematically symmetric.**

**For "higher is better" KPIs with a fixed target:**
- Derive thresholds from the operational response required: "What is the value at which a manager would escalate to leadership?" = Red threshold. "What value triggers a formal improvement plan?" = Yellow threshold.
- Default starting point if no operational input: Green >= 95% of target; Yellow = 85-94% of target; Red < 85% of target
- Adjust for the size of the gap that can be recovered in one period. A KPI at 89% of target in month 1 might be recoverable by month 3; same gap in month 11 of a fiscal year is not. Consider whether thresholds should tighten as the period progresses (maturity-adjusted thresholds).

**For "lower is better" KPIs:**
- Invert the logic entirely: Green = at or below target; Yellow = up to a defined overage band; Red = beyond the overage band
- Example: Churn target = 2.5%. Green: <= 2.5%. Yellow: 2.5% to 3.0% (within 0.5 percentage points, which is 20% above target). Red: > 3.0%.
- Do NOT set yellow as "90-94% of target" for a lower-is-better KPI -- this is wrong. Lower means better; the warning band is above the target, not below it.
- Always state thresholds in the original unit, not as "% of target", for lower-is-better KPIs. "3.0%" is clearer than "120% of target."

**For band KPIs (target is a range):**
- Green: inside the band entirely
- Yellow: outside the band by up to a specified tolerance
- Red: outside the band beyond the tolerance
- Example: Inventory days target = 45-60 days. Green: 45-60. Yellow: 35-44 or 61-70. Red: < 35 or > 70.

**For KPIs without a target:**
- Do NOT use green/yellow/red. Use directional colors only: Blue = improving vs. prior period; Gray = flat; Orange = declining. State explicitly in the spec that status colors are not applicable until a target is set.

**Document every threshold in a threshold table per KPI** -- do not leave thresholds implicit or describe them only in prose.

---

### Step 5: Specify the Comparison Format and Delta Calculation Method

There are four distinct comparison types and they answer different questions. Choose exactly one as the primary comparison per KPI; a second comparison can appear as a secondary data element but must be visually subordinate.

**Type 1 -- Target comparison ("Are we hitting the goal?"):**
Formula: (Current Value -- Target) / Target × 100 = % vs. target
Display: "-4% vs. target ($2.5M target)" or "-$100K vs. target"
Best for: KPIs with committed targets (revenue, quota, SLA)

**Type 2 -- Period-over-period ("Are we improving?"):**
Formula: (Current Period -- Prior Period) / Prior Period × 100 = % change
Comparison options: vs. prior period (MoM, QoQ, WoW), vs. same period prior year (YoY, SPLY)
Display: "+8% vs. prior month" or "+$180K vs. January"
Best for: KPIs without hard targets, or as secondary comparison for trended KPIs

**Type 3 -- Year-to-date vs. YTD target:**
Formula: (YTD Actual -- YTD Target) / YTD Target × 100
Display: "+3% ahead of YTD plan"
Best for: Cumulative KPIs (total annual revenue, total units shipped) where monthly targets are less meaningful than the running total

**Type 4 -- Benchmark comparison ("Are we competitive?"):**
Display: "+12 points vs. industry median NPS" or "1.2pp below market churn average"
Best for: KPIs where external context reframes internal performance

**Delta direction labeling for "lower is better" KPIs -- the most common error source:**
When churn decreases from 3.5% to 3.2%, the delta is -0.3 percentage points. This is good news. The arrow must point DOWN and be colored GREEN. Label as: "↓ 0.3pp vs. prior month (improved)". Never show a down arrow in red for a lower-is-better metric -- this is the single most common KPI dashboard design error.

---

### Step 6: Specify the Sparkline Design

Sparklines are not decorative -- they encode trend signal. Poorly designed sparklines mislead.

- **Data points:** Minimum 6, maximum 24. For monthly KPIs, show 12 months (trailing 12 months = TTM). For weekly KPIs, show 13 weeks (one quarter). For daily KPIs, show 30 days. Fewer than 6 points: do not show a sparkline; show a period count label instead ("Tracking since [date] -- [N] periods").
- **Y-axis range:** Start the Y-axis at a meaningful zero or floor, not at the minimum data value. A sparkline for revenue that starts at $2.3M and ends at $2.4M with a wildly amplified vertical scale looks like a crisis. Use a baseline of zero for counts and currency unless the operational range is truly narrow (e.g., server uptime between 99.0% and 99.9% -- here, zero baseline is meaningless).
- **Target reference line:** Always draw a dashed horizontal line at the target value within the sparkline. This gives the viewer immediate context: values above the line are good (for higher-is-better); below is bad. Exception: if the target value is outside the sparkline's Y-axis range, extend the axis to show it.
- **Coloring:** Render the sparkline line itself in a neutral gray (#9B9B9B). Color only the final data point (a dot) in the current status color (green/amber/red). This draws the eye to "now" while maintaining the trend as context.
- **Moving average overlay:** For volatile KPIs (coefficient of variation > 25%), overlay a 3-period simple moving average as a slightly thicker, semi-transparent line (50% opacity) in the status color. This separates signal from noise without hiding actual values.
- **Size:** 80-120px wide, 28-40px tall. Never add axis labels, tick marks, or gridlines to a sparkline -- these are decorative noise at this scale.

---

### Step 7: Establish Visual Standards Across All KPI Cards

Consistency across cards is not aesthetic -- it enables rapid scanning. When cards use different font sizes, threshold colors, or card dimensions, the viewer's eye cannot make valid comparisons.

- **Card grid:** All cards in a row must share identical height. Cards may vary in width (feature KPIs can be 2x wide) but the height must be uniform per row.
- **Color system:** Define exactly three status colors and one neutral color for the entire dashboard:
  - On-track: #27AE60 (a slightly darker green than Material Design's default -- better on white backgrounds)
  - At-risk: #E67E22 (warm amber -- distinct from red in color-blind testing)
  - Off-track: #C0392B (dark red -- readable at small sizes and distinguishable in grayscale as the darkest shade)
  - Neutral/no-target: #2980B9 (medium blue)
- **Color-blind accessibility:** The standard green/amber/red palette fails for approximately 8% of men (red-green color deficiency). Always pair color with a secondary encoding: status text ("On-track", "At-risk", "Off-track"), an icon (checkmark, warning triangle, X), or a shape variation. Never rely on color as the sole status indicator.
- **Typography:** Use a single typeface across all cards. Inter, IBM Plex Sans, or Roboto are all optimized for screen readability at small sizes. Avoid serif fonts and display fonts for KPI numbers -- at 32pt on a bright screen, serifs reduce legibility.
- **Number alignment:** Align all primary numbers left-aligned or center-aligned -- choose one and apply it uniformly. Mixed alignment creates a disorganized appearance.
- **White space:** Minimum 16px padding inside each card on all sides. Do not crowd the card with secondary labels -- if content cannot fit with 16px padding, the card is too small or contains too much information.
- **Grayscale check:** Export a grayscale version of every KPI card. If status is indistinguishable in grayscale, the design fails for print, B&W PDF reports, and accessibility. The three status shades should map to visually distinct grayscale values: green (#27AE60) ≈ 35% gray; amber (#E67E22) ≈ 60% gray; red (#C0392B) ≈ 25% gray. Add icons or text labels if needed.

---

### Step 8: Produce the Complete Visual Specification

Assemble the per-KPI card specs and the cross-KPI visual standards into the structured output format defined below. The specification must be complete enough for a designer, developer, or no-code dashboard tool operator to implement without ambiguity.

---

## Output Format

```
## KPI Visualization Specification

**As of date:** [Date or data refresh timestamp]
**Dashboard context:** [Executive scorecard / Operations dashboard / Board report]
**Display medium:** [Web dashboard / PDF report / TV display / Presentation]

---

### KPI Summary Table

| # | KPI Name | Unit | Current Value | Target | Status | Display Format | Direction |
|---|---------|------|--------------|--------|--------|---------------|-----------|
| 1 | [Name] | [Unit] | [Value] | [Target] | [On-track / At-risk / Off-track] | [Scorecard / Gauge / Progress bar] | [Higher better / Lower better / Band] |
| 2 | [Name] | [Unit] | [Value] | [Target] | [On-track / At-risk / Off-track] | [Scorecard / Gauge / Progress bar] | [Higher better / Lower better / Band] |
| 3 | [Name] | [Unit] | [Value] | [Target] | [On-track / At-risk / Off-track] | [Scorecard / Gauge / Progress bar] | [Higher better / Lower better / Band] |

---

### KPI Card Specifications

#### KPI [N]: [Full KPI Name]

**Direction:** [Higher is better / Lower is better / Target band: X to Y]
**Display Format:** [Scorecard with sparkline / Scorecard with trend line / Progress bar / Radial gauge]
**Comparison Type:** [Target comparison / Period-over-period (MoM/QoQ/YoY) / YTD vs. plan / Benchmark]

**Card Elements:**

| Element | Specification |
|---------|--------------|
| Primary value | [Formatted value, e.g., $2.4M or 3.2% or 42] |
| Primary value font | [Size]pt, Bold, [Color -- Black #1A1A1A normally; white if full-color background] |
| KPI label | "[Exact label text]", 12pt, Regular, #666666 |
| Time period label | "[Period text, e.g., October 2024]", 11pt, #888888 |
| Delta indicator | [Arrow type: ↑ / ↓ / --] [Delta value, e.g., -$100K (-4%)] |
| Delta label | "vs. [comparison reference and period]" |
| Delta color | [Status color hex, e.g., #E67E22 for at-risk] |
| Trend element | [Sparkline: trailing 12 months / Trend line: trailing 24 months / None] |
| Target reference | "Target: [value]", 11pt, #999999, dashed line in sparkline at [value] |
| Status indicator | Left border, 4px, [Status color hex] |

**Status Thresholds:**

| Status | Label | Color | Hex | Condition (in original units) |
|--------|-------|-------|-----|-------------------------------|
| On-track | "On-track" + ✓ | Green | #27AE60 | [Specific condition] |
| At-risk | "At-risk" + ⚠ | Amber | #E67E22 | [Specific condition] |
| Off-track | "Off-track" + ✗ | Red | #C0392B | [Specific condition] |

**Threshold Rationale:** [One sentence explaining why these thresholds were chosen]

**Card Layout Diagram:**
```
+---[4px status color border]-----------------------------------+
| [KPI Label]           [Period]         [Sparkline 100x36px]  |
|                                                               |
| [Primary Value -- 32pt Bold]                                  |
| [↑/↓/--] [Delta value]  vs. [comparison period]              |
|                                                               |
| Target: [value]                            [Status badge]    |
+---------------------------------------------------------------+
Card size: [width]px x [height]px
```

---

### Visual Standards (Applied Across All KPI Cards)

| Element | Standard |
|---------|----------|
| Card background | White #FFFFFF |
| Card border | #E8E8E8, 1px, 8px corner radius |
| Card padding | 16px all sides |
| Card minimum size | 280px wide x 160px tall |
| Status border (left edge) | 4px solid, status color |
| Primary number font | Inter (fallback: Roboto, system-ui), Bold |
| Primary number size -- standard card | 32pt |
| Primary number size -- feature card (2x width) | 48pt |
| Primary number size -- TV display | 72pt minimum |
| Primary number color | #1A1A1A |
| KPI label font | Inter, 12pt, Regular, #666666 |
| Period label font | Inter, 11pt, Regular, #888888 |
| Delta value font | Inter, 14pt, SemiBold, [status color] |
| Delta direction indicator | ↑ ↓ -- (Unicode arrows, same color as delta) |
| Target reference text | Inter, 11pt, Regular, #999999 |
| Target reference line (in sparkline) | Dashed, 1px, #AAAAAA |
| Sparkline line color | #9B9B9B |
| Sparkline current-period dot | 4px filled circle, [status color] |
| Sparkline moving average (if shown) | [Status color], 50% opacity, 1.5px line |
| Sparkline size | 100px wide x 36px tall |
| On-track color | #27AE60 |
| At-risk color | #E67E22 |
| Off-track color | #C0392B |
| No-target / neutral color | #2980B9 |
| Grayscale fallback (accessibility) | Add ✓ / ⚠ / ✗ icon to all status badges |
| Card shadow | 0px 2px 8px rgba(0,0,0,0.08) |
```

---

## Rules

1. **Never display a KPI value without at least one comparison.** A standalone number conveys magnitude but not performance. Every KPI card must show at minimum one of: (a) delta vs. target, (b) delta vs. prior period, or (c) a trend element showing trajectory. A number without context is a data point, not a KPI.

2. **Always encode directionality explicitly in the threshold logic and arrow colors.** For lower-is-better KPIs, a downward arrow must be green and an upward arrow must be red. Write out the direction rule in the spec. Do not assume the implementer will infer it. Failing to do this is the most common KPI dashboard implementation error and produces dashboards where green churn arrows mean "churn is going up" -- the exact opposite of the intended signal.

3. **Never assign status colors without documented numeric thresholds.** Vague descriptions like "roughly on track" or "looks okay" are not threshold definitions. Every color state must have an explicit numeric condition stated in the original unit of the KPI (not just "85% of target" for a lower-is-better metric, which is misleading).

4. **Do not use a gauge or radial display for any KPI that can logically exceed its target.** Gauges have a visual ceiling. If revenue exceeds target, a gauge needle pegged at 100% looks the same as a needle at 105% or 130%. Use a Scorecard card for any KPI that can over-perform. Reserve gauges strictly for bounded-range KPIs like CPU utilization, battery level, or fixed-maximum completion rates.

5. **Do not show sparklines with fewer than 6 data points.** Three data points form a line, not a trend. Five points may reflect a single anomalous quarter. Six is the minimum to suggest a pattern; 12 is preferable for monthly KPIs. If fewer than 6 historical periods exist, replace the sparkline with a period count indicator: "3 of 12 months tracked."

6. **Maintain uniform card dimensions within a card grid row.** Variable card heights in a row break the visual alignment grid and implicitly suggest that taller cards are more important. All cards in a single row must share the same height. Feature KPIs may occupy double width but never irregular heights.

7. **Apply the grayscale accessibility test to every specification.** Color alone cannot be the sole encoding of status. Pair every status color with a text label and an icon (✓ for on-track, ⚠ for at-risk, ✗ for off-track). This ensures the dashboard is usable in printed board reports, by color-blind users, and in low-contrast display environments.

8. **Never display a percentage change for a KPI whose base value is near zero.** If last month's value was $5K and this month's is $15K, the "+200%" delta is technically correct but operationally meaningless and visually alarming. For KPIs with small base values (less than 5% of annual target or less than 1/20th the typical range), show absolute change only, not percentage change.

9. **Round all primary values to reduce cognitive processing load.** The rule: display no more significant figures than the precision meaningful for decision-making. Revenue decisions are made in millions, not thousands; churn decisions are made in tenths of a percent; NPS decisions are made in whole points. Excess precision (e.g., "$2,412,873.44" on an executive dashboard) signals poor design judgment and reduces trust in the dashboard.

10. **When showing period-over-period comparison alongside target comparison, make the hierarchy explicit.** One comparison is primary (shown in the delta indicator, larger and colored). One comparison is secondary (shown as a smaller label beneath, in neutral gray). Never show two equally weighted deltas on a single KPI card -- the viewer cannot determine which one defines "good" performance.

11. **For KPIs measured in percentage points (not percentages of percentages), use "pp" (percentage points) not "%" for delta values.** Churn dropping from 3.5% to 3.2% is a decrease of 0.3 percentage points (0.3pp), not 0.3%. "−0.3%" would imply a 0.3% relative reduction (which would be 0.0105pp). This distinction is critical for churn, conversion rate, margin, and any KPI already expressed as a percentage.

12. **Do not apply seasonal adjustment silently.** If a KPI uses seasonally adjusted figures or a trailing average rather than the raw current period value, label this explicitly on the card ("3-month rolling average" or "seasonally adjusted"). Displaying an adjusted figure as if it were the raw period value misleads viewers and corrupts decision-making.

---

## Edge Cases

### No Target Has Been Defined for the KPI

Do not apply green/amber/red status colors when there is no target -- these colors imply a judgment that has no basis without a defined goal. Instead:
- Use a neutral blue (#2980B9) directional color scheme: blue for improving, gray for flat, orange for declining
- Show period-over-period delta as the primary comparison
- Replace the "Target: [value]" field with "Target: Not set -- contact [metric owner]"
- Add a visible "No target" badge on the card in a light gray style
- When documenting the spec, note that this card should be updated once a target is established and that threshold logic cannot be finalized

### KPI Has No Historical Data (Brand New Metric)

When fewer than 3 prior periods exist:
- Display the current value with a "Baseline" subtext below the primary number
- Replace the sparkline with a text indicator: "Trend available after [N] periods (currently [M] of [N])"
- Replace the delta indicator with a flat dash "--" and label it "First period -- no prior comparison"
- Set the card to neutral blue status (#2980B9) regardless of target position -- cannot reliably assess a single data point
- Preserve the threshold table in the spec so that the logic is ready to activate once data accumulates

### KPI Exhibits High Volatility (High Coefficient of Variation)

When a KPI's coefficient of variation (standard deviation / mean) exceeds 25%, single-point comparisons produce false alarms and false confidence:
- Replace the raw current-period value with the 3-period simple moving average as the primary displayed value, labeled explicitly: "3-Month Avg: $2.4M"
- Show the raw current period value as a secondary element: "Latest: $2.7M"
- Apply status thresholds against the moving average, not the raw value -- this prevents a single anomalous period from triggering red-alert responses
- Add a moving average overlay to the sparkline (50% opacity, 1.5px line in status color) over the raw sparkline line (gray, 1px)
- Add a tooltip or footnote: "Status based on 3-month rolling average to reduce noise from week-to-week volatility"

### KPI Near the 0% or 100% Boundary

Standard percentage-of-target thresholds break down at the extremes:
- **High-end KPIs (e.g., uptime SLA at 99.9% target):** A threshold of "Green >= 95% of target" would set green at 94.9% uptime, which is catastrophically bad. Instead, define thresholds in absolute terms: Green >= 99.9%; Yellow: 99.5-99.89%; Red: < 99.5%. Document that thresholds were set in absolute percentage points, not relative to target.
- **Low-end KPIs (e.g., defect rate target of 0.1%):** A 10% tolerance band above target is 0.01 percentage points -- indistinguishable in practice. Set the yellow band to 2x the target (0.1% to 0.2%) and red as > 0.2% (or whatever the operational escalation threshold is). Use basis points (bps) for very small percentages: "10 bps above target."
- **Binary or near-binary KPIs:** For metrics that are either achieved or not (e.g., "All regulatory filings submitted on time: Yes/No"), do not use a gauge or scorecard with a numeric primary value. Use a binary status badge instead: a large colored icon (✓ green or ✗ red) with a text label.

### Multiple Audiences Seeing the Same KPI

When a dashboard serves multiple audience types (e.g., C-suite and operations team), the same KPI needs different levels of detail:
- **Executive view:** Show only the primary value, status color, and one delta (target comparison). Suppress sparkline or show a compact version. Card size: 280px x 140px.
- **Operational view:** Show all elements including sparkline, secondary period-over-period delta, threshold details, and moving average. Card size: 320px x 200px.
- Specify both layouts in the spec with an explicit "View variant" field. Do not create two completely different card designs -- use a single expandable template with a detail-disclosure mechanism, or clearly document that two separate card sizes serve the two audiences.
- Never compromise the executive view by adding operational detail "just in case" -- a card crowded with secondary data at executive font sizes reduces the speed-to-insight that executive dashboards exist to provide.

### KPI Value Has Changed Methodology Mid-Period

When the calculation method, data source, or definition of a KPI changes partway through the history displayed in a sparkline:
- Insert a visible discontinuity marker on the sparkline at the period of the methodology change: a vertical dashed line or a labeled dot ("Methodology change")
- Add a footnote or tooltip: "Data before [date] calculated using [old method]; data from [date] onward uses [new method]"
- Do not connect pre-change and post-change data points with a continuous line if the values are not comparable -- use a gap in the sparkline to signal the break
- Set the comparison period to begin only after the methodology change date -- showing a period-over-period delta that spans the discontinuity produces a meaningless number

### KPI Is a Composite Score or Index

Composite KPIs (e.g., a Customer Health Score derived from 5 sub-metrics, or an overall Risk Index):
- Always show the composite score as the primary value, but add a composition indicator beneath the card: "Based on: NPS (40%), CSAT (30%), Churn (30%)"
- Add a drill-down specification: clicking the card should reveal the component breakdown. Document this interaction requirement explicitly in the spec even if the drill-down design is handled by `dashboard-design`.
- Set thresholds based on the composite score scale, and clearly label the scale: "Score: 0-100" or "Index: 0-10." Never show a composite score without labeling the scale -- a score of 67 is meaningless without knowing the range.
- Avoid sparklines for composite scores with frequently changing composition weights -- the trend becomes uninterpretable if the formula changed between periods.

---

## Example

**Input:** "I need to visualize three KPIs for our monthly SaaS business review: Monthly Recurring Revenue ($2.4M actual, $2.5M target), Customer Churn Rate (3.2% actual, target below 2.5%), and Net Promoter Score (42 actual, target of 50). We're building a web dashboard for the executive team. It's end of October."

---

## KPI Visualization Specification

**As of date:** October 31, 2024
**Dashboard context:** Executive SaaS Business Review -- Monthly
**Display medium:** Web dashboard (responsive, 1440px primary width)

---

### KPI Summary Table

| # | KPI Name | Unit | Current Value | Target | Status | Display Format | Direction |
|---|---------|------|--------------|--------|--------|---------------|-----------|
| 1 | Monthly Recurring Revenue | USD | $2.4M | $2.5M | At-risk | Scorecard + 12-month sparkline | Higher is better |
| 2 | Customer Churn Rate | % | 3.2% | ≤ 2.5% | Off-track | Scorecard + 12-month sparkline | Lower is better |
| 3 | Net Promoter Score | Index (−100 to +100) | 42 | ≥ 50 | At-risk | Scorecard + 12-month trend line | Higher is better |

---

### KPI Card Specifications

#### KPI 1: Monthly Recurring Revenue

**Direction:** Higher is better
**Display Format:** Scorecard with 12-month trailing sparkline
**Comparison Type:** Primary -- target comparison; Secondary -- MoM period-over-period

**Card Elements:**

| Element | Specification |
|---------|--------------|
| Primary value | $2.4M |
| Primary value font | 32pt, Bold, #1A1A1A |
| KPI label | "Monthly Recurring Revenue", 12pt, Regular, #666666 |
| Time period label | "October 2024", 11pt, #888888 |
| Delta indicator | ↓ −$100K (−4%) |
| Delta label | "vs. target ($2.5M)" |
| Delta color | #E67E22 (amber -- at-risk) |
| Secondary delta | Show beneath in 11pt gray: "e.g., +$47K (+2%) vs. September 2024" (populate with actual prior-month data) |
| Trend element | Sparkline: trailing 12 months of MRR, monthly granularity |
| Target reference | "Target: $2.5M", 11pt, #999999; dashed horizontal line at $2.5M within sparkline |
| Status indicator | Left border, 4px, #E67E22 (amber) |
| Status badge | "⚠ At-risk", 11pt, #E67E22 |

**Status Thresholds:**

| Status | Label | Color | Hex | Condition (in original units) |
|--------|-------|-------|-----|-------------------------------|
| On-track | ✓ On-track | Green | #27AE60 | MRR ≥ $2.5M (100% of target) |
| At-risk | ⚠ At-risk | Amber | #E67E22 | MRR $2.25M to $2.499M (90-99.9% of target) |
| Off-track | ✗ Off-track | Red | #C0392B | MRR < $2.25M (below 90% of target) |

**Threshold Rationale:** A gap of less than $250K ($2.25M floor) is recoverable within 2-3 months at historical growth rates; beyond $250K requires a formal corrective action review.

**Directionality note:** ↑ arrow = green (revenue growing); ↓ arrow = red (revenue declining). This is a standard higher-is-better KPI.

**Card Layout Diagram:**
```
+--[4px #E67E22 amber border]------------------------------+
| Monthly Recurring Revenue  Oct 2024    [Sparkline~~~~]   |
|                                         target: - - - -  |
| $2.4M                                                    |
| ↓ −$100K (−4%) vs. target ($2.5M)      ⚠ At-risk        |
| +$47K (+2%) vs. Sep 2024 (gray, 11pt)                    |
| Target: $2.5M                                            |
+----------------------------------------------------------+
Card size: 320px wide x 180px tall
```

---

#### KPI 2: Customer Churn Rate

**Direction:** Lower is better
**Display Format:** Scorecard with 12-month trailing sparkline (inverted threshold logic)
**Comparison Type:** Primary -- target comparison; Secondary -- MoM period-over-period

**Card Elements:**

| Element | Specification |
|---------|--------------|
| Primary value | 3.2% |
| Primary value font | 32pt, Bold, #1A1A1A |
| KPI label | "Customer Churn Rate", 12pt, Regular, #666666 |
| Time period label | "October 2024", 11pt, #888888 |
| Delta indicator | ↑ +0.7pp above target |
| Delta label | "vs. target (≤ 2.5%)" |
| Delta color | #C0392B (red -- off-track) |
| Secondary delta | "vs. September 2024: [+/− Xpp vs. prior month]" (populate with actual prior-month value) |
| Trend element | Sparkline: trailing 12 months of monthly churn rate |
| Target reference | "Target: ≤ 2.5%", 11pt, #999999; dashed horizontal line at 2.5% in sparkline |
| Status indicator | Left border, 4px, #C0392B (red) |
| Status badge | "✗ Off-track", 11pt, #C0392B |

**Critical directionality reversal -- lower is better:**

| Arrow direction | Color | Meaning |
|----------------|-------|---------|
| ↓ Down | #27AE60 Green | Churn decreased -- GOOD |
| ↑ Up | #C0392B Red | Churn increased -- BAD |
| -- Flat | #888888 Gray | No meaningful change |

**Status Thresholds (inverted -- higher value = worse performance):**

| Status | Label | Color | Hex | Condition (stated in absolute units, not % of target) |
|--------|-------|-------|-----|-------------------------------|
| On-track | ✓ On-track | Green | #27AE60 | Churn Rate ≤ 2.5% (at or below target) |
| At-risk | ⚠ At-risk | Amber | #E67E22 | Churn Rate 2.5% to 3.0% (up to 0.5pp above target) |
| Off-track | ✗ Off-track | Red | #C0392B | Churn Rate > 3.0% (more than 0.5pp above target) |

**Threshold Rationale:** A 0.5pp overage (2.5% to 3.0%) represents roughly $50K additional MRR loss per month at this company's ARR -- manageable with targeted retention campaigns. Above 3.0% triggers a formal retention program escalation.

**Delta labeling note:** Display delta as "+0.7pp vs. target" not "+28% vs. target." The metric is already a percentage; reporting a percentage-of-a-percentage confuses stakeholders. Always use "pp" (percentage points) for churn rate deltas.

**Card Layout Diagram:**
```
+--[4px #C0392B red border]--------------------------------+
| Customer Churn Rate        Oct 2024   [Sparkline~~~~]    |
|                                        target: - - - -   |
| 3.2%                                                     |
| ↑ +0.7pp vs. target (≤ 2.5%)          ✗ Off-track       |
| ↑ +0.2pp vs. Sep 2024 (gray, 11pt)                       |
| Target: ≤ 2.5%                                           |
+----------------------------------------------------------+
Card size: 320px wide x 180px tall
```

---

#### KPI 3: Net Promoter Score

**Direction:** Higher is better
**Display Format:** Scorecard with 12-month trend line (not sparkline -- NPS has meaningful trajectory dynamics and monthly variance is low enough to show full trend)
**Comparison Type:** Primary -- target comparison; Secondary -- YoY comparison (NPS changes slowly; MoM changes are typically noise)

**Card Elements:**

| Element | Specification |
|---------|--------------|
| Primary value | 42 |
| Primary value font | 32pt, Bold, #1A1A1A |
| KPI label | "Net Promoter Score", 12pt, Regular, #666666 |
| Time period label | "October 2024", 11pt, #888888 |
| Delta indicator | ↓ −8 points vs. target |
| Delta label | "vs. target (50)" |
| Delta color | #E67E22 (amber -- at-risk) |
| Secondary delta | "vs. October 2023: [+/− X points YoY]" (populate with actual prior-year value) |
| Trend element | 12-month trend line with labeled Y-axis (range: 0 to 70 to show target meaningfully); mark target at 50 with dashed line |
| Scale label | "Scale: −100 to +100", 10pt, #AAAAAA, below the trend line |
| Status indicator | Left border, 4px, #E67E22 (amber) |
| Status badge | "⚠ At-risk", 11pt, #E67E22 |

**Status Thresholds:**

| Status | Label | Color | Hex | Condition (NPS points, whole numbers) |
|--------|-------|-------|-----|-------------------------------|
| On-track | ✓ On-track | Green | #27AE60 | NPS ≥ 50 (at or above target) |
| At-risk | ⚠ At-risk | Amber | #E67E22 | NPS 35 to 49 (within 15 points of target) |
| Off-track | ✗ Off-track | Red | #C0392B | NPS < 35 (more than 15 points below target) |

**Threshold Rationale:** An NPS gap of 15 points (35-49 range) is recoverable within 2-3 quarters through product and support improvements. Below 35 signals systemic customer experience failure requiring executive intervention.

**Comparison type note:** Do not use MoM comparison as primary for NPS -- a 2-point MoM swing is within survey sampling noise (NPS sample sizes of 200-500 produce ±5 to ±8 point confidence intervals). Use YoY comparison or a 3-month rolling average as the primary trend indicator.

**Card Layout Diagram:**
```
+--[4px #E67E22 amber border]-------------------------------------------+
| Net Promoter Score              Oct 2024   [Trend line chart 160x50px]|
|                                             target: - - - - (50)      |
| 42                                                                     |
| ↓ −8 pts vs. target (50)                           ⚠ At-risk          |
| +3 pts vs. Oct 2023 (gray, 11pt)                                       |
| Target: 50  |  Scale: −100 to +100                                     |
+-----------------------------------------------------------------------+
Card size: 360px wide x 180px tall (wider to accommodate trend line)
```

---

### Visual Standards (Applied Across All Three KPI Cards)

| Element | Standard |
|---------|----------|
| Card background | White #FFFFFF |
| Card border | #E8E8E8, 1px, 8px corner radius |
| Card padding | 16px all sides |
| Card minimum width | 280px (standard) / 360px (NPS feature card) |
| Card height | 180px (uniform across all three cards) |
| Status border (left edge) | 4px solid, status color |
| Card shadow | 0px 2px 8px rgba(0,0,0,0.08) |
| Primary number font | Inter (fallback: Roboto, system-ui), Bold |
| Primary number
