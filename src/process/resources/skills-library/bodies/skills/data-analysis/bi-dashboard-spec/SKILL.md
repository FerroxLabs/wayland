---
name: bi-dashboard-spec
description: |
  Produces a BI dashboard specification for a named business function including dashboard purpose, audience, KPIs displayed, panel layout, refresh cadence, access permissions, and alert thresholds. Outputs a complete spec ready for implementation in any BI tool.
  Use when the user asks to design a dashboard, create a dashboard specification, plan a BI dashboard layout, or define what should appear on a business dashboard.
  Do NOT use for individual KPI definitions with formulas (use kpi-definition), metric hierarchy design (use metric-framework), or data visualization chart selection (use chart-type-selector).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-visualization analysis template"
  category: "data-analysis"
  subcategory: "business-intelligence"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# BI Dashboard Specification

## When to Use

**Use this skill when:**
- A user asks to design, plan, or document a dashboard for a specific business function -- sales, marketing, product, operations, finance, customer support, HR, or executive leadership
- A user wants a formal specification document before building in a BI tool (Tableau, Power BI, Looker, Metabase, ThoughtSpot, Sigma, or Redash) so implementation teams know exactly what to build
- A user asks "what should be on my dashboard?" or "how should I organize my dashboard panels?" -- they need layout and prioritization guidance, not just a list of metrics
- A user is migrating from a spreadsheet-based report to a BI tool and needs the layout, interaction model, and data source mapping documented before the build begins
- A user wants to standardize dashboard design across a team or department and needs a template or spec that multiple people can follow
- A user wants to define refresh cadence, access permissions, row-level security rules, and alert thresholds -- the operational configuration that BI tools require before go-live
- A user is presenting a dashboard design for stakeholder approval and needs a readable, tool-agnostic specification document

**Do NOT use when:**
- The user needs individual KPI formulas, numerator/denominator logic, or metric ownership definitions -- use `kpi-definition` instead; this skill assumes KPIs have already been selected
- The user needs to design a metric hierarchy that flows from a north star metric down to diagnostic and input metrics -- use `metric-framework` first, then return to this skill for the dashboard layout
- The user is asking which chart type is best for a specific data pattern (e.g., "should I use a scatter plot or heatmap for this?") -- use `chart-type-selector`; this skill uses chart type guidance but does not teach chart selection theory
- The user needs to design a data pipeline, build a dbt model, or connect a new data source to their BI tool -- use `etl-pipeline-design`; this skill assumes data is already available and addressable
- The user wants a one-time analysis or ad-hoc query, not a recurring monitored dashboard -- use `exploratory-data-analysis` for that
- The user wants to evaluate or compare BI tools against each other -- use `bi-tool-evaluation`; this skill is tool-agnostic at the specification level

---

## Process

### Step 1: Establish Dashboard Context and Constraints

Before designing any panel, gather the context that governs every design decision. The answers to these questions constrain chart types, filter depth, refresh cadence, and layout complexity.

- **Business function:** Which function is this dashboard for? Sales, Marketing, Product, Finance, Operations, Customer Support, HR, or Executive (cross-functional). Each function has standard KPI patterns -- do not start from scratch.
- **Audience level:** Identify the primary viewer. Executives need 1-glance answers and maximum 6 panels with no tables. Managers need performance-by-segment breakdowns and comparison to targets. Analysts need detail tables, drill-down paths, and segment selectors. Individual contributors need personal performance panels with team context. A single dashboard rarely serves all four audiences well -- if multiple audience levels exist, plan for separate pages or role-based views.
- **Decision type:** A dashboard exists to drive a specific set of decisions. Name them explicitly: "prioritize where to focus sales effort this week," "decide whether to increase ad spend on a channel," "decide whether to escalate an operational incident." Every panel must connect to at least one of these decisions -- if it doesn't, cut it.
- **Viewing frequency and context:** How often and where will users view this? Multiple times per day during active operations (operations center, SDR floor) requires real-time refresh and status-indicator design. Daily morning check-in means a 6am data refresh is sufficient. Weekly leadership review means weekly granularity may be more appropriate than daily noise. A dashboard checked on a mobile phone before a standup needs a simplified top-panel layout.
- **BI tool target:** Capture the tool even if it's "not yet decided." Tableau uses workbooks and calculated fields. Power BI uses DAX measures and row-level security roles. Looker uses LookML models and explores. Metabase uses saved questions and dashboards. These differences affect how you describe data sources, filter behavior, and drill-down paths in the spec.
- **Data readiness:** Ask whether the underlying data already exists in a queryable form (data warehouse, BI semantic layer, live database) or whether source data needs to be joined, transformed, or modeled first. If data is not ready, note it in the spec and flag it as a pre-requisite -- the dashboard specification assumes queryable data unless explicitly stated otherwise.

### Step 2: Define the Dashboard's Questions in Priority Order

Every panel on a dashboard answers a business question. If you cannot state the question, the panel does not belong. This step prevents dashboard sprawl and ensures layout reflects business logic.

- Start with the single most important strategic question for this audience: "Are we on track to hit the quarterly revenue target?" or "Is our system operating within acceptable parameters?" This question is answered by the top-row scorecards.
- Add 2-4 supporting questions that the viewer asks immediately after the top-level answer tells them something is off: "Which product line is behind?" "Which channel drove the shortfall?" These become the primary chart panels (row 2).
- Add 2-3 diagnostic questions that require more data to answer: "Which specific accounts or segments are underperforming?" "What changed this week vs. last week?" These go in the lower panels -- tables, small multiples, or waterfall charts.
- Sequence questions in a strict top-to-bottom, strategic-to-diagnostic flow. A viewer should be able to read the dashboard like a detective story: headline tells them if there's a problem, middle section tells them where the problem is, bottom section tells them why.
- Cap the total list at 8-10 questions maximum. If there are more than 10 questions, split into a primary dashboard and a linked drill-down or secondary dashboard. Over-paneled dashboards have a response rate near zero -- viewers stop checking them within 2 weeks.
- Validate each question against the decision list from Step 1. If a question doesn't map to a decision, cut it or move it to a secondary dashboard.

