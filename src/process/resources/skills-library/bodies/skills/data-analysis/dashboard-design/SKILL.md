---
name: dashboard-design
description: |
  Produces a complete dashboard layout specification. Defines the business questions the dashboard answers, specifies each panel (chart type, data source, title, update frequency), and maps the layout grid with sizing and positioning.
  Use when the user needs to design a data dashboard for monitoring metrics, KPIs, or business performance.
  Do NOT use for selecting a single chart type (use chart-type-selector), defining KPI metrics (use kpi-definition), or formatting individual charts (use chart-formatting).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-visualization design analysis"
  category: "data-analysis"
  subcategory: "data-visualization"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Dashboard Design

## When to Use

**Use this skill when:**
- A user needs to design a new dashboard from scratch and wants a complete specification covering purpose, panels, layout, and interactivity -- not just chart type choices
- A user has a set of metrics, KPIs, or data sources and needs help organizing them into a coherent, navigable visual experience for a specific audience
- A user is preparing a dashboard for a recurring business ritual (weekly sales review, monthly executive meeting, daily ops standup) and needs the layout to match how the meeting flows
- A user is migrating or rebuilding a dashboard and wants to audit and rationalize what panels to keep, remove, or restructure
- A user is designing a multi-page or multi-tab dashboard suite (e.g., an executive overview linked to departmental detail views) and needs a logical information architecture
- A user describes a monitoring problem -- "I need to know when something goes wrong" or "leadership wants to see everything in one place" -- that implies the need for a persistent visual interface
- A user has already listed their metrics but does not know how to arrange, prioritize, or group them visually

**Do NOT use when:**
- The user only needs help choosing which chart type is appropriate for a single visualization -- use `chart-type-selector` instead
- The user needs to define which metrics to track, establish metric formulas, or set performance targets -- use `kpi-definition` first, then return to this skill
- The user wants to reformat, restyle, or fix an existing chart (axis labels, colors, font sizes) -- use `chart-formatting`
- The user wants to write a prose or slide-based narrative around data findings -- use `data-storytelling`
- The user is asking about database query design, ETL pipelines, or data model structure to feed a dashboard -- use the appropriate data-engineering skill
- The user wants a one-time data analysis or report, not a persistent monitoring tool -- a dashboard implies recurring use; a report implies a single delivery
- The user is asking which BI tool to buy or evaluate -- that is a tool-selection or procurement question outside this skill's scope

---

## Process

### Step 1: Establish the Dashboard's Purpose and Contract

Before specifying a single panel, lock in the purpose. A dashboard without a defined primary question will accumulate panels indefinitely.

- **Identify the primary question:** Ask the user to complete the sentence "This dashboard exists to answer the question: ___." If they cannot complete it, the dashboard lacks a north star. The primary question should be answerable in one glance at the top row.
- **Name the audience tier:** Executives consume dashboards in 60-90 seconds and need verdict, not data. Operational staff monitor dashboards continuously and need current-state accuracy. Analysts use dashboards as a launchpad for investigation and need filters and drill-down. Mixed audiences require separate sections or separate pages.
- **Determine the consumption pattern:** Is the dashboard displayed on a TV monitor (no interaction, wide format, large text, auto-refresh)? Viewed in a weekly meeting (projected, someone narrates it)? Opened on demand in a browser by individuals (interactive, filterable)? Each pattern affects layout width, font size, interactivity, and default state.
- **Define the viewing cadence:** Real-time (seconds to minutes) means operational -- data staleness is critical. Daily means business-day rhythm -- a "data as of" timestamp matters. Weekly or monthly means trend-focused -- period comparisons dominate. This cadence governs which metrics belong and at what granularity.
- **Identify the decision or action the dashboard enables:** If viewing the dashboard cannot change anyone's behavior, it should not be built. Every panel should trace to at least one decision: escalate, investigate, approve, alert, reallocate.
- **Confirm the data availability:** Each metric the user wants must exist as a queryable, joinable field somewhere. If the user lists a metric whose data does not exist or requires manual entry, flag it immediately and note it as a future panel or a data gap.

---

### Step 2: Classify the Dashboard Type and Set Panel Constraints

Choose one of three archetypes -- or a hybrid -- and enforce the panel limit that comes with it.

- **Strategic / Executive dashboard:** 4-8 panels maximum. Primary chart types: KPI scorecards, trend sparklines, bullet charts. No raw data tables. No micro-level detail. Color coding indicates status (on track / at risk / off track). Viewed by decision-makers who need a verdict, not a data dump. The entire screen should convey performance posture in under 90 seconds.
- **Operational / Monitoring dashboard:** 6-12 panels. Real-time or near-real-time data. Includes alert indicators, threshold lines, and status badges. May include tables with row-level detail for specific entities (agents, machines, orders). Designed to be scanned repeatedly throughout a shift or workday. Often displayed on a shared screen or TV.
- **Analytical / Diagnostic dashboard:** 8-14 panels with filter controls, drill-down paths, and detail tables. Audience is analysts or power users who investigate anomalies. Accepts more visual complexity because users spend time with it. Must include prominent filter controls -- without them, analysts will not trust what they see.
- **Hybrid:** A strategic top section (3-4 KPI scorecards filling the first viewport) with an analytical lower section (filterable charts below the fold). Use a visual separator between sections. Label the sections explicitly ("Executive Summary" / "Detail View").
- **Hard limits by type:** Strategic: 8 panels maximum. Operational: 12 panels maximum. Analytical: 14 panels maximum. Any dashboard exceeding these limits must be split across pages or tabs. A single page beyond 14 panels is indefensible -- research on dashboard cognition shows users stop processing new information after roughly 7-9 visual elements in a single session.