### Step 3: Design Each Panel Specification

Each panel is a discrete specification with 8 attributes. Do not leave any attribute undefined.

- **Panel title:** Use a noun phrase that describes what the panel shows, not a generic label. "Revenue vs. Target (QTD)" is correct. "Chart 1" or "Sales Data" is wrong. The title should be readable as a standalone answer: a viewer glancing at "Revenue vs. Target (QTD) -- 87% of Plan" should understand the situation without reading the chart.
- **Chart type:** Match the chart type to the data comparison being made. Single current value with target: scorecard/KPI card with trend indicator. Change over time: line chart (continuous time) or bar chart (discrete periods). Ranking across categories: horizontal bar chart (sorted descending). Part-to-whole with 3-6 categories: stacked bar or 100% bar (not pie). Geographic distribution: choropleth map. Relationship between two measures: scatter plot. Multi-measure across categories: grouped bar or bullet chart. Distribution: histogram or box plot. Never default to pie charts -- they fail with more than 5 categories and when slice differences are less than 5%.
- **Data source:** Name the specific table, view, or semantic layer object. "CRM.Opportunities," "dbt_prod.fct_orders," "GA4.events," "Salesforce Opportunity object with close date in current quarter." Vague references like "sales data" or "our CRM" are insufficient for implementation.
- **Dimensions and measures:** Be explicit. Dimension is the categorical or time field on the X-axis or legend. Measure is the aggregated numeric value. "Dimension: Week (ISO week), Measure: SUM(closed_won_amount)" is correct. Specify aggregation function -- SUM, AVG, COUNT DISTINCT, MEDIAN. Do not leave aggregation implicit.
- **Filter response:** Does this panel respond to global dashboard filters? Which ones? Does clicking a data point in this panel apply a cross-filter to other panels? Specify both directions: "Responds to: Date Range, Region. Drives cross-filter on: Panel 7, Panel 8."
- **Time grain:** Daily, weekly, monthly, or dynamic. Dynamic grain means the chart automatically aggregates to daily when the date range is under 30 days, weekly when 30-90 days, monthly when over 90 days. Dynamic grain is best for executive dashboards where the date range selector drives context. Fixed grain is better for operational dashboards where the viewer expects a consistent granularity.
- **Comparison:** What is the reference point? For revenue metrics: plan/target line, prior quarter, prior year same period. For operational metrics: SLA threshold line, rolling 30-day average. For ratios and rates: industry benchmark, internal target. Without a comparison, a number is just a number. A scorecard showing $2.4M revenue means nothing without knowing the target is $3.0M.
- **Null and zero handling:** Specify behavior explicitly. A line chart with gaps looks broken; instruct "connect nulls" or "show as zero." A table with no data for a filter combination should show "No data for selected filters" not an empty frame.

### Step 4: Design the Layout Grid

Dashboard layout is not aesthetic -- it is information architecture. The grid position of each panel determines what the viewer looks at first and how they interpret relationships between panels.

- Use a 12-column grid as the standard. This divides evenly into halves (6), thirds (4), and quarters (3). Most BI tools implement a 12-column grid natively (Tableau, Power BI, Looker). Some tools like Metabase use a 24-column grid -- halve all column counts for those tools.
- **Row 1 (above the fold):** 3-5 KPI scorecards, each 3-4 columns wide. These are the first things eyes hit. Every scorecard must show the current value, the comparison value, and a delta indicator (up/down arrow with color coding -- green for on track, red for off track, yellow for near threshold). Use conditional formatting on the delta, not the absolute value -- a revenue number of $1M looks the same whether you're ahead or behind target.
- **Row 2 (primary analysis zone):** 1-2 primary charts, typically a trend line (wide, 8-12 columns) and a ranking bar chart (4-6 columns). The trend line is almost always the most important chart on the dashboard because it shows trajectory, not just current state.
- **Row 3 (secondary analysis):** 2-3 panels that add context -- segmentation, comparison across entities (reps, channels, regions), or a detail table. These panels should function as the "investigation zone" -- where a viewer drills into the pattern surfaced by row 2.
- **Row 4 (optional detail):** Full-width table for record-level detail or a diagnostic chart. Consider whether this belongs on the primary dashboard or a linked detail page.
- **Sidebar (optional, right side):** Filter panel (date range, segment selectors, region picker). In Looker and Sigma, filters live natively in a filter bar above the dashboard. In Tableau and Power BI, filters can be designed as a dedicated filter panel column (typically 2-3 columns wide on the right).
- Never use free-form floating layouts. Fixed-grid layouts are easier to maintain, render consistently across screen sizes, and look professional in scheduled PDF exports.

### Step 5: Define Interactivity and Navigation

A static dashboard is a report. A BI dashboard earns its value through interactivity. Specify every interactive behavior explicitly.