---

### Step 3: Define Every Panel Using the Five-Question Test

For each panel the user wants to include, apply this test before specifying it:

1. **What question does this panel answer?** State it as a specific question (e.g., "Is our 7-day rolling win rate above the 25% floor?"). If the answer is vague ("it shows sales data"), reject the panel or reframe it.
2. **Who needs this answer?** If the audience is an executive dashboard but the question only matters to a sales analyst, the panel belongs on the analytical dashboard, not this one.
3. **What is the right chart type for this question?** Apply the standard logic: comparison across categories = bar chart (horizontal for many categories, vertical for few); change over time = line chart (continuous data) or bar chart (discrete periods); part-to-whole = stacked bar or donut (donut only for 2-5 segments); distribution = histogram or box plot; correlation = scatter plot; current value vs. target = bullet chart or gauge. Do not use pie charts for more than 5 segments. Do not use 3D charts. Do not use gauges unless the audience is operational and the single-value status read is genuinely needed.
4. **What is the comparison?** Every panel must show the metric in context: versus target, versus prior period, versus benchmark, versus threshold, or versus another entity. A number in isolation is meaningless -- context is mandatory.
5. **How often does this data update?** Determine the refresh cadence per panel. If panels on the same dashboard have different refresh rates, group them visually and label their data freshness.

For each confirmed panel, specify:
- Panel title (states what it shows, not what it is called internally)
- Chart type and why
- Primary metric and its definition (including any filters, conditions, or calculation notes)
- Comparison baseline
- Data source (table name, query, or API endpoint -- be specific)
- Update frequency
- Status thresholds (green / yellow / red) if it is a KPI scorecard or monitoring panel

---

### Step 4: Design the Layout Grid

Use a 12-column grid. Every panel occupies a whole number of columns. Every row must add up to exactly 12 columns. Height is specified in units relative to one another (e.g., scorecards are 1 unit tall, trend charts are 2 units tall, large tables are 3 units tall).

**Layout hierarchy rules:**
- **Top row (the verdict row):** The first row must answer the primary question at a glance. Use 2-4 large KPI scorecards spanning the full width. If the primary question requires a trend (not just a current value), use a full-width or 2/3-width line chart here instead.
- **Second row (context row):** Supporting charts that explain the top-row verdict. Typically 2-3 equal panels (4 columns each). These are the "why is the top number what it is?" charts.
- **Third row and below (diagnostic rows):** Detail panels, breakdowns by segment or entity, tables, distribution charts. These require scrolling on most screens and serve analysts or operators who drill in.
- **Sidebar layout (for analytical dashboards):** Reserve columns 1-2 of every row for a filter panel when the dashboard is heavily filtered. Panels then occupy columns 3-12. Never use a sidebar for strategic dashboards -- it wastes valuable space.
- **Width guidance by chart type:** KPI scorecard: 2-4 columns. Line/bar trend chart: 6-12 columns (needs horizontal space to show trend). Table with multiple columns: 8-12 columns. Donut chart: 3-4 columns. Scatter plot: 6-8 columns. Geographic map: 6-12 columns.
- **The fold:** Assume the primary viewport shows the top 600-700px of the dashboard. The most critical information must live above the fold. Anything requiring scroll is secondary.
- **Whitespace:** Each row should have at least one panel that is noticeably wider or taller than the others -- this creates visual hierarchy and directs the eye. A grid where every panel is the same size is visually flat and harder to scan.

---

### Step 5: Specify Filters and Interactivity

Filters are not cosmetic -- they define the analytical surface area of the dashboard. Under-filtered dashboards show averages that obscure problems. Over-filtered dashboards paralyze users with options.

- **Global filters:** Apply to all panels simultaneously. Mandatory filters for almost every dashboard: date range (with sensible default -- last 30 days for operational, current quarter for strategic), primary segmentation dimension (region, product line, business unit). Expose as dropdown selectors or date pickers at the top of the dashboard, above all panels.
- **Local filters:** Apply to one panel only. Use sparingly -- only when a panel genuinely needs a different slice than the global context (e.g., a competitive benchmark panel that should not change when the user filters to a single region).
- **Default filter state:** Define the default for every filter. The default state is the dashboard's "opening argument" -- what it says before the user touches anything. Align the default to the most common use case: for a quarterly review dashboard, default to current quarter. For a daily ops dashboard, default to today.
- **Drill-down paths:** Specify which panels support click-through. A drill-down click should navigate to a detail view (another dashboard page, a filtered table, or a linked report) -- not simply zoom. Document the destination: "clicking a bar in Rep Performance navigates to Rep Detail page filtered to that rep."
- **Cross-filtering:** When a user clicks a data point in one panel and it filters all other panels, this is cross-filtering. It is powerful but disorienting if not communicated clearly. Only recommend cross-filtering for analytical dashboards where users understand filter context. Always show a visible "clear filter" control.
- **Tooltips:** Every chart should show a tooltip on hover that includes: the precise metric value (with full number format, not abbreviated), the comparison value, and the % difference from comparison. Do not show raw field names in tooltips -- show human-readable labels.
- **No-interaction mode:** For TV dashboards or projected dashboards, disable all interactivity. Set a 5-minute auto-refresh. Use large fonts (minimum 16pt labels, 36pt metric values). Remove filter controls entirely -- they confuse stakeholders and imply the view is not authoritative.

---

### Step 6: Define Visual Standards

Visual standards must be defined at the dashboard level, not panel by panel. Inconsistent visual standards are the most common reason dashboards look amateurish.

- **Color palette:** Maximum 5 functional colors plus gray. Assign semantic meaning: one color for the primary metric (neutral, no judgment -- typically navy or slate blue), one for positive deviation (green family: #27AE60 or similar), one for negative deviation (red family: #E74C3C or similar), one for warning/caution (amber: #F39C12), one for a secondary metric or comparison line (lighter or muted version of primary). Gray (#95A5A6 or #BDC3C7) for grid lines, axis labels, and non-critical annotations. Do not use color simply to differentiate categories if there are more than 5-6 -- use position or labels instead.
- **Typography:** Use two font sizes: large (28-36pt) for scorecard metric values, medium (12-14pt bold) for panel titles, small (10-11pt) for axis labels and data labels. Metric values should be in a bold, tabular-numeral font so digits align in columns. Avoid decorative fonts entirely.
- **Number formatting:** Define a standard and apply it everywhere. Currency: use $X,XXX for values above $1,000, $X.XM for values above $1,000,000. Percentages: always one decimal (XX.X%). Large counts: use K suffix above 10,000, M suffix above 1,000,000. Date formats: spell out month abbreviations (Jan, Feb) rather than numeric month formats to avoid regional ambiguity.
- **Status thresholds:** Define all green / yellow / red thresholds before building. Thresholds should be derived from business logic, not arbitrary split points. For revenue attainment: green >= 90% of prorated target, yellow 70-89%, red < 70% is a common starting point -- but confirm with the business owner, who may have different risk tolerance. Document the threshold rationale in the specification so it can be revisited.
- **Grid lines and borders:** Use light gray grid lines (#ECEFF1) at minimum opacity. Do not use heavy borders around panels -- this fragments the visual space. Use whitespace as the separator between panels, not lines or boxes.
- **Annotations:** Any panel that shows a historical anomaly (a spike or drop that will trigger questions) should have a pre-placed annotation explaining it (e.g., "Holiday week" or "System outage"). Dashboards reviewed in meetings without annotations cause the presenter to spend the first five minutes explaining the same anomalies every time.

---

### Step 7: Write the Dashboard Specification Document

Produce the complete specification in the output format defined below. The specification must be self-contained -- a developer, analyst, or BI engineer who receives only this document should be able to build the dashboard without additional clarification.

- State the layout grid as an ASCII diagram showing every row and column assignment
- Define every panel with all five specification fields: question answered, chart type, data source, comparison, and thresholds
- List every filter with its type, scope, and default
- State the visual standard table
- Flag any data gaps or assumptions -- panels that rely on data that has not been confirmed as available should be marked with [DATA UNCONFIRMED] so the builder knows to validate before implementing
- Note the planned page/tab structure if the dashboard has multiple pages
- Include a "Questions this dashboard does NOT answer" section if the user listed metrics that were excluded -- this prevents scope creep during build

---

## Output Format

```
## Dashboard Specification

### Summary

| Element | Value |
|---------|-------|
| Dashboard name | [Name] |
| Version | v1.0 |
| Audience | [Who views this -- be specific about role] |
| Consumption pattern | [Projected / TV monitor / Individual browser / Mobile] |
| Primary question | [The single question answered at a glance by Row 1] |
| Dashboard type | [Strategic / Operational / Analytical / Hybrid] |
| Total panels | [N] |
| Page count | [N pages or 1 page] |
| Data refresh | [Real-time / Hourly / Daily at Xam / Weekly] |
| Default filter state | [e.g., Current quarter, All regions] |

---

### Questions This Dashboard Answers

| Priority | Question | Panel(s) That Answer It |
|----------|----------|------------------------|
| Primary | [Most important question] | [Panel name(s)] |
| Secondary | [Second question] | [Panel name(s)] |
| Secondary | [Third question] | [Panel name(s)] |
| Supporting | [Fourth question] | [Panel name(s)] |
| Supporting | [Fifth question] | [Panel name(s)] |

### Questions This Dashboard Does NOT Answer
(Explicitly excluded scope -- prevents scope creep during build)
- [Metric or question excluded, and why or where it belongs instead]

---

### Panel Specifications

#### Panel [N]: [Descriptive Title]

| Element | Value |
|---------|-------|
| Primary question answered | [Specific question this panel answers] |
| Position | Row [N], Columns [N]-[N] of 12 |
| Height units | [1 = scorecard / 2 = standard chart / 3 = large chart or table] |
| Chart type | [Specific type with justification: e.g., "Horizontal bar -- comparing named categories"] |
| Primary metric | [Metric name: definition including any filters or conditions] |
| Secondary metric / comparison | [Metric name: what it is compared against] |
| Data source | [Table or view name, query summary, or API endpoint] |
| Aggregation | [Sum / Count / Average / Median / etc. and the grain] |
| Update frequency | [Real-time / Hourly / Daily / Weekly] |
| Status thresholds | Green: [condition] / Yellow: [condition] / Red: [condition] |
| Interactivity | [None / Drill-down to X / Cross-filter / Tooltip: fields shown] |
| Data confirmed | [Yes / No -- DATA UNCONFIRMED] |
| Notes | [Any caveats, calculation complexity, or display guidance] |

(Repeat for each panel)

---

### Layout Grid

Page: [Page name]

```
         Col 1-2   Col 3-4   Col 5-6   Col 7-8   Col 9-10  Col 11-12
Row 1:   [Panel name spanning cols 1-8          ] [Panel 2  (9-12)  ]
Row 2:   [Panel 3 (1-4)     ] [Panel 4 (5-8)   ] [Panel 5  (9-12)  ]
Row 3:   [Panel 6 (1-6)                         ] [Panel 7  (7-12)  ]
Row 4:   [Panel 8 spanning full width (1-12)                        ]
```

Height map:
- Row 1: 1.5 units (scorecard height)
- Row 2: 2 units (standard chart height)
- Row 3: 2.5 units (detail chart height)
- Row 4: 3 units (table height)

Fold line: Above Row [N] is visible without scrolling on a 1080p display

---

### Filters and Interactivity

| Filter Name | Type | Scope | Default Value | Options |
|-------------|------|-------|---------------|---------|
| Date range | Date range picker | Global | [Default period] | [Available options] |
| [Dimension 1] | Dropdown (single) | Global | All | [Values or "All values in dim"] |
| [Dimension 2] | Dropdown (multi) | Global | All | [Values] |
| [Local filter] | Dropdown | Panel [N] only | [Default] | [Values] |

Drill-down paths:
- [Panel name] → clicking [element] navigates to [destination page/view] filtered by [filter applied]

Cross-filtering:
- [Enabled / Disabled]. If enabled: clicking [panel name] filters [list of affected panels].

Auto-refresh: [Enabled at X-minute interval / Disabled]

---

### Visual Standards

| Element | Standard |
|---------|----------|
| Primary metric color | [Hex code] -- used for main data series |
| Positive / above target | [Hex code, green family] |
| Negative / below target | [Hex code, red family] |
| Warning / approaching threshold | [Hex code, amber family] |
| Comparison / secondary series | [Hex code, muted or lighter] |
| Neutral / non-data elements | [Hex code, gray] |
| Dashboard background | [Hex code -- white #FFFFFF or near-white #F8F9FA] |
| Panel background | [Hex code -- white or very light gray] |
| Grid lines | [Hex code -- #ECEFF1, minimum opacity] |
| Primary font (titles) | [Font name, size, weight: e.g., Inter 14pt Bold] |
| Metric value font (scorecards) | [Font name, size, weight: e.g., Inter 32pt Bold] |
| Axis / label font | [Font name, size, weight: e.g., Inter 10pt Regular] |
| Currency format | [e.g., $X,XXX no decimals; $X.XM for millions] |
| Percentage format | [e.g., XX.X% always one decimal] |
| Large number format | [e.g., X.XK above 10K; X.XM above 1M] |
| Date format | [e.g., MMM DD or Q1 FY25 -- never MM/DD/YYYY] |

---

### Data Gaps and Assumptions

| Item | Status | Resolution Required |
|------|--------|-------------------|
| [Metric or field] | Confirmed / Unconfirmed | [What needs to be verified] |
| [Calculation assumption] | Assumed | [Confirm with business owner] |

---

### Build Notes

- [Any sequencing note: "Build Panel 1 and 2 first for executive review before building rows 3-4"]
- [Any dependency: "Pipeline by Stage requires Stage field to be standardized -- confirm with data team"]
- [Any phasing: "Phase 1 includes Panels 1-5; Phase 2 adds Panels 6-8 after data pipeline is confirmed"]
```

---

## Rules

1. **NEVER build a dashboard without a stated primary question.** If the user says "I want to see everything about sales," push back immediately. Ask "What is the single question a viewer should be able to answer in 10 seconds by looking at this dashboard?" Everything else is secondary. A dashboard without a primary question becomes a data dump that no one trusts.

2. **NEVER exceed 12 panels on a single page for a strategic or operational dashboard, and 14 for analytical.** Cognitive load research consistently shows diminishing returns beyond 7-9 visual elements in a single session. When a user insists on 20 panels, do not comply -- restructure into pages or tabs with a clear navigation hierarchy. The top page should always be the overview.

3. **ALWAYS put the primary question's answer in the top-left or top-center position.** Eye-tracking studies of dashboard usage show an F-pattern and Z-pattern reading behavior -- the top-left is processed first, every time. The most important KPI scorecard or headline chart belongs there. Placing the logo or a decorative chart in that position wastes the highest-value real estate on the screen.

4. **EVERY panel must have a comparison value -- no exceptions.** A revenue number of $1.2M is meaningless without knowing whether the target was $1.0M (great) or $2.0M (bad). Every KPI scorecard must show: current value, comparison value, and the delta expressed as both absolute and percentage. "%" alone is ambiguous -- "$200K below target (-14.3%)" is not.

5. **Status thresholds (red/yellow/green) must be defined from business logic, not split evenly.** A common mistake is to set thresholds at 0-50% red, 50-80% yellow, 80-100% green. These are arbitrary. The correct thresholds come from the business: what level of attainment triggers an escalation? What level is acceptable but warrants attention? Confirm thresholds with a business owner and document the rationale. The specific numbers matter because they will be used in automated alerts.

6. **NEVER use a pie chart for more than 4 segments, and never use 3D chart types.** Pie charts with 5+ segments are unreadable -- use a horizontal bar chart sorted descending instead. 3D charts distort perception of magnitude and have no legitimate use case in a data dashboard. Gauges are acceptable only on operational dashboards where the audience is specifically trained to read them.

7. **Date range filters must default to the most relevant period for the audience, not "all time."** An executive reviewing a quarterly dashboard should see the current quarter by default. An operator monitoring a call center should see today by default. "All time" as a default forces users to constantly re-filter and makes trend charts unreadable. Define the default date range as part of the specification and confirm it with the user.

8. **Group panels by update frequency when multiple frequencies exist.** Never place a real-time panel next to a monthly-aggregate panel without clearly labeling each one's data freshness. Use section headers and "Last updated: [timestamp]" labels. Mixed refresh rates without labeling cause stakeholders to question data accuracy across all panels, not just the stale one.

9. **Use sorted layouts in bar charts by default.** A bar chart showing 15 sales reps in alphabetical order is almost useless -- it requires the viewer to search, not scan. Always specify "sorted by [metric] descending" or "sorted by [metric] ascending" in the panel specification. The only exception is when the order itself is meaningful (e.g., pipeline stages in funnel order, months in chronological order).

10. **Dashboard specifications must include a "Questions Not Answered" section.** When working with a user, they will inevitably propose panels that do not belong on this dashboard. These must be documented explicitly as out-of-scope. If they are not documented, they will be re-requested during the build review as "missing" items. Capturing them as excluded scope with a reason ("Sales rep compensation data -- belongs on HR dashboard, not sales performance") prevents scope creep and documents the deliberate decision.

11. **A data table is a panel of last resort, not a default.** Users often request a "data table showing all the transactions" as a dashboard panel. A table showing 200 rows with 12 columns provides no at-a-glance insight. If a table is genuinely needed, limit it to a maximum of 10 rows (the top N ranked entities) and 5-6 columns showing only the critical fields. Add a "View full report" link for users who need all rows.

12. **Mobile layout is a separate specification, not a subset of the desktop layout.** If the dashboard will be viewed on mobile devices, a 12-column grid collapses to a single-column stack. The mobile specification must re-prioritize panels: only the top 4-5 most critical panels survive on mobile; the rest require a "full view" tap. Never assume the desktop layout translates automatically -- specify the mobile panel order explicitly.

---

## Edge Cases

**User has only 2-3 metrics to display:**
Do not pad the dashboard with unnecessary panels to fill the screen. Design a single-row layout with 2-3 large KPI scorecards using full-height display. Each scorecard should show: the metric value in large type, a sparkline of the last 12-13 periods, comparison to target and to prior period, and status color. The entire dashboard is one row. Use a subtitle or page header to convey context. A clean three-panel dashboard with full data context communicates more than a cluttered eight-panel dashboard with half the context per panel.

**User wants both real-time and historical data on the same dashboard:**
Separate them into two named sections with a visible section divider and distinct "data freshness" labels. Top section: "Live Operations" -- real-time panels, auto-refreshing every 1-5 minutes, timestamps visible on each panel. Bottom section: "Historical Context" -- daily or monthly aggregate panels, stamped with "Data as of [date]." Never allow a real-time panel to sit next to a monthly aggregate without the divider -- viewers conflate the time horizons and draw incorrect conclusions. Consider using a subtle background color difference between sections.

**Audience is genuinely mixed (C-suite and analysts using the same URL):**
Design a layered architecture, not a compromise layout. The first screen (above the fold) is the executive section: 3-4 KPI scorecards only, no labels below 14pt, no filters visible. Below the fold begins the analytical section with filters, detail charts, and tables. Alternatively, use a tabbed structure: Tab 1 labeled "Overview" (executive-appropriate, no filters, no interactivity), Tab 2 labeled "Details" (filter panel, drill-down charts, tables). The tabs share the same underlying data and filter state -- switching from Detail back to Overview should reflect any filters applied.

**User needs to track more than 15 distinct metrics:**
This is a dashboard architecture problem, not a layout problem. A single page cannot effectively present 15+ metrics. The correct response is to design a dashboard suite: one overview page (4-6 headline KPIs, navigation to sub-pages) plus 2-4 focused sub-pages (one per functional domain: Sales, Marketing, Product, Operations). Each sub-page has 6-10 panels. The overview page is the entry point and navigation hub. Design the overview page first, confirm it with the user, then design each sub-page. All sub-pages should share a consistent layout template so navigation feels coherent.

**Data updates at different frequencies across panels (mix of real-time, daily, and weekly):**
Never mix refresh rates silently. Three strategies: (1) Group by frequency -- dedicate page sections to each frequency with clear labels and dividers. (2) Display individual panel timestamps -- each panel shows "Last updated: 2 min ago" or "Data as of: Jan 14, 9:00am." (3) Throttle everything to the slowest frequency and state it prominently -- acceptable only for strategic dashboards where operational accuracy is not needed. Option 2 is recommended for analytical dashboards. Option 3 is appropriate for executive or strategic dashboards where the audience does not need sub-daily precision.

**User describes a dashboard for a TV monitor or ambient display (no interaction):**
Apply TV mode specifications: minimum 24pt font for all labels, minimum 48pt for metric values, no filter controls, no hover tooltips, no drill-down links, auto-refresh every 3-5 minutes. Use the full screen width without sidebars. Limit to 6-8 panels maximum -- smaller text on a wall-mounted screen at viewing distance of 3-4 meters becomes unreadable. Prefer bold, high-contrast color pairs (dark background with bright metric values, or white background with dark heavy text). Auto-rotation between pages is acceptable if multiple topics must be covered -- set rotation intervals of 20-30 seconds per page.

**User wants to add a geographic map panel:**
Maps are appropriate only when geography is the analytical dimension (comparing performance by state, region, or territory). Maps are inappropriate when the data happens to have a location field but the question is not geographic (e.g., using a country dot map to show customer count when a ranked bar chart would be faster to read). If a map is warranted, specify: the geographic grain (country, state/province, ZIP code, custom territory), the metric encoded as the map dimension (fill color, bubble size, or choropleth gradient), the color scale and its midpoint, and what clicking a geography does (filters the other panels, or navigates to a territory detail page). Choropleth maps require a diverging color scale centered at the target or average -- not a sequential scale starting at zero, which distorts perception for metrics where the interesting range is near the midpoint.

**User's dashboard has been "designed" already but is not working -- a rebuild request:**
Before redesigning, conduct a brief audit of the existing dashboard. Ask: (1) Which panels are actually used? (2) Which questions cannot be answered? (3) What filters are used versus ignored? (4) What data is wrong or stale? Do not simply replicate the existing layout with better formatting -- the existing layout is likely the problem. Use the audit findings to justify removing panels (typically 30-40% of panels on legacy dashboards are vestigial), consolidating redundant charts, and restructuring the layout hierarchy. Document what was removed and why in the "Questions Not Answered" section of the new specification.

---

## Example

**Input:** "I need a dashboard for our e-commerce operations team. They monitor the business every day and need to see order volume, revenue, site traffic, conversion rate, average order value, fulfillment performance (on-time ship rate, average ship time), and customer service load (open tickets, first response time). About 8-10 people will use this daily, mostly operations managers and one VP who checks it every morning. We have Shopify for orders, Google Analytics for traffic, and a custom fulfillment database."

---

**Output:**

## Dashboard Specification

### Summary

| Element | Value |
|---------|-------|
| Dashboard name | E-Commerce Daily Operations Dashboard |
| Version | v1.0 |
| Audience | Operations managers (daily users), VP Operations (morning review) |
| Consumption pattern | Individual browser -- interactive, filterable; VP uses read-only summary view |
| Primary question | Is today's order volume, revenue, and fulfillment on track relative to this week last year and our daily target? |
| Dashboard type | Hybrid -- Strategic top section (VP summary) + Operational detail (manager view) |
| Total panels | 10 panels across 1 page (2 logical sections) |
| Page count | 1 page with 2 sections; tab to "Fulfillment Detail" for drill-down |
| Data refresh | Hourly (Shopify + fulfillment DB); Daily at 6am (Google Analytics -- GA data lags) |
| Default filter state | Today's date; All channels; All product categories |

---

### Questions This Dashboard Answers

| Priority | Question | Panel(s) That Answer It |
|----------|----------|------------------------|
| Primary | Is today's revenue and order volume on pace with our daily target and with the same day last year? | Daily Revenue Scorecard, Orders Scorecard, Revenue Trend (hourly) |
| Secondary | Is our site converting traffic into orders at a healthy rate today? | Traffic Scorecard, Conversion Rate Trend |
| Secondary | Are orders shipping on time and within SLA? | On-Time Ship Rate Scorecard, Average Ship Time Trend |
| Supporting | How is our average order value trending compared to last week? | AOV Scorecard |
| Supporting | Is customer service load increasing or decreasing today? | Open Tickets Scorecard, First Response Time Panel |

### Questions This Dashboard Does NOT Answer
- **Returns and refund rate** -- excluded from v1.0; belongs on Finance dashboard; requires returns data not yet available in Shopify integration
- **Inventory levels and stockouts** -- excluded; belongs on Inventory Management dashboard with separate warehouse data feed
- **Marketing channel attribution** -- excluded; GA source/medium breakdown is a Marketing dashboard concern, not daily ops
- **Customer-level order detail** -- row-level order data is too granular for this dashboard; link to Shopify admin for order lookup

---

### Panel Specifications

#### Panel 1: Daily Revenue vs. Target

| Element | Value |
|---------|-------|
| Primary question answered | Is today's revenue on pace to hit the daily target? |
| Position | Row 1, Columns 1-3 of 12 |
| Height units | 1.5 (scorecard height) |
| Chart type | KPI scorecard with 7-day sparkline -- single value with comparison badges |
| Primary metric | Revenue today (MTD revenue is available as secondary label): sum of order revenue in Shopify for orders placed since midnight local time |
| Secondary metric / comparison | (1) Today's prorated daily target (monthly target / business days in month); (2) Same day last year (SDLY) |
| Data source | Shopify Orders table: sum(order_total) WHERE created_at >= today 00:00 AND status != 'cancelled' |
| Aggregation | Sum; grain = day |
| Update frequency | Hourly |
| Status thresholds | Green: >= 90% of prorated daily target / Yellow: 70-89% / Red: < 70% |
| Interactivity | Tooltip: exact revenue value, target value, SDLY value, % vs target, % vs SDLY |
| Data confirmed | Yes -- Shopify orders table confirmed |
| Notes | "Daily target" field must be configured as a parameter populated from a targets table (not hardcoded). Exclude test orders (tag = 'test'). |

---

#### Panel 2: Orders Today vs. Target

| Element | Value |
|---------|-------|
| Primary question answered | Are we receiving the expected number of orders today? |
| Position | Row 1, Columns 4-6 of 12 |
| Height units | 1.5 |
| Chart type | KPI scorecard with 7-day sparkline |
| Primary metric | Order count today: count of distinct order_id in Shopify for orders placed since midnight |
| Secondary metric / comparison | (1) Daily order target; (2) SDLY order count |
| Data source | Shopify Orders table: count(order_id) WHERE created_at >= today 00:00 AND status != 'cancelled' |
| Aggregation | Count distinct; grain = day |
| Update frequency | Hourly |
| Status thresholds | Green: >= 90% of daily target / Yellow: 70-89% / Red: < 70% |
| Interactivity | Tooltip: order count, target, SDLY, % vs target |
| Data confirmed | Yes |
| Notes | Separate order count from revenue -- sometimes revenue is on target but order count is low (AOV spike) or vice versa. Both signals matter independently. |

---

#### Panel 3: Average Order Value (AOV)

| Element | Value |
|---------|-------|
| Primary question answered | Is our average order value healthy today compared to the last 30 days? |
| Position | Row 1, Columns 7-9 of 12 |
| Height units | 1.5 |
| Chart type | KPI scorecard with 30-day sparkline |
| Primary metric | AOV today: sum(order_total) / count(order_id) for today |
| Secondary metric / comparison | 30-day rolling average AOV |
| Data source | Shopify Orders table -- derived from Panel 1 and Panel 2 metrics |
| Aggregation | Average; grain = day |
| Update frequency | Hourly |
| Status thresholds | No red/yellow/green threshold -- contextual comparison only. Flag if today's AOV is > 20% above or below 30-day average (may indicate data issue or promotional pricing anomaly). |
| Interactivity | Tooltip: today's AOV, 30-day average, % difference |
| Data confirmed | Yes |
| Notes | AOV alone is not actionable -- it is a diagnostic indicator. If AOV spikes, check for bulk orders or promotions. If AOV drops, check for coupon misapplication. |

---

#### Panel 4: Site Traffic and Conversion Rate

| Element | Value |
|---------|-------|
| Primary question answered | Is our site driving enough traffic and converting it at a normal rate today? |
| Position | Row 1, Columns 10-12 of 12 |
| Height units | 1.5 |
| Chart type | KPI scorecard -- dual metric (sessions + conversion rate) with 7-day sparklines each |
| Primary metric | (1) Sessions today (Google Analytics sessions, all channels); (2) E-commerce conversion rate today (transactions / sessions x 100) |
| Secondary metric / comparison | (1) Sessions SDLY; (2) 30-day average conversion rate |
| Data source | Google Analytics -- requires GA4 API or daily export at 6am; data is previous day by default [DATA PARTIALLY CONFIRMED -- confirm GA4 API access] |
| Aggregation | Sum (sessions); ratio (conversion rate); grain = day |
| Update frequency | Daily at 6am (GA lags) -- label panel: "GA data as of yesterday" |
| Status thresholds | Conversion rate: Green: within ±15% of 30-day average / Yellow: 15-30% below / Red: >30% below average. Sessions: informational only, no threshold. |
| Interactivity | Tooltip: sessions, conversion rate, SDLY sessions, 30-day average conversion rate |
| Data confirmed | Partially -- GA4 API integration needs confirmation from data team |
| Notes | Do not show today's GA data as real-time -- GA4 data for the current day has up to 48-hour latency. Always label: "GA data as of [yesterday's date]." |

---

#### Panel 5: Hourly Revenue Trend (Today vs. SDLY)

| Element | Value |
|---------|-------|
| Primary question answered | At what time of day is revenue coming in, and is the intraday pattern normal? |
| Position | Row 2, Columns 1-8 of 12 |
| Height units | 2.5 |
| Chart type | Dual-series line chart: solid line = today's cumulative revenue by hour; dashed line = SDLY cumulative revenue by hour; horizontal dashed reference line = daily target |
| Primary metric | Cumulative revenue by hour of day (0-23) for today |
| Secondary metric / comparison | Cumulative revenue by hour for same day last year (SDLY) |
| Data source | Shopify Orders table: sum(order_total) grouped by hour(created_at) |
| Aggregation | Cumulative sum; grain = hour |
| Update frequency | Hourly |
| Status thresholds | Visual only -- the gap between today's line and SDLY line is the indicator. No formal threshold on this chart. |
| Interactivity | Tooltip per hour point: cumulative revenue (today), cumulative revenue (SDLY), difference ($), difference (%). Cross-filter: clicking a specific hour filters Panel 8 (Customer Service Load) to that hour window. |
| Data confirmed | Yes |
| Notes | The SDLY line must account for day-of-week alignment -- compare "this Tuesday" to "the same Tuesday last year," not simply "same calendar date." |

---

#### Panel 6: On-Time Ship Rate

| Element | Value |
|---------|-------|
| Primary question answered | Are orders shipping within the promised timeframe today? |
| Position | Row 2, Columns 9-12 of 12 |
| Height units | 1.5 |
| Chart type | KPI scorecard with 14-day sparkline |
| Primary metric | On-time ship rate: orders shipped within SLA / total orders shipped today x 100. SLA = 2 business days for standard, same-day for expedited. |
| Secondary metric / comparison | 14-day rolling average on-time ship rate |
| Data source | Fulfillment DB: orders table JOIN shipment_events table; SLA lookup by shipping_method |
| Aggregation | Ratio; grain = day |
| Update frequency | Hourly |
| Status thresholds | Green: >= 95% on-time / Yellow: 90-94% / Red: < 90% |
| Interactivity | Drill-down: clicking scorecard navigates to "Fulfillment Detail" tab filtered to today's late shipments |
| Data confirmed | Yes -- fulfillment DB confirmed; SLA lookup table needs to be created [DATA PARTIALLY CONFIRMED] |
| Notes | Confirm SLA thresholds with fulfillment manager. Expedited orders have a same-day SLA; distinguish them in the rate calculation. |

---

#### Panel 7: Average Ship Time Trend (14-Day)

| Element | Value |
|---------|-------|
| Primary question answered | Is our average time from order to shipment trending up (worsening) or down (improving)? |
| Position | Row 3, Columns 1-6 of 12 |
| Height units | 2 |
| Chart type | Bar chart (one bar per day, last 14 days) with reference line at SLA threshold (2 days) |
| Primary metric | Average hours from order_created_at to first shipment_event (shipped status) per day |
| Secondary metric / comparison | Reference line: 48-hour SLA for standard shipping |
| Data source | Fulfillment DB: avg(shipped_at - created_at) in hours, grouped by order date |
| Aggregation | Average; grain = day |
| Update frequency | Hourly |
| Status thresholds | Bar color: Green if bar <= 48 hours / Yellow if 48-60 hours / Red if > 60 hours |
| Interactivity | Tooltip: average ship time for that day, count of orders in that day's calculation, % of orders above SLA. |
| Data confirmed | Yes |
| Notes | Average ship time can be skewed by a few very late orders. If the user later requests it, add a median ship time line as a secondary series to detect skew. |

---

#### Panel 8: Open Customer Service Tickets

| Element | Value |
|---------|-------|
| Primary question answered | Is the customer service backlog at a manageable level right now? |
| Position | Row 3, Columns 7-9 of 12 |
| Height units | 2 |
| Chart type | KPI scorecard (open ticket count) with a 7-day bar chart below showing new tickets opened per day |
| Primary metric | Count of open tickets (status = 'open' or 'pending') as of now |
| Secondary metric / comparison | (1) Open ticket count at same time yesterday; (2) 7-day average open tickets at this time of day |
| Data source | Customer service platform export (daily file or API) [DATA UNCONFIRMED -- confirm CS platform and integration method] |
| Aggregation | Count; grain = snapshot (current count) for scorecard; daily new count for bar chart |
| Update frequency | Hourly -- if CS platform supports it; daily if not |
| Status thresholds | Green: <= 7-day average / Yellow: 10-25% above 7-day average / Red: > 25% above 7-day average |
| Interactivity | Tooltip: exact ticket count, change from yesterday, % above/below average |
| Data confirmed | No -- DATA UNCONFIRMED. Depends on CS platform API access. |
| Notes | If API is not available in Phase 1, this panel can show daily counts from manual export with "Data as of yesterday" label. |

---

#### Panel 9: First Response Time (FRT) Trend

| Element | Value |
|---------|-------|
| Primary question answered | Is the customer service team responding to new tickets within the target response time? |
| Position | Row 3, Columns 10-12 of 12 |
| Height units | 2 |
| Chart type | KPI scorecard (today's FRT) with 14-day sparkline |
| Primary metric | Median first response time in hours for tickets created today |
| Secondary metric / comparison | FRT target (confirm with CS manager -- typically 4 hours for standard, 1 hour for VIP) |
| Data source | Customer service platform -- same as Panel 8 [DATA UNCONFIRMED] |
| Aggregation | Median; grain = day |
| Update frequency | Hourly |
| Status thresholds | Green: FRT <= target / Yellow: FRT 1.25x target / Red: FRT > 1.5x target |
| Interactivity | Tooltip: median FRT, target FRT, % above/below target |
| Data confirmed | No -- DATA UNCONFIRMED. Same dependency as Panel 8. |
| Notes | Use median, not mean, for FRT -- a few extremely slow tickets should not distort the operational picture. |

---

#### Panel 10: Today's Orders Table (Top 20 Largest Orders)

| Element | Value |
|---------|-------|
| Primary question answered | Are any unusually large or anomalous orders requiring manual review today? |
| Position | Row 4, Columns 1-12 of 12 |
| Height units | 3 |
| Chart type | Sortable data table: 20 rows maximum, 6 columns |
| Primary metric | Order ID, Customer Name, Order Total, Order Time, Shipping Method, Fulfillment Status |
| Secondary metric / comparison | Sorted by order_total descending by default; sortable by any column |
| Data source | Shopify Orders table: top 20 by order_total for today |
| Aggregation | Row-level; sorted |
| Update frequency | Hourly |
| Status thresholds | Flag orders > 3x the 30-day average AOV in amber. Flag orders in 'unfulfilled' status older than 6 hours in red. |
| Interactivity | Each row links to the order in Shopify admin. Clicking order row does not cross-filter other panels. |
| Data confirmed | Yes |
| Notes | Limit strictly to 20 rows. This is an anomaly-detection tool, not a full order ledger. Include "View all orders in Shopify" link below the table. |

---

### Layout Grid

Page: E-Commerce Daily Operations

```
         Cols 1-3        Cols 4-6        Cols 7-9        Cols 10-12
Row 1:   [Revenue        [Orders         [AOV Today      [Traffic +
          Today (1-3)]    Today (4-6)]    (7-9)]           Conv. Rate (10-12)]

Row 2:   [Hourly Revenue Trend -- Today vs. SDLY (1-8)]  [On-Time
                                                           Ship Rate (9-12)]

Row 3:   [Avg Ship Time Trend 14-day (1-6)]  [Open CS    [FRT Trend
                                               Tickets     (10-12)]
                                               (7-9)]

Row 4:   [Today's Top 20 Orders Table (1