- **Global filters:** List all filters with their default values, allowed values, and whether they are single-select or multi-select. Date range is always a global filter. Common additional filters: Region (multi-select, default: All), Product Line (multi-select, default: All), Business Unit (single-select, default: viewer's own). Filters that have no valid "All" state (e.g., selecting a single rep for a performance detail view) should have a required field indicator.
- **Cross-filter (brushing):** Clicking a bar, a data point, or a table row in one panel filters all connected panels. Define which panels are in the cross-filter network and which are excluded. Scorecard panels in row 1 typically should respond to cross-filters (so clicking a region bar updates the scorecard to show that region's KPIs). Target/plan reference lines should not respond to cross-filters -- they remain as context.
- **Drill-down paths:** Three types of drill-down exist in BI tools. First, hierarchical drill-down within the same chart (click on a quarter to expand to months, click a month to expand to weeks). Second, click-through navigation to a separate detail dashboard with the filter pre-applied. Third, click-to-expand to a modal or table view of underlying records. Specify which type applies to each panel.
- **Tooltips:** Specify what appears on hover. At minimum: the exact value, the dimension label, and the comparison value. For trend lines, include the period label (week ending date), current period value, prior period value, and delta. For scatter plots, include entity name, both axis values, and a third context field (e.g., segment or tier).
- **Parameter controls:** In Tableau and Power BI, parameters allow viewers to toggle the measure displayed in a chart (e.g., switch between Revenue and Margin on the same trend line). Specify whether any panels use parameter-driven measure selection.

### Step 6: Set Operational and Governance Parameters

A dashboard without defined operational parameters creates reliability, security, and trust problems after launch.

- **Refresh cadence:** Match the refresh schedule to the slowest data source feeding the dashboard and to the decision cadence of the audience. Real-time (streaming): operational dashboards monitoring live transactions, support ticket queues, or system health. Every 15-60 minutes: call center queues, same-day sales pacing, ad spend. Daily at 6am: most business performance dashboards -- data is ready overnight from warehouse ETL, users see fresh data when they start work. Weekly on Monday 6am: strategic dashboards reviewed in Monday leadership meetings. If different panels have different source refresh rates, the dashboard inherits the slowest rate unless the tool supports panel-level refresh (Metabase and Redash support this; Tableau and Looker typically do not at panel level).
- **Data latency disclosure:** Show the last-updated timestamp on the dashboard, typically in the footer or next to the date range filter. Users must know whether "today" means actual today at 8am or yesterday at 11pm. Missing this detail causes real trust damage -- a VP who checks the dashboard and sees a number that contradicts their CRM because the data is 18 hours stale will stop trusting the dashboard.
- **Access permissions:** Define three permission tiers. View only: can see the dashboard with their row-level security filter applied. Edit: can add/modify panels, change filters, save changes. Admin: can change data connections, permission assignments, and scheduled delivery settings. Row-level security (RLS): define the RLS rule explicitly -- for example, "Sales Reps see only rows where Rep_ID = current user ID; Managers see all rows within their Region; VP sees all rows."
- **Scheduled delivery:** Email PDF snapshots and Slack channel posts to the right people at the right time. Be specific: "Weekly PDF snapshot of current-quarter view emailed to sales-leadership@company.com every Monday at 7:00 AM" not "weekly email." In Looker, this is a "Schedule." In Power BI, it is a "Subscription." In Tableau, it is a "Subscription" or "Data-Driven Alert."
- **Alert thresholds:** Alerts fire when a metric crosses a threshold. Define three components for each alert: the metric, the condition (above/below a value or percentage change), and the notification channel (email, Slack, PagerDuty). Set alert thresholds at warning level (early enough to course-correct) not at crisis level (too late to act). Example: if the crisis threshold for pipeline coverage is 2.0x, set the warning alert at 2.5x so the team has time to respond before hitting crisis.

### Step 7: Define Mobile Layout and Accessibility

Most dashboards are first checked on a phone during a commute or before a meeting. A desktop-only design that ignores mobile produces a bad experience for a high-value use case.

- **Panel selection for mobile:** Scorecards (row 1) always appear on mobile. The primary trend chart appears on mobile at full width. Ranking bars appear on mobile if they can be rendered legibly. Detail tables, multi-dimensional charts, and scatter plots are desktop-only -- they render illegibly at phone screen widths.
- **Stacking order:** Mobile displays panels in a single vertical column. The stacking order should follow the same strategic-to-diagnostic sequence as the desktop layout. Specify the explicit vertical sequence: "1. Scorecards (2x2 grid), 2. Primary trend line, 3. Top-5 ranking bar, 4. CTA to open desktop for full detail."
- **Font and touch target sizing:** Specify minimum font size of 14pt for axis labels and 18pt for scorecard values on mobile. Touch targets (filter dropdowns, drill-down buttons) must be at least 44x44 pixels.
- **Accessibility:** Specify color blind-safe palettes. The most common issue is using red/green as the only indicator of status -- add text labels ("+$200K above target") or shape encoding (up/down triangles) to support users with red-green color blindness. Contrast ratios for text on chart backgrounds should meet WCAG AA standard (4.5:1 for normal text, 3:1 for large text).

---

## Output Format

Produce the following structured document. Use the exact section headers and table structure shown. Replace all bracketed fields with real content.

```
## Dashboard Specification: [Dashboard Name]
Version: 1.0 | Status: Draft | Last Updated: [Date]
Owner: [Name/Role] | Requesting Team: [Team]

---

### 1. Overview

| Field | Value |
|-------|-------|
| Business Function | [Sales / Marketing / Product / Operations / Finance / Executive] |
| Primary Audience | [Role and level of primary viewer] |
| Secondary Audience | [Role and level of secondary viewers] |
| Decisions Supported | [Explicit list of decisions this dashboard informs] |
| Viewing Frequency | [How often primary audience checks this dashboard] |
| Viewing Context | [Desktop in office / mobile before meeting / wall-mounted display] |
| Target BI Tool | [Tool name, or "Tool not yet selected"] |
| Data Readiness | [All sources available / Partial -- [source] not yet modeled / None] |

---

### 2. Dashboard Questions (Strategic to Diagnostic)

| Priority | Question | Type | Panel(s) That Answer It |
|----------|----------|------|------------------------|
| 1 | [Highest-level strategic question] | Strategic | Panel 1, 2 |
| 2 | [Supporting question] | Supporting | Panel 5 |
| 3 | [Supporting question] | Supporting | Panel 6 |
| 4 | [Diagnostic question] | Diagnostic | Panel 7 |
| 5 | [Diagnostic question] | Diagnostic | Panel 8 |

---

### 3. Panel Specifications

For each panel:

**Panel [N]: [Panel Title]**
- **Question answered:** [The specific question this panel addresses]
- **Chart type:** [Scorecard / Line / Bar / Horizontal bar / Stacked bar / Table / Map / Scatter / Bullet]
- **Primary dimension:** [Field name, grain] or None (for scorecards)
- **Secondary dimension:** [Field name] or None
- **Measure(s):** [Aggregation function + field name, e.g., SUM(closed_won_usd)]
- **Comparison / reference:** [Target line value/field / Prior period delta / YoY / SLA threshold]
- **Data source:** [Schema.table_name or semantic layer object name]
- **Filter response:** Responds to: [list of global filters]. Drives cross-filter on: [list of panels] or None
- **Drill-down behavior:** [None / Hierarchical within chart / Navigate to [dashboard name] / Expand to record table]
- **Tooltip content:** [Fields to display on hover]
- **Time grain:** [Daily / Weekly / Monthly / Dynamic]
- **Null handling:** [Connect nulls / Show as zero / Show gap / Display "No data" message]
- **Grid position:** Row [N], Col [start]-[end]
- **Mobile:** [Included / Excluded / Simplified -- top N only]
- **Conditional formatting:** [Rule: if delta < 0%, color delta red; if delta >= 0%, color delta green] or None

---

### 4. Panel Summary Table

| # | Panel Title | Chart Type | Grid Position | Data Source | Mobile |
|---|------------|------------|---------------|-------------|--------|
| 1 | [Title] | Scorecard | Row 1, Col 1-3 | [Source] | Included |
| 2 | [Title] | Scorecard | Row 1, Col 4-6 | [Source] | Included |
| 3 | [Title] | Scorecard | Row 1, Col 7-9 | [Source] | Included |
| 4 | [Title] | Scorecard | Row 1, Col 10-12 | [Source] | Included |
| 5 | [Title] | Line chart | Row 2, Col 1-8 | [Source] | Included |
| 6 | [Title] | Horizontal bar | Row 2, Col 9-12 | [Source] | Simplified |
| 7 | [Title] | Horizontal bar | Row 3, Col 1-6 | [Source] | Included |
| 8 | [Title] | Table | Row 3, Col 7-12 | [Source] | Excluded |

---

### 5. Layout Grid (ASCII)

```
+--------[P1: Scorecard]-------+--------[P2: Scorecard]-------+--------[P3: Scorecard]-------+--------[P4: Scorecard]-------+
|  Col 1-3                     |  Col 4-6                     |  Col 7-9                     |  Col 10-12                   |
+------------------------------+------------------------------+------------------------------+------------------------------+
|           [P5: Primary Trend Chart -- Line]                              |     [P6: Ranking Bar Chart]          |
|           Col 1-8                                                        |     Col 9-12                         |
+--------------------------------------------------------------------------+--------------------------------------+
|     [P7: Secondary Chart]              |     [P8: Detail Table or Diagnostic Chart]                           |
|     Col 1-6                            |     Col 7-12                                                        |
+----------------------------------------+--------------------------------------------------------------------+
```

---

### 6. Interactivity Specification

**Global Filters**

| Filter | Type | Default Value | Allowed Values | Required? |
|--------|------|---------------|----------------|-----------|
| Date Range | Date picker | Current quarter | Any date range | Yes |
| [Filter 2] | [Dropdown / Multi-select] | [Default] | [Values or "All values in field"] | [Yes/No] |
| [Filter 3] | [Dropdown / Multi-select] | [Default] | [Values or "All values in field"] | [Yes/No] |

**Cross-Filter Map**

| Source Panel (Click) | Target Panels Filtered | Field Applied |
|----------------------|------------------------|---------------|
| Panel [N] | Panel [N], Panel [N] | [Field name] |

**Drill-Down Paths**

| Panel | Click Target | Behavior | Destination |
|-------|-------------|----------|-------------|
| Panel [N] | [Data point / row / bar] | [Navigate / expand / hierarchical drill] | [Dashboard name or "expand to table"] |

---

### 7. Operational Parameters

| Parameter | Value |
|-----------|-------|
| Refresh Cadence | [Schedule: e.g., Daily at 6:00 AM UTC, weekdays only] |
| Refresh Type | [Full extract / Incremental / Live query] |
| Data Latency | [Expected lag from source event to dashboard visibility] |
| Last-Updated Timestamp | [Display location on dashboard: footer / near date filter] |
| Owner | [Name and role responsible for dashboard maintenance] |

**Access Permissions**

| Role | Permission Level | Row-Level Security Rule |
|------|-----------------|------------------------|
| [Role 1] | View | [Filter condition, e.g., Region = user attribute "region"] |
| [Role 2] | View + Filter | [All rows] |
| [Role 3] | Edit | [All rows] |
| [Role 4 -- Admin] | Admin | [All rows] |

**Scheduled Deliveries**

| Delivery | Schedule | Recipients | Format | Filters Applied |
|----------|----------|------------|--------|-----------------|
| [Weekly summary] | [Monday 7:00 AM] | [email@company.com] | PDF | [Current quarter, All regions] |

**Alert Thresholds**

| Metric | Warning Condition | Crisis Condition | Channel | Recipients |
|--------|-------------------|------------------|---------|------------|
| [Metric 1] | [e.g., < 80% of target] | [e.g., < 65% of target] | Slack / Email | [#channel or email] |
| [Metric 2] | [e.g., > 120-minute SLA breach rate 5%] | [e.g., > 10%] | PagerDuty | [On-call rotation] |

---

### 8. Mobile Layout

| Element | Desktop Position | Mobile Position | Mobile Treatment |
|---------|-----------------|-----------------|------------------|
| Scorecards (P1-P4) | Row 1, 4 cols each | Top, 2x2 grid | Full inclusion |
| [Primary chart] | Row 2, 8 cols | Below scorecards, full width | Simplified -- remove secondary axis |
| [Ranking chart] | Row 2, 4 cols | Below primary chart, full width | Top 5 only |
| [Detail table] | Row 3, 12 cols | Hidden | Desktop only |

---

### 9. Implementation Notes and Pre-Requisites

- **Data dependencies:** [List any tables, views, or models that must exist before build begins]
- **Semantic layer requirements:** [Any calculated fields, metrics, or joins that must be defined in the BI tool's semantic layer]
- **Performance considerations:** [Any panels that may be slow to render and require aggregated pre-computation or materialized views]
- **Known limitations:** [Any data gaps, metric approximations, or known issues in the source data]
- **Future enhancements (post-launch):** [Features deferred from v1.0 and their rationale]
```

---

## Rules

1. **Never exceed 10 panels on a single dashboard page.** Beyond 10 panels, cognitive load exceeds the viewer's ability to form a coherent mental model. Research on working memory capacity (7 ± 2 chunks) supports this limit. If more coverage is needed, create a linked detail dashboard or additional tab, and add a navigation button in the spec.

2. **Every panel must be traceable to a named decision.** If a panel cannot be linked to one of the decisions in the Overview section, it should not exist on the dashboard. "Nice to have" and "interesting data" panels dilute the dashboard's usefulness and create maintenance burden.

3. **Scorecards must always display a comparison value and delta, never just the current value.** A revenue figure of $4.2M without context is meaningless. The comparison can be vs. target, vs. prior period, vs. prior year, or vs. SLA -- but there must be one. Use delta sign (+/-), delta percentage, and color-coded indicator simultaneously for maximum clarity.

4. **Refresh cadence must match the decision cadence, not the data availability cadence.** Just because data is available in real-time does not mean the dashboard should refresh in real-time. Real-time refresh on a weekly decision dashboard creates noise and false urgency. Match refresh to the tempo of action the audience can realistically take.

5. **Row-level security rules must be specified before implementation begins, not retrofitted.** RLS rules affect the data model, not just the dashboard configuration. A sales rep who accidentally sees another rep's pipeline because RLS was not implemented from the start is a trust-destroying incident. Specify RLS at spec time even if the implementation detail is "consult the data engineering team."

6. **Do not use pie charts or donut charts in business dashboards.** Humans cannot accurately compare arc lengths or areas across pie slices when the difference is less than 5-10%. Use a horizontal bar chart (sorted descending) instead -- it provides identical information with superior readability and supports more categories. The only exception is a 2-category proportion (e.g., "Won vs. Lost") where a single-bar progress indicator or gauge is clearer.

7. **Alert thresholds must be set at warning level, not crisis level.** If the crisis threshold for a metric is X, the alert should fire at 1.2-1.5X (for "do not exceed" metrics) or 0.7-0.8X (for "must achieve" metrics). An alert that fires only when crisis has been reached gives no time to course-correct. Document the rationale for each threshold value -- "fires at 80% of target because that gives the team 2 weeks to recover in a 12-week quarter."

8. **Specify null and zero handling for every panel.** In most BI tools, null and zero are treated differently by default. A line chart with null values creates a gap in the line, which viewers often misread as a data outage. A scorecard with a null denominator produces a divide-by-zero error. Specify the expected behavior explicitly for every panel: connect nulls, show as zero, display "N/A," or show a "no data" message.

9. **The last-updated timestamp must be visible on every dashboard.** Data without provenance cannot be trusted. Place a timestamp in the dashboard footer or immediately adjacent to the date range filter showing when the data was last refreshed. In Tableau, this is a "Last Refreshed" calculated field. In Power BI, use the "Last refresh date" measure from the dataset properties. In Looker, display the query timestamp with a text tile.

10. **A dashboard specification without named data sources is incomplete.** "Sales data" or "CRM" is not an acceptable data source definition. Every panel must reference a specific table, view, or semantic layer object (e.g., `prod.fct_opportunities`, `Salesforce standard object: Opportunity`). If the data source is not yet determined, write "TBD -- requires data modeling" and flag the panel as blocked in the Implementation Notes section. Do not proceed to implementation without resolving TBD data sources.

---

## Edge Cases

### Audience Conflict: Dashboard Serves Multiple Levels Simultaneously

When a dashboard is used by both executives (need 1-glance, no tables, max 6 panels) and managers or analysts (need detail, drill-down, segment cuts), a single dashboard design fails both audiences. Handle this by designing separate dashboard pages or a primary/detail architecture. The primary dashboard follows executive design constraints: 4-6 scorecards, 1 trend line, 1 ranking bar, no tables, no raw data. The detail dashboard is linked from the primary via click-through drill-down and contains the segment breakdowns, tables, and diagnostic charts the manager needs. Specify the link explicitly: "Clicking any scorecard in row 1 navigates to Sales Detail Dashboard with the selected metric pre-filtered." Do not add a "collapsed" row of advanced panels at the bottom of the executive dashboard -- executives will not scroll, and the complexity undermines the clean design.

### Real-Time Operational Dashboard (Monitoring / Incident Response)

When the use case is live operations monitoring (call center queue depth, fulfillment pipeline throughput, system uptime, same-day revenue pacing), the dashboard design rules change significantly. Replace trend line charts with status indicators (green/yellow/red traffic lights) keyed to SLA thresholds. Add an incident log panel showing the 10 most recent threshold breaches with timestamp, metric, and value. Set refresh to every 5-15 minutes or use a live-query connection where the BI tool supports it (Looker live connections, Tableau Live, Power BI DirectQuery). Design for a wall-mounted or large-format display with minimum 24pt font for all labels, high contrast (white on dark background), and no filters -- the display is ambient, not interactive. Specify that no login is required for the display screen (use an embedded public view or a service account).

### Dashboard Feeding Multiple Downstream Tools

Some dashboards are the source of record for other systems -- the numbers displayed become inputs to financial forecasting models, commission calculations, or board reports. For these dashboards, add a data certification section to the spec. Specify: which panels are "certified" as the authoritative source for downstream use, who certifies them (data owner role), the certification refresh frequency (monthly sign-off by Finance, for example), and the version control approach (dashboard screenshots archived with date in a shared drive or wiki). In Tableau and Power BI, certified datasets carry a visual badge -- include this in the spec. In Looker, use the "Verified" content label.

### Migrating from a Spreadsheet or Legacy Report

When the user is replacing an existing manual report or Excel-based dashboard, the spec must account for the transition period. Document the legacy report's metrics and layout alongside the new spec so stakeholders can verify continuity. Flag any metrics where the definition or calculation will change in the new dashboard (e.g., "Legacy report uses recognized revenue; new dashboard uses booked revenue -- flag this discrepancy clearly to stakeholders before launch"). Include a parallel-run period in the implementation notes: "Run both the legacy report and new dashboard simultaneously for 4 weeks; compare outputs weekly to validate alignment before deprecating the legacy report." Note which stakeholders are signed off on the definitional changes.

### Self-Service Analytics Dashboard (Analyst Audience)

When the primary audience is analysts or data-savvy users who will build their own views from the dashboard, the spec changes substantially. Include a dimension and measure picker (supported natively in Looker, achievable via parameters in Tableau, available as "Explore" mode in Sigma and ThoughtSpot). Add full-width sortable and searchable data tables as primary panels, not supplemental ones. Include export functionality (CSV, Excel) specified per panel. Reduce scorecard row to 2-3 panels maximum -- analysts distrust pre-summarized figures and prefer to derive their own. Include a "last SQL run" or "data definition" tooltip on each panel so analysts can validate the underlying logic. Specify that global filters should be multi-select with "select all" and "deselect all" controls.

### No BI Tool Selected Yet

When the user does not yet have a BI tool, produce the spec as a tool-agnostic document using the standard output format above. At the end of the spec, add a "BI Tool Recommendation" section with a comparison matrix: evaluate Tableau (strong for complex visualizations, row-level security, and enterprise governance; high cost), Power BI (best Microsoft ecosystem integration, strong DAX language, mid-cost), Looker (strongest semantic layer and LookML governance model; requires data engineering investment), Metabase (fastest time-to-value, open source option available, limited enterprise governance), and Sigma (best for analyst-first self-service on Snowflake; newer tool). Map the requirements captured in the spec to the tool comparison criteria. Also produce a simplified version of the spec as a Google Sheets layout with manual data entry, conditional formatting rules (highlight cells below target in red), and sparkline formulas for trend indicators -- treat this as the "Phase 0" interim solution while the BI tool decision is made.

### Dashboard for a Business Function Without Standard KPI Patterns

When the dashboard is for a non-standard function (legal operations, people operations, procurement, or a new business model), the standard KPI scaffolding does not apply. Do not invent KPIs -- instead, run the question-based design process from Step 2 with extra rigor. Ask the user: "What would tell you immediately that something is wrong this week?" and "What would tell you immediately that something is going well?" These two questions reliably surface the 2-3 most important leading indicators for any business function. From those, build the scorecard row. Then ask: "What context do you need to understand why the answer is what it is?" to surface the supporting chart panels. Note any KPIs where the formula, data source, or target is undefined and flag them as "pending KPI definition -- use `kpi-definition` skill before proceeding."

### Multi-Department or Company-Wide Dashboard (Tab/Page Architecture)

When the dashboard spans multiple departments (e.g., a company-wide performance dashboard seen by all VPs), use a tabbed or paged architecture. Design one landing page (the "executive summary tab") that shows the 4-6 most critical cross-department KPIs with a health status indicator per department. Each subsequent tab is a department-specific dashboard designed to the standards in this spec, with department-specific KPIs and drill-downs. Global filters (date range, company region, fiscal year) propagate across all tabs. Department-specific filters (product line for product tab, channel for marketing tab) apply only to their respective tab. Specify the tab order based on revenue or strategic priority of each department, not alphabetically.

---

## Example

**Input:** "We need a dashboard spec for our e-commerce marketing team. They use Looker. The Marketing Director checks it every morning and the channel managers check it daily to optimize spend. We track paid search, paid social, email, and organic. Key metrics are ROAS, CAC, revenue, and conversion rate."

**Output:**

---

## Dashboard Specification: E-Commerce Marketing Performance Dashboard
Version: 1.0 | Status: Draft | Last Updated: [Current Date]
Owner: Marketing Director | Requesting Team: E-Commerce Marketing

---

### 1. Overview

| Field | Value |
|-------|-------|
| Business Function | Marketing -- E-Commerce |
| Primary Audience | Marketing Director (daily, morning check-in, strategic decision-making) |
| Secondary Audience | Channel Managers -- Paid Search, Paid Social, Email, SEO (daily, spend optimization) |
| Decisions Supported | 1. Reallocate budget across channels based on ROAS and CAC performance. 2. Escalate underperforming channels for tactical review. 3. Determine whether marketing is on track to hit monthly revenue contribution target. 4. Identify which audience segments or creatives are driving conversion. |
| Viewing Frequency | Director: every morning (7-8 AM). Channel Managers: multiple times daily during active campaigns. |
| Viewing Context | Desktop browser primary. Mobile for Director's morning check before standup. |
| Target BI Tool | Looker (Google BigQuery backend) |
| Data Readiness | Paid search (Google Ads via Fivetran to BigQuery -- available). Paid social (Meta Ads via Fivetran -- available). Email (Klaviyo via Fivetran -- available). Organic (GA4 events in BigQuery -- available). Revenue attribution model (last-click -- available in `prod.fct_attributed_orders`). |

---

### 2. Dashboard Questions (Strategic to Diagnostic)

| Priority | Question | Type | Panel(s) That Answer It |
|----------|----------|------|------------------------|
| 1 | Is total marketing-attributed revenue on pace to hit the monthly target? | Strategic | P1 (scorecard), P5 (trend line) |
| 2 | What is our blended ROAS and blended CAC across all paid channels today vs. target? | Strategic | P2, P3 (scorecards) |
| 3 | Which channels are delivering the best and worst ROAS this week? | Supporting | P6 (horizontal bar -- ROAS by channel) |
| 4 | Where is conversion rate breaking down -- channel, device, or audience? | Supporting | P7 (grouped bar -- CVR by channel and device) |
| 5 | Which campaigns or ad groups have the highest spend but lowest ROAS right now? | Diagnostic | P8 (table -- campaign-level spend, ROAS, delta vs. 7-day avg) |
| 6 | How is email performing vs. paid in terms of revenue contribution and CVR? | Diagnostic | P6 (channel ROAS bar includes email), P8 (table filtered to email) |

---

### 3. Panel Specifications

**Panel 1: Marketing Revenue vs. Monthly Target**
- **Question answered:** Is total marketing-attributed revenue on pace to hit the monthly target?
- **Chart type:** Scorecard / KPI card
- **Primary dimension:** None
- **Secondary dimension:** None
- **Measure(s):** SUM(attributed_revenue) for current calendar month to date (MTD) from `prod.fct_attributed_orders`
- **Comparison / reference:** vs. monthly_revenue_target from `prod.dim_targets` (current month row); display as % of target and delta in dollars
- **Data source:** `prod.fct_attributed_orders` joined to `prod.dim_targets`
- **Filter response:** Responds to: Date Range (overrides MTD default when changed), Channel. Drives cross-filter on: None
- **Drill-down behavior:** Click navigates to Marketing Revenue Detail dashboard with current month pre-selected
- **Tooltip content:** MTD Revenue, Monthly Target, % Attained, Revenue Gap to Target, Days Remaining in Month
- **Time grain:** MTD (default); responds to date range filter
- **Null handling:** If monthly target is null for current month, display "Target not set -- contact Marketing Ops" in red
- **Grid position:** Row 1, Col 1-3
- **Mobile:** Included
- **Conditional formatting:** Delta color: green if >= 90% of target; yellow if 75-89%; red if < 75%

**Panel 2: Blended ROAS (Paid Channels)**
- **Question answered:** Is our overall paid media investment generating acceptable return?
- **Chart type:** Scorecard / KPI card
- **Primary dimension:** None
- **Measure(s):** SUM(paid_attributed_revenue) / SUM(paid_spend) for current month, from `prod.fct_channel_performance` where channel_type = 'paid'
- **Comparison / reference:** vs. ROAS target of 3.5x (hardcoded from channel strategy doc; update quarterly); display delta vs. 3.5x target and vs. prior month ROAS
- **Data source:** `prod.fct_channel_performance`
- **Filter response:** Responds to: Date Range, Channel (if "Organic" or "Email" selected, note these are excluded from ROAS calculation with an info tooltip)
- **Drill-down behavior:** Click navigates to Paid Channel Detail dashboard
- **Tooltip content:** Blended ROAS, ROAS Target, Delta vs. Target, Total Paid Spend MTD, Total Paid Revenue MTD
- **Time grain:** MTD default
- **Null handling:** If paid spend is zero, display "0 -- no paid spend recorded" (prevents divide-by-zero error)
- **Grid position:** Row 1, Col 4-6
- **Mobile:** Included
- **Conditional formatting:** Green if ROAS >= 3.5; yellow if 2.5-3.49; red if < 2.5

**Panel 3: Blended CAC (Paid Channels)**
- **Question answered:** How much are we paying to acquire each new customer through paid channels?
- **Chart type:** Scorecard / KPI card
- **Primary dimension:** None
- **Measure(s):** SUM(paid_spend) / COUNT DISTINCT(new_customer_id) for current month from `prod.fct_channel_performance` where channel_type = 'paid' and customer_type = 'new'
- **Comparison / reference:** vs. CAC target of $45 (from `prod.dim_targets`); display as delta in dollars and % over/under target
- **Data source:** `prod.fct_channel_performance` joined to `prod.fct_attributed_orders` (for new customer identification)
- **Filter response:** Responds to: Date Range, Channel
- **Drill-down behavior:** Click navigates to CAC Breakdown detail view
- **Tooltip content:** Blended CAC, CAC Target, Delta, New Customers Acquired MTD, Total Paid Spend MTD
- **Time grain:** MTD default
- **Null handling:** If new customer count is zero, display "$0 CAC -- no new customers attributed this period (check attribution model)"
- **Grid position:** Row 1, Col 7-9
- **Mobile:** Included
- **Conditional formatting:** Green if CAC <= $45; yellow if $45.01-$60; red if > $60

**Panel 4: Blended Conversion Rate**
- **Question answered:** Is site-wide conversion rate holding at the expected level?
- **Chart type:** Scorecard / KPI card
- **Primary dimension:** None
- **Measure(s):** COUNT DISTINCT(order_id) / COUNT DISTINCT(session_id) * 100 for current month from `prod.fct_sessions` joined to `prod.fct_attributed_orders`
- **Comparison / reference:** vs. 2.8% target (from `prod.dim_targets`); display delta in percentage points and vs. prior month CVR
- **Data source:** `prod.fct_sessions` joined to `prod.fct_attributed_orders`
- **Filter response:** Responds to: Date Range, Channel, Device Type (if device filter added)
- **Drill-down behavior:** Click navigates to Conversion Funnel detail dashboard
- **Tooltip content:** Current CVR, CVR Target, Delta vs. Target, Sessions MTD, Orders MTD
- **Time grain:** MTD default
- **Null handling:** Display "Insufficient data" if sessions count < 100 (to prevent misleading CVR from low-traffic periods)
- **Grid position:** Row 1, Col 10-12
- **Mobile:** Included
- **Conditional formatting:** Green if CVR >= 2.8%; yellow if 2.0-2.79%; red if < 2.0%

**Panel 5: Daily Marketing Revenue vs. Pace**
- **Question answered:** Are we tracking ahead of or behind the expected cumulative revenue pace for this month?
- **Chart type:** Line chart (dual series)
- **Primary dimension:** Date (daily grain, current month)
- **Secondary dimension:** None
- **Measure(s):** Series 1: Cumulative SUM(attributed_revenue) by day. Series 2: Cumulative target pace line (monthly target / days in month * day number -- calculated field)
- **Comparison / reference:** Pace line (linear distribution of monthly target); Prior month cumulative actuals as a third reference series (dashed line)
- **Data source:** `prod.fct_attributed_orders` for actuals; `prod.dim_targets` for pace calculation
- **Filter response:** Responds to: Date Range (defaults to current month; show last 30 days if date range extended), Channel
- **Drill-down behavior:** Clicking a specific day's data point opens a tooltip with that day's top 3 revenue-driving campaigns (no navigation)
- **Tooltip content:** Date, Cumulative Revenue, Pace Target, Delta vs. Pace, Prior Month Cumulative on Same Day-of-Month
- **Time grain:** Daily
- **Null handling:** If today's data is not yet available (refresh at 6am UTC), label the last data point "as of [last refresh timestamp]" -- do not project forward with nulls
- **Grid position:** Row 2, Col 1-8
- **Mobile:** Included (simplified -- remove prior month series; keep actuals and pace only)
- **Conditional formatting:** Actual line: blue. Pace line: gray dashed. Prior month: light gray dashed. When actual line is below pace by > 10%, shade the gap area in light red.

**Panel 6: ROAS by Channel (This Month vs. Target)**
- **Question answered:** Which channels are over- and under-performing their ROAS targets?
- **Chart type:** Horizontal bar chart (sorted descending by ROAS)
- **Primary dimension:** Channel Name (Paid Search, Paid Social -- Facebook, Paid Social -- TikTok, Email, Organic)
- **Secondary dimension:** None
- **Measure(s):** ROAS = SUM(attributed_revenue) / SUM(spend) per channel; for email and organic, display revenue contribution only (no spend in denominator -- use a visual note "N/A -- no cost")
- **Comparison / reference:** Reference line at ROAS target of 3.5x. Color bars by performance band: green >= 3.5, yellow 2.5-3.49, red < 2.5. For email and organic, show revenue as a separate visual group.
- **Data source:** `prod.fct_channel_performance` grouped by channel_name, current month
- **Filter response:** Responds to: Date Range. Drives cross-filter on: Panel 8 (Campaign Table) when a channel bar is clicked
- **Drill-down behavior:** Clicking a channel bar cross-filters Panel 8 to show only that channel's campaigns
- **Tooltip content:** Channel Name, ROAS, ROAS Target, Delta vs. Target, Revenue MTD, Spend MTD
- **Time grain:** MTD (default); responds to date range filter
- **Null handling:** If a channel has spend but no attributed revenue, show ROAS as 0.0x with a red bar
- **Grid position:** Row 2, Col 9-12
- **Mobile:** Simplified -- top 4 channels only (by spend volume), horizontal bars

**Panel 7: Conversion Rate by Channel and Device**
- **Question answered:** Is the conversion problem a channel issue, a device issue, or both?
- **Chart type:** Grouped bar chart (channel on X-axis, grouped by device type: Desktop, Mobile, Tablet)
- **Primary dimension:** Channel Name
- **Secondary dimension (grouping):** Device Type (Desktop, Mobile, Tablet)
- **Measure(s):** CVR = COUNT DISTINCT(order_id) / COUNT
