---
name: ops-metrics-dashboard
description: |
  Produces an operations KPI document with metric definitions, data
  sources, targets, reporting cadence, and dashboard layout using ops
  analytics methodology. Use when the user asks to create an operations
  dashboard, define operational KPIs, build a metrics framework for
  operations, design a reporting dashboard for operational performance,
  or establish metrics and targets for an operations team.
  Do NOT use for marketing analytics reports (use marketing-analytics-report),
  financial KPI dashboards (use financial-kpis), or product metrics
  frameworks (use metrics-framework).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis planning report template"
  category: "business-strategy"
  subcategory: "operations"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Ops Metrics Dashboard

## When to Use

Use this skill when the user's request falls into one of these specific scenarios:

- The user needs to build a structured KPI framework for an operations function -- fulfillment, customer support, field service, manufacturing, logistics, IT operations, facilities, or service delivery
- The user has a collection of informal metrics or ad hoc reports and wants to consolidate them into a coherent dashboard with hierarchy, targets, and owners
- The user is launching a new operations team or process and needs to define what "good" looks like before work begins
- The user's operations leadership has asked for better visibility and the team is deciding which metrics matter, how they roll up, and how frequently they report
- The user reports that their current metrics are disconnected -- teams are measuring different things, targets are inconsistent, or data exists but no one acts on it
- The user needs to rationalize an overgrown metrics environment where the team tracks 40+ numbers but cannot explain which ones actually drive decisions
- The user is preparing an operational review for a board, investor, or executive audience and needs the right metrics with the right framing
- The user is implementing a new system (WMS, CRM, ITSM, ERP, field service management) and wants to define the metrics the new system will power

**Do NOT use this skill when:**

- The user needs marketing funnel metrics, channel attribution, or campaign performance -- use `marketing-analytics-report` instead
- The user needs P&L analysis, unit economics, gross margin by segment, or financial forecasting -- use `financial-kpis` instead
- The user needs product engagement metrics, feature adoption rates, DAU/MAU, retention cohorts, or activation funnels -- use `metrics-framework` instead
- The user needs a single-metric deep dive (e.g., "how do I calculate NPS correctly?") -- use a metric-definition skill, not a full dashboard build
- The user needs data engineering or BI tooling architecture (e.g., how to build the data pipeline in dbt or how to configure a Tableau data source) -- that is a technical infrastructure task, not a metrics design task
- The user needs a project management status dashboard (milestone tracking, task completion, resource allocation) -- that is a project reporting task, not operational KPI management

---

## Process

### Step 1: Establish Operational Context Before Writing a Single Metric

Never begin defining metrics without understanding the operational environment. Mismatched metrics are worse than no metrics -- they create false signals and waste management attention.

- Identify the **operations function type** precisely: inbound logistics, outbound fulfillment, manufacturing/production, customer support (tier 1/2/3), field service, IT operations, facilities management, or blended service delivery. Each function has different canonical metrics and different failure modes.
- Determine the **business model connection**: Is operations a cost center being managed to efficiency (cost per unit, utilization rates), a revenue enabler being managed to capacity and uptime, or a customer experience function being managed to satisfaction and effort? This distinction drives which metrics sit at the top of the hierarchy.
- Clarify **team structure**: How many people, how many layers, how many distinct process steps do they own vs. hand off? A 5-person team needs 3-5 metrics. A 150-person team needs a tiered structure with sub-team dashboards feeding a master view.
- Identify **existing data infrastructure**: What systems are running? (Salesforce Service Cloud, Zendesk, Jira Service Management, ServiceNow, SAP, Oracle WMS, NetSuite, Shopify, a custom database, or spreadsheets.) Which systems have APIs or BI connectors? Which require manual extraction? A metric with no automated data source is a liability.
- Surface **the burning problem**: What specific performance issue prompted this dashboard request? First response time creeping up? Shipment errors increasing? Technician utilization falling? The burning problem should appear as a red-status metric in the initial dashboard -- this creates immediate credibility with the team.
- Identify the **primary audiences**: Operational team members need different views than directors and VPs, who need different views than C-suite or board members. Each audience layer should have a named view in the dashboard design.
- Confirm **reporting cadence constraints**: Some teams do 15-minute daily standups; others have weekly operational reviews and nothing in between. The cadence determines how many metrics are practical to review and how much annotation is needed on each report.

### Step 2: Build the Metric Hierarchy Using the Four-Layer Framework

Operations dashboards fail when metrics are listed flatly with no structure. The four-layer hierarchy prevents this and creates clear accountability at every level.

- **Layer 1 -- North Star Metric (1 metric only):** The single number that, if it moved permanently in the right direction, would mean operations is doing its job. For fulfillment: on-time-in-full (OTIF) rate. For customer support: Customer Effort Score (CES) or CSAT. For IT operations: mean time to restore (MTTR). For manufacturing: overall equipment effectiveness (OEE). For field service: first-time fix rate. This metric is reviewed at every leadership meeting and every quarterly strategic review.
- **Layer 2 -- Primary KPIs (3-5 metrics):** The leading and lagging indicators that directly drive the north star. These are the metrics leadership sees at a glance. If the north star is OTIF, primary KPIs include order fulfillment cycle time, pick accuracy rate, carrier on-time delivery rate, and inventory availability rate. Keep strictly to 5 maximum -- research consistently shows that more than 5 metrics in a leadership view reduces the probability of action on any single one.
- **Layer 3 -- Supporting Metrics (6-12 metrics):** Process-level metrics the operations team monitors daily or weekly. They explain why the primary KPIs are where they are. Grouped by process area (receiving, picking, packing, shipping; or triage, resolution, escalation). These belong to team leads, not senior leadership.
- **Layer 4 -- Diagnostic Metrics (4-8 metrics per KPI):** Drill-down metrics used only when a primary KPI or supporting metric turns yellow or red. These are not reviewed regularly -- they are pulled on demand. Examples: for a queue backlog spike in support, diagnostics include tickets per agent per hour by time-of-day, ticket type distribution shift, and average handle time by category. Diagnostic metrics save investigation time and prevent guessing.
- Build a **metric dependency map** as a reference document: draw arrows from Layer 4 → Layer 3 → Layer 2 → Layer 1. If a Layer 3 metric has no pathway to the north star, cut it. If a Layer 2 KPI has no Layer 4 diagnostics, add them before launch.

### Step 3: Write Precise Metric Specifications

Vague metric definitions are the single most common cause of dashboard failure. "Response time" means different things to different people -- does the clock start at ticket creation or customer send time? Does it pause during off-hours? These ambiguities produce unresolvable data disputes.

- **Name:** Use consistent naming conventions. Prefer "Rate" for percentages (Resolution Rate, not % Resolved). Prefer "Time" for durations (First Response Time, not Time to First Response). Avoid acronyms in names unless they are universal in the industry (MTTR, OEE, CSAT are acceptable).
- **Definition:** Write a one-to-two sentence plain-English description of exactly what is being measured. Specify inclusions and exclusions explicitly. Example: "First Response Time measures the elapsed time between ticket creation timestamp and the timestamp of the first agent reply, excluding automated acknowledgment messages and bot responses, calculated in business hours only (8:00 AM -- 6:00 PM in the customer's local timezone)."
- **Formula:** Write the exact calculation in pseudo-code or SQL-like notation. Example: `MEDIAN(first_agent_reply_at - ticket_created_at) WHERE ticket_channel IN ('email', 'web_form') AND reply_type = 'agent' AND is_business_hours = TRUE`. Using median rather than mean prevents outliers (one 72-hour ticket) from distorting the metric.
- **Data source:** Name the specific system, table or object, and field. Example: "Zendesk -- tickets table -- created_at field and first_agent_reply_at field." If the data source does not yet exist, flag it with "(FUTURE -- currently manual)" and describe the manual calculation method.
- **Calculation frequency:** Real-time (streaming dashboard), hourly refresh, daily batch, or weekly manual pull. Match frequency to the cadence at which the metric needs to inform decisions. Real-time is not always better -- it can create panic over statistical noise.
- **Target:** State the target value AND the rationale. Targets derived from three sources in priority order: (1) industry benchmarks for the specific function (Zendesk benchmarks email first response at under 24 hours; high-performing teams target under 2 hours), (2) historical best performance ("we hit 94% OTIF in Q2 -- that is our baseline"), (3) strategic requirement ("our SLA guarantees 99.5% uptime, so our internal target is 99.7% to maintain buffer"). Never accept a target with no rationale.
- **Thresholds:** Use percentage deviation from target for consistency. Green: within 5% of target or better. Yellow: 5-15% below target. Red: more than 15% below target. Adjust for metrics with very tight tolerances (99.5% SLA -- even 1% deviation is red). Some metrics are directional (lower is always better) rather than target-based -- handle these with absolute range thresholds instead.
- **Owner:** One named role only. The owner is responsible for the metric being accurate, being reviewed on cadence, and triggering escalations when the metric is red. Shared ownership is the same as no ownership.
- **Action trigger:** Describe specifically what happens when the metric hits red -- not "investigate" but "the queue manager pulls the hourly ticket volume breakdown and posts a Slack update in #support-ops within 2 hours."

### Step 4: Apply Industry-Specific Benchmarks to Set Credible Targets

Every operations function has published benchmarks. Using them -- or explicitly arguing against them -- produces far more credible targets than internal guessing.

**Customer Support benchmarks (industry medians, adjust for tier and channel):**
- Email first response time: 12 hours median across industries; high-performing: under 2 hours; SaaS B2B standard: under 4 hours
- Chat first response time: Under 1 minute high-performing; under 2 minutes acceptable
- First contact resolution (FCR): 70-75% industry median; 85%+ high-performing
- CSAT: 85% industry baseline; 90%+ high-performing SaaS support
- Agent utilization: 75-85% optimal (above 85% causes burnout and quality degradation; below 70% is overstaffed)
- Ticket deflection via self-service: 20-40% for mature knowledge bases

**Fulfillment / Warehouse benchmarks:**
- Order fulfillment cycle time (order placed to ship): Same-day to 2 days for e-commerce; 1-3 days for B2B distribution
- Pick accuracy: 99.5%+ high-performing WMS operations; 98-99% acceptable; under 97% is systemic problem
- On-time-in-full (OTIF): Retail/CPG: 95%+ required (Walmart mandates 98.5% or financial penalties apply); B2B distribution: 92-95% acceptable
- Inventory accuracy (cycle count): 98%+ high-performing; under 95% requires full physical inventory
- Receiving cycle time: Same day put-away for fast-moving SKUs; 24-48 hours acceptable for large volumes

**IT Operations / SRE benchmarks:**
- System availability/uptime: 99.9% (three nines) = 8.7 hours downtime/year; 99.95% = 4.4 hours; 99.99% (four nines) = 52 minutes -- choose based on business criticality
- Mean time to acknowledge (MTTA): Under 5 minutes for P1 incidents; under 15 minutes for P2
- Mean time to restore (MTTR): Under 1 hour for P1; under 4 hours for P2
- Change failure rate: Under 15% for standard change management; under 5% high-performing DevOps
- Deployment frequency: Context-dependent (weekly releases to multiple per day depending on maturity)

**Field Service benchmarks:**
- First-time fix rate: 75% industry median; 85%+ high-performing; under 70% indicates parts availability or technician training problem
- SLA compliance: 90%+ for standard SLAs; 95%+ for premium contracts
- Technician utilization: 65-75% (lower than support because travel time is non-productive but unavoidable)
- Mean time on-site: Benchmark against historical average by job type; flag deviations of 30%+ for investigation

### Step 5: Design Dashboard Views by Audience

A single dashboard that serves everyone serves no one. Design three named views with specific content and layout for each.

**Executive View (North Star + Primary KPIs):**
- Maximum 6 data points visible without scrolling
- Each KPI shown as: current value, target, variance (absolute and %), trend direction (arrow), and RAG status (red/amber/green)
- Rolling trend chart for north star metric (trailing 13 weeks or 12 months to show seasonality)
- No tables, no row-by-row data -- visual summaries only
- Single sentence annotation for any red KPI explaining the current situation and next action

**Operations Team View (Primary KPIs + Supporting Metrics):**
- Full metric table grouped by process area
- Current value vs. target vs. prior period (week-over-week and month-over-month)
- Owner column visible -- team members see their own metrics highlighted
- Action items column: open improvement actions linked to yellow/red metrics
- Updated at the cadence matching the team review rhythm (daily refresh for daily standup metrics)

**Diagnostic View (Supporting + Diagnostic Metrics):**
- Accessed only when a KPI turns yellow or red
- Shows the drill-down metrics associated with the failing KPI
- Includes time-series breakdown (when did the metric start moving?), segmentation (which channel, location, team, or product category is driving it?), and correlation view (what else moved at the same time?)
- Not a standard report -- a structured investigation template the team pulls up during triage

**BI Tool Layout Guidance:**
- In Tableau, use a parameter-based audience selector to show/hide view layers from a single workbook
- In Power BI, use bookmarks to switch between executive, team, and diagnostic views
- In Looker, create separate Looks for each view, grouped into a Dashboard
- In Google Looker Studio (formerly Data Studio), use separate pages per view with consistent filters
- For teams still on spreadsheets: use separate tabs with named ranges and conditional formatting for RAG status; protect the executive tab from editing

### Step 6: Define the Reporting Rhythm and Review Protocol

A dashboard with no review rhythm decays within 60 days. The review rhythm is as important as the metrics themselves.

- **Daily standup metrics (2-3 maximum, reviewed in under 5 minutes):** These should be the highest-velocity metrics -- the ones that can change meaningfully overnight or in a single shift. Queue depth, current SLA breach count, system availability status, production output vs. daily target. Format: traffic light board only -- green means no discussion; yellow or red means 2-minute verbal summary and blocker escalation.
- **Weekly team review (full primary + supporting layer, 30-45 minutes):** Review every KPI against target. For any metric in yellow or red: root cause stated in one sentence, action item logged with owner and due date. Generate an action item log that persists week-over-week. This is not a status meeting -- it is a problem-solving meeting triggered by metric deviations.
- **Monthly leadership report (trend analysis, 60 minutes):** Trend charts for all primary KPIs over the trailing 12 weeks. Closed action items and outcomes. Open improvement initiatives and progress. Capacity forecast based on volume trends. Recommendation for any target adjustments with rationale. Written narrative (one page maximum) accompanies the dashboard view.
- **Quarterly strategic review (north star trend + investment recommendations, 90 minutes):** North star trend over 4 quarters. Benchmarking comparison (current performance vs. published industry benchmarks for the specific function). Headcount adequacy analysis (current utilization vs. target, volume forecast for next quarter, hiring or automation recommendation). Process improvement roadmap: which improvements in the prior quarter delivered results, what is planned for the next quarter.
- **Escalation protocol outside of cadence:** Define what breaks the rhythm. If a P1 incident occurs (system down, major SLA breach, safety event), the escalation protocol fires immediately regardless of the review schedule. Escalation thresholds: any metric that hits red AND has not recovered within the defined window (e.g., MTTR exceeds 4 hours, or OTIF drops below 88% for two consecutive days) triggers an ad hoc executive notification.

### Step 7: Build the Improvement Tracking Loop

Metrics without an improvement loop are surveillance, not management. Every red metric must enter an improvement tracking process.

- **Triage within 24 hours of red status:** The metric owner runs a structured root cause analysis using the five-why method or the diagnostic metrics layer. Output is a one-paragraph problem statement: what metric went red, by how much, since when, and the suspected root cause.
- **Action item with SMART criteria:** The response action must be Specific (exactly what will be done), Measurable (how will we know it worked), Assigned (one owner), Realistic (achievable given current resources), and Time-bound (due date, not "as soon as possible"). Log in the improvement tracking table.
- **Follow-up measurement window:** Set a specific date at which the metric will be re-evaluated to confirm improvement. If CSAT drops to 82% and the action is to update the knowledge base, the measurement date is 3 weeks post-launch (enough time for updated articles to affect ticket resolution).
- **Target review protocol:** Distinguish between two failure modes: (a) the process broke -- the target was right and something changed; (b) the target was wrong -- it was set without enough historical data or the business context changed. If a metric is red for more than 6 consecutive weeks despite genuine effort, convene a target review. Do not simply make targets easier -- document the change and the rationale.
- **Metric retirement process:** Remove metrics that have been green for 12+ consecutive months without a single exception if they are Layer 3 or Layer 4 metrics. Stable metrics that never deviate do not require management attention. Replace them with metrics that are actually at risk or in improvement phases.

---

## Output Format

```
## Operations Metrics Dashboard: [Team / Department Name]

**Operations Area:** [What the team manages -- be specific: "B2C e-commerce fulfillment, 2 DCs, 50K orders/week" not just "fulfillment"]
**Dashboard Owner:** [Role title, not personal name]
**Reporting Cadence:** [Daily standup / Weekly review / Monthly leadership report / Quarterly strategic review]
**Primary Audience:** [Ops team / Ops manager / Director of Operations / VP / Executive team]
**Data Sources:** [List all systems providing data: Zendesk, Salesforce, NetSuite, WMS, manual, etc.]
**Dashboard Version:** [1.0]
**Last Updated:** [Date]
**Next Target Review:** [Date -- set 6 months from creation]

---

### North Star Metric

**[Metric Name -- e.g., On-Time-In-Full (OTIF) Rate]**

| Attribute | Value |
|-----------|-------|
| **Definition** | [One to two sentences, include all inclusions/exclusions explicitly] |
| **Formula** | [Pseudocode: e.g., COUNT(orders_delivered_on_time_and_complete) / COUNT(total_orders) x 100] |
| **Data Source** | [System name -- object/table -- field names] |
| **Calculation Frequency** | [e.g., Daily batch at 6:00 AM, rolling 7-day average displayed] |
| **Current Value** | [Value with units] |
| **Target** | [Value -- rationale in parentheses: e.g., 97% (industry benchmark for mid-market 3PL)] |
| **Trend** | [Improving / Stable / Declining -- specify over what period: e.g., Declining over trailing 6 weeks] |
| **Green** | [Range] |
| **Yellow** | [Range] |
| **Red** | [Range] |
| **Owner** | [Role] |

---

### Primary KPIs -- Leadership View

*Maximum 5 KPIs. Each reviewed at weekly team meeting and monthly leadership report.*

| KPI | Definition (short) | Formula | Target | Current | vs. Target | WoW Trend | MoM Trend | Status |
|-----|--------------------|---------|--------|---------|-----------|-----------|-----------|--------|
| [KPI 1 name] | [10-15 words] | [Formula shorthand] | [Value + units] | [Value] | [+X% / -X%] | [↑ / → / ↓] | [↑ / → / ↓] | 🟢 / 🟡 / 🔴 |
| [KPI 2 name] | [Short definition] | [Formula] | [Target] | [Current] | [vs.] | [Trend] | [Trend] | [Status] |
| [KPI 3 name] | [Short definition] | [Formula] | [Target] | [Current] | [vs.] | [Trend] | [Trend] | [Status] |
| [KPI 4 name] | [Short definition] | [Formula] | [Target] | [Current] | [vs.] | [Trend] | [Trend] | [Status] |
| [KPI 5 name] | [Short definition] | [Formula] | [Target] | [Current] | [vs.] | [Trend] | [Trend] | [Status] |

**KPI Annotations (for any yellow or red KPI):**
- [KPI name] 🔴 -- [One sentence: what happened, since when, next action, owner]
- [KPI name] 🟡 -- [One sentence: what is at risk, what is being watched]

---

### Supporting Metrics -- Operations Team View

*Grouped by process area. Reviewed at weekly team meeting.*

**Process Area 1: [Name -- e.g., Order Intake & Triage]**

| Metric | Definition | Formula | Data Source | Target | Current | vs. Target | Frequency | Owner | Status |
|--------|-----------|---------|------------|--------|---------|-----------|-----------|-------|--------|
| [Metric name] | [Definition] | [Formula] | [System] | [Target] | [Current] | [Variance] | [Daily/Weekly] | [Role] | 🟢/🟡/🔴 |
| [Metric name] | [Definition] | [Formula] | [System] | [Target] | [Current] | [Variance] | [Frequency] | [Role] | [Status] |
| [Metric name] | [Definition] | [Formula] | [System] | [Target] | [Current] | [Variance] | [Frequency] | [Role] | [Status] |

**Process Area 2: [Name -- e.g., Resolution & Fulfillment]**

| Metric | Definition | Formula | Data Source | Target | Current | vs. Target | Frequency | Owner | Status |
|--------|-----------|---------|------------|--------|---------|-----------|-----------|-------|--------|
| [Metric name] | [Definition] | [Formula] | [System] | [Target] | [Current] | [Variance] | [Frequency] | [Role] | [Status] |
| [Metric name] | [Definition] | [Formula] | [System] | [Target] | [Current] | [Variance] | [Frequency] | [Role] | [Status] |

**Process Area 3: [Name -- e.g., Quality & Compliance]**

| Metric | Definition | Formula | Data Source | Target | Current | vs. Target | Frequency | Owner | Status |
|--------|-----------|---------|------------|--------|---------|-----------|-----------|-------|--------|
| [Metric name] | [Definition] | [Formula] | [System] | [Target] | [Current] | [Variance] | [Frequency] | [Role] | [Status] |
| [Metric name] | [Definition] | [Formula] | [System] | [Target] | [Current] | [Variance] | [Frequency] | [Role] | [Status] |

---

### Full Metric Specifications

*Complete specification card for each primary KPI and each supporting metric.*

---

**[Metric Name]**

| Attribute | Value |
|-----------|-------|
| **Layer** | [Primary KPI / Supporting Metric / Diagnostic] |
| **Definition** | [Full precise definition with all inclusions and exclusions] |
| **Formula** | [Exact pseudocode calculation] |
| **Unit** | [%, minutes, count, $, ratio] |
| **Direction** | [Higher is better / Lower is better / Target range] |
| **Data Source** | [System -- object/table -- specific fields] |
| **Calculation Frequency** | [Real-time / Hourly / Daily / Weekly] |
| **Calculation Window** | [Point-in-time / Rolling 7 days / Rolling 30 days / Calendar month] |
| **Target** | [Value -- rationale] |
| **Green** | [Range] |
| **Yellow** | [Range] |
| **Red** | [Range] |
| **Owner** | [Role] |
| **Action Trigger (Yellow)** | [Specific monitoring action within X hours] |
| **Action Trigger (Red)** | [Specific escalation action within X hours, who is notified] |
| **Feeds Into (Layer above)** | [Which primary KPI or north star this supports] |
| **Known Caveats** | [Seasonal effects, data lag, exclusion logic that might confuse readers] |

[Repeat specification card for each metric]

---

### Threshold Reference Table

*All thresholds in one place for quick reference.*

| Metric | Layer | Direction | Green | Yellow | Red | Action When Red |
|--------|-------|-----------|-------|--------|-----|----------------|
| [Metric 1] | [Primary KPI] | [Lower better] | [Range] | [Range] | [Range] | [Specific action + owner + timeframe] |
| [Metric 2] | [Supporting] | [Higher better] | [Range] | [Range] | [Range] | [Action] |
| [Metric 3] | [Supporting] | [Target range] | [Range] | [Range] | [Range] | [Action] |

---

### Diagnostic Drill-Down Guide

*Use when a Primary KPI or Supporting Metric turns yellow or red. Do not review diagnostics in standard cadence.*

---

**When [Primary KPI 1] goes Yellow or Red -- investigate these diagnostics:**

| Diagnostic Metric | Formula / Source | What It Reveals | Green | Red | Investigation Question |
|-------------------|-----------------|-----------------|-------|-----|----------------------|
| [Diagnostic 1] | [Source] | [What deviation means] | [Range] | [Range] | [e.g., Is the issue concentrated in one channel?] |
| [Diagnostic 2] | [Source] | [What it reveals] | [Range] | [Range] | [Question to answer] |
| [Diagnostic 3] | [Source] | [What it reveals] | [Range] | [Range] | [Question to answer] |
| [Diagnostic 4] | [Source] | [What it reveals] | [Range] | [Range] | [Question to answer] |

**Triage decision tree for [Primary KPI 1]:**
1. Check [Diagnostic 1] first. If red → [next step / escalation path A]
2. If [Diagnostic 1] is green, check [Diagnostic 2]. If red → [escalation path B]
3. If both green, check [Diagnostic 3] for [specific systemic issue]

---

**When [Primary KPI 2] goes Yellow or Red -- investigate these diagnostics:**

| Diagnostic Metric | Formula / Source | What It Reveals | Green | Red | Investigation Question |
|-------------------|-----------------|-----------------|-------|-----|----------------------|
| [Diagnostic 1] | [Source] | [What it reveals] | [Range] | [Range] | [Question] |
| [Diagnostic 2] | [Source] | [What it reveals] | [Range] | [Range] | [Question] |
| [Diagnostic 3] | [Source] | [What it reveals] | [Range] | [Range] | [Question] |

---

### Reporting Cadence and Review Protocol

| Cadence | Metrics Reviewed | Meeting Name | Day / Time | Duration | Attendees | Format | Owner of Meeting |
|---------|-----------------|--------------|-----------|----------|-----------|--------|-----------------|
| Daily | [List 2-3 high-velocity metrics] | Daily Ops Standup | [e.g., Mon-Fri 9:00 AM] | 10 min | All agents + team lead | Traffic light board only -- verbal summary for reds | Team Lead |
| Weekly | All Primary KPIs + Supporting Metrics | Weekly Ops Review | [e.g., Monday 10:00 AM] | 45 min | Ops team + manager | Full dashboard review, action items for reds and yellows | Ops Manager |
| Monthly | Trend analysis + Primary KPIs + Action item review | Monthly Ops Leadership Report | [e.g., First Tuesday] | 60 min | Manager + Director + cross-functional stakeholders | Written narrative + trend charts + improvement plan | Director of Ops |
| Quarterly | North star trends + benchmarking + capacity planning | Quarterly Strategic Review | [e.g., First week of quarter] | 90 min | VP + Ops leadership + Finance | Benchmark comparison, investment recommendations, roadmap | VP of Operations |

**Escalation Protocol (outside standard cadence):**
- [Define the red-line condition: e.g., "Any Primary KPI in red status for more than 48 consecutive hours"]
- Trigger: [Who is notified, within what timeframe, via what channel]
- Immediate response: [What meeting is convened, what data is pulled]

---

### Improvement Tracking Log

*Log every red metric triage and resulting action. Review open items at each weekly meeting.*

| Date Opened | Metric | Threshold Breached | Duration Red | Root Cause (5-Why Summary) | Action Taken | Owner | Due Date | Measurement Date | Result | Status |
|------------|--------|-------------------|--------------|---------------------------|-------------|-------|----------|-----------------|--------|--------|
| [Date] | [Metric] | [e.g., 78% vs. 85% target] | [e.g., 2 weeks] | [One sentence root cause] | [Specific SMART action] | [Role] | [Date] | [Date to re-measure] | [Quantified outcome] | Open / Resolved / Watching |

---

### Target Review Log

*Document every target adjustment to maintain accountability and institutional memory.*

| Date | Metric | Old Target | New Target | Reason for Change | Evidence | Approved By |
|------|--------|-----------|-----------|------------------|----------|------------|
| [Date] | [Metric] | [Old] | [New] | [Process change / benchmark update / strategic shift / original target was wrong] | [Data or rationale] | [Role] |
```

---

## Rules

1. **Never produce a metrics dashboard without a named North Star Metric.** Flat lists of KPIs without hierarchy create the illusion of measurement without the ability to prioritize. The North Star forces a team to answer "what does winning look like?" before counting anything.

2. **Every metric must have a precise formula in pseudocode or SQL-like notation, not a plain English description alone.** "Customer satisfaction score" is not a formula. `AVG(survey_response) WHERE survey_type = 'post_resolution' AND response_date >= CURRENT_DATE - 30 DAYS` is a formula. Ambiguous definitions produce unresolvable data disputes during reviews.

3. **Targets must include explicit rationale drawn from one of three sources: industry benchmark, historical best performance, or contractual/strategic requirement.** A target without rationale will be challenged immediately in any leadership review and will be reset arbitrarily whenever someone is uncomfortable with a red status.

4. **Never assign more than 5 Primary KPIs to a leadership view.** Beyond 5, the probability of any single metric receiving genuine attention and action in a leadership meeting drops sharply. If a user insists on more, escalate the additional metrics to Supporting level and explain the hierarchy clearly.

5. **Every metric must have exactly one named owner by role.** Never write "shared between Team Lead and Manager" or "Operations team." Shared ownership is unowned. The owner is the person who explains the metric in a review meeting and who is accountable for triggering the escalation when it goes red.

6. **Thresholds must be specified as ranges with explicit boundary logic, not directional adjectives.** "Too low" is not a threshold. "Below 88%" is a threshold. "Between 88-92%" is the yellow range. "92% and above" is green. Every metric must have all three zones defined before the dashboard is used.

7. **Diagnostic metrics must not appear in the standard reporting cadence.** They exist only for triage. Including diagnostic metrics in the weekly review creates noise -- the team spends 80% of review time on metrics that are fine and 20% on the ones that need action, which is the opposite of what is needed.

8. **Never define a metric whose data source does not exist unless the metric is explicitly marked "(FUTURE -- currently manual)" with a documented manual calculation method.** A metric on a dashboard with no live data source will show blank or stale, undermining trust in the entire dashboard. If a metric matters enough to track, define how it will be tracked manually in the interim.

9. **Include at least one lagging indicator and at least one leading indicator per operational process area.** Lagging indicators (CSAT, OTIF, error rate) tell you what happened. Leading indicators (queue depth, ticket inflow rate, production schedule adherence) tell you what is about to happen. A dashboard with only lagging indicators cannot be used proactively -- the team is always reacting.

10. **Distinguish clearly between metrics that are tracking metrics (volume, count, no target) and performance metrics (rate, %, time -- have a target and thresholds).** Volume metrics like total tickets received or total orders processed belong on the dashboard as context but should not have RAG thresholds applied -- they inform staffing and capacity decisions, not performance judgment. Applying green/red status to a volume metric that naturally fluctuates produces false alarms.

11. **The improvement tracking log is a mandatory component, not optional.** A dashboard that shows red metrics but has no connected improvement actions is theater. Stakeholders who see the same red metric for three months with no log of actions taken lose trust in operations management, not just in the metric.

12. **Do not define targets for a brand-new process in the first 90 days.** For processes with fewer than 8 weeks of data, set targets as "TBD -- establishing baseline" and track the metric in observation mode. Setting a target before you understand the natural variation of a process produces arbitrary targets that demoralize the team when they are missed and create complacency when they are easily exceeded.

---

## Edge Cases

### Startup or Early-Stage Team with No Data Infrastructure

When the team runs on spreadsheets, has no BI tools, and has never formally tracked metrics before, begin with the minimum viable dashboard rather than the full framework.

- Start with exactly 3 primary KPIs that can be calculated manually in under 15 minutes per week. Prioritize the metric that directly represents the burning problem the user described.
- Build the dashboard in Google Sheets with one tab per audience layer. Use conditional formatting for RAG status. Protect the executive summary tab from editing. This is functional and free.
- For each metric, define both the manual calculation method (current state) and the target automated data source (future state). This future-state definition becomes the requirements document when the team eventually implements a BI tool or new system.
- Review the 3 KPIs weekly for 30 days before adding Layer 3 supporting metrics. The 30-day period establishes whether targets were set correctly and whether the team actually uses the dashboard in reviews.
- Do not build 12 metrics in spreadsheets. Manual data entry fatigue causes abandonment within 6 weeks. Three metrics tracked consistently beat twelve metrics tracked sporadically.

### Multi-Location or Distributed Operations

When operations span multiple facilities, regions, or time zones, the dashboard must support comparison across locations without creating unfair performance judgments.

- Every Primary KPI must have a location-level breakdown available on demand. The executive view shows the aggregate; the diagnostic view shows by-location performance. Do not hide location-level data -- regional variation is the most common root cause of aggregate metric problems.
- Normalize size-dependent metrics before comparing locations. Total ticket volume at a site with 3 agents vs. a site with 12 agents is not comparable. Tickets per agent per day is comparable. OTIF rate at a warehouse processing 1,000 orders/day vs. one processing 10,000 orders/day is comparable because rates normalize volume.
- Flag statistical outliers using control chart logic, not simple target comparison. A location 2 standard deviations below the network average on a key metric deserves investigation regardless of whether it crossed an absolute threshold. Single-threshold systems miss relative underperformers.
- Add a cross-location comparison table to the monthly leadership report. Show each location's Primary KPI results ranked. Include trend arrows. This creates healthy internal accountability without requiring a separate dashboard per location.
- For time zone distribution, define whether daily metrics reset at midnight local time or midnight UTC. Document this decision in the metric specification card. Inconsistency in reset logic produces phantom day-over-day swings that undermine trust in real-time metrics.

### Seasonal Business (Retail, Hospitality, Tax Services, Agriculture)

When volume varies 3x-5x or more between peak and off-peak periods, static annual targets produce predictable failures -- metrics go red during peak for structural reasons and are meaningless during off-peak because they are trivially easy to hit.

- Use seasonally-adjusted targets: set separate targets for each defined season (e.g., Holiday Peak Nov-Dec, Back-to-School Aug-Sep, Off-Peak Jan-Jul). Base seasonal targets on prior-year performance at that same volume level, not on annual averages.
- Always display year-over-year (YoY) comparison alongside week-over-week and month-over-month. During peak season, a metric that is 3% below target but 8% better than last year's peak is improving -- the static target comparison alone would show red.
- Add a volume normalization metric to the daily standup during peak: orders per agent per hour, tickets per agent per day, or units picked per labor hour. This tells leaders whether performance degradation during peak is proportional to the volume increase (acceptable -- scaling is hard) or disproportionate (systemic problem requiring intervention).
- Pre-define the peak season ramp-up expectations: what metric values are acceptable at 50% of peak volume, 75%, 100%, and surge? These graduated expectations prevent the team from being judged by the same target on day 1 of peak ramp as on day 30 of sustained peak.
- After two full years of data, build a seasonal index for each KPI: the ratio of the metric's value in a given week to the annual average. Use the index to generate expected ranges rather than fixed targets. This requires at least 24 months of data to be reliable.

### Transitioning from Ad Hoc Reporting to First Formal Dashboard

When a team currently generates reports in an inconsistent, reactive way (someone pulls a number when the boss asks, different people calculate the same thing differently, no defined targets exist), the transition must be managed carefully to avoid creating resistance.

- Run a metric audit first: collect every report, spreadsheet, and Slack message that references a number about operations performance. Catalog what exists. You will typically find 15-30 informal metrics. Map each one to the four-layer hierarchy. Most will be Supporting or Diagnostic -- do not promote them all to Primary KPIs.
- Identify the 1-2 metrics that leadership already references in conversation, even informally. These are the de facto north star and primary KPIs. Formalize them first -- the team already cares about them, so adoption resistance is lower.
- Resolve definition conflicts before launching the dashboard. If the sales team calculates "on-time delivery" as shipped-by-promise-date and the operations team calculates it as delivered-by-promise-date, the dashboard will show two different numbers. Force the definitional conversation before the dashboard goes live, or the first use of the dashboard will be a data credibility argument, not a performance conversation.
- Launch with "observation mode" for 4 weeks: calculate metrics and show them, but do not apply RAG thresholds yet. This gives the team time to validate that the numbers are correct and to build intuition for what the baseline looks like. Setting targets before you know the baseline produces arbitrary targets.
- In week 5, run a target-setting workshop: show the 4-week baseline, show industry benchmarks for the specific function, and negotiate targets collaboratively. Targets that the team sets themselves are far more motivating than targets handed down by leadership.

### Operations Supporting Multiple Products or Business Units

When one operations team serves multiple products, brands, or business units with different SLAs, volumes, and customer segments, a single flat dashboard obscures performance disparities.

- Build one unified master dashboard with a product/BU filter parameter. The north star metric aggregates across all products. Supporting metrics are segmented by product. This structure allows both "how is operations doing overall?" and "how is Product A performing vs. Product B?" to be answered from the same tool.
- If products have materially different SLAs (e.g., Enterprise customers with 2-hour SLA vs. SMB customers with 24-hour SLA), maintain separate threshold tables per segment. Do not average SLA performance across segments -- a 90% aggregate SLA compliance might be 99% for SMB and 70% for Enterprise, which is a critical and hidden failure.
- Create a "segment mix" awareness metric: the percentage of volume that is high-complexity or high-SLA work in a given week. If the mix shifts toward Enterprise (harder, higher SLA) but staffing does not change, performance metrics will naturally degrade. The mix metric explains why without requiring a separate investigation.
- For cross-functional shared services (one ops team supporting Sales, Customer Success, and Product teams), define an internal SLA per stakeholder function and track compliance separately. This prevents the loudest internal customer from always getting prioritized at the expense of others.

### Metrics Go Persistently Red Despite Genuine Improvement Efforts

When a primary KPI has been red for 8+ consecutive weeks, a documented root cause has been identified, and corrective actions have been implemented -- but the metric is still red -- the situation requires a structured target review process, not just more of the same effort.

- First, verify the diagnosis. Run a full diagnostic layer review. In persistent red situations, the initial root cause is often a symptom of a deeper structural issue. A 10-week investigation of first response time that blamed agent workload might reveal the actual root cause is that 35% of tickets are misdirected by the IVR and require manual reassignment before any work begins.
- Second, check whether the target itself is wrong. Pull the last 24 months of data. Plot a control chart. If the metric has never come within 15% of the target even during the best period, the target was not calibrated to reality when it was set. Document this explicitly.
- Third, distinguish between "the target needs to be recalibrated" and "the process needs capital investment to achieve the target." If the ops team is doing everything within their control correctly but hitting the target requires a system upgrade, additional headcount, or a process redesign outside their authority, the metric should be flagged as "investment required" and escalated with a specific business case, not left as a persistent red on the ops team's dashboard with no path forward.
- Move the metric to a dedicated "Improvement Initiative" tracking view separate from the standard dashboard. This prevents stakeholder fatigue with the red status while keeping the improvement work visible and accountable.

---

## Example

**Input:** "Create an operations metrics dashboard for our e-commerce fulfillment team. We run a single warehouse processing about 3,000 orders per day. Team of 45 people: 30 pickers/packers, 8 in receiving, 5 in shipping coordination, and a 2-person QA team. Main problems: our error rate on orders has been increasing (we think it's around 2.5% right now), and we've been missing our promised same-day ship cutoffs more often. We ship from our own WMS (SkuVault), pull orders from Shopify, and use ShipStation for carrier management. We want weekly reporting for the ops team and monthly for leadership."

**Output:**

---

## Operations Metrics Dashboard: E-Commerce Fulfillment

**Operations Area:** Single-site e-commerce fulfillment warehouse -- 3,000 orders/day -- pick, pack, ship, and receiving operations
**Dashboard Owner:** Director of Fulfillment Operations
**Reporting Cadence:** Daily standup (key velocity metrics) / Weekly team review / Monthly leadership report / Quarterly strategic review
**Primary Audience (by view):** Executive View (VP/COO), Ops Team View (team leads + manager), Diagnostic View (quality and process improvement)
**Data Sources:** SkuVault (WMS -- inventory, pick, receive), Shopify (order management -- order creation, promised dates), ShipStation (carrier management -- ship times, carrier scans), Google Sheets (manual QA log for error tracking until WMS error module is configured)
**Dashboard Version:** 1.0
**Last Updated:** [Current date]
**Next Target Review:** [Current date + 6 months]

---

### North Star Metric

**On-Time-In-Full (OTIF) Rate**

| Attribute | Value |
|-----------|-------|
| **Definition** | Percentage of customer orders shipped on time (by the daily same-day cutoff for same-day-ship orders, or by the promised ship date for standard orders) AND shipped complete (all ordered SKUs included, no substitutions). An order that ships on time but is missing one item is NOT counted as OTIF. An order that is complete but misses the cutoff is NOT counted as OTIF. |
| **Formula** | `COUNT(orders WHERE shipped_at <= promised_ship_cutoff AND all_line_items_fulfilled = TRUE) / COUNT(total_orders_with_promised_ship_date) x 100` |
| **Data Source** | ShipStation (shipped_at timestamp) + SkuVault (line item fulfillment status) joined on order_id; Shopify (promised_ship_date, same_day_ship flag) |
| **Calculation Frequency** | Daily batch at 11:59 PM -- reflects full day's performance. Rolling 7-day average displayed for trend. |
| **Current Value** | 91.4% (estimated based on reported 2.5% error rate + known cutoff misses) |
| **Target** | 97.0% (industry standard for mid-market direct-to-consumer e-commerce; Walmart supplier mandate is 98.5% -- our B2C target of 97% reflects current team size and infrastructure) |
| **Trend** | Declining -- estimated 94% three months ago based on team's reported increase in errors and cutoff misses |
| **Green** | 97.0% and above |
| **Yellow** | 93.0% -- 96.9% |
| **Red** | Below 93.0% |
| **Owner** | Director of Fulfillment Operations |

---

### Primary KPIs -- Leadership View

| KPI | Definition (short) | Formula | Target | Current | vs. Target | WoW Trend | MoM Trend | Status |
|-----|--------------------|---------|--------|---------|-----------|-----------|-----------|--------|
| Order Error Rate | % of shipped orders with a fulfillment error (wrong item, missing item, wrong quantity, wrong address) | (Orders with confirmed error / Total orders shipped) x 100 | Under 0.5% | 2.5% | -2.0 pts | ↓ Worsening | ↓ Worsening | 🔴 |
| Same-Day Ship Cutoff Compliance | % of same-day-ship orders actually shipped by the daily carrier pickup cutoff | (Same-day-ship orders shipped by cutoff / Total same-day-ship orders) x 100 | 98%+ | ~93% | -5 pts | ↓ Worsening | ↓ Worsening | 🔴 |
| Pick Accuracy Rate | % of order lines picked correctly on first attempt (no QA correction needed) | (Lines picked correctly / Total lines picked) x 100 | 99.5%+ | ~97.5% | -2 pts | → Stable | ↓ Declining | 🔴 |
| Receiving Cycle Time | Median time from carrier delivery to put-away completion for inbound shipments | MEDIAN(put_away_completed_at -- carrier_delivered_at) in hours | Under 24 hours | Baseline TBD | TBD | Establishing baseline | Establishing baseline | ⚪ Baseline |
| Labor Productivity -- Pick/Pack | Orders processed per labor hour (pickers + packers combined) | Total orders shipped / Total pick-pack labor hours worked | 18 orders/labor hour (baseline target -- refine after 4 weeks) | Baseline TBD | TBD | Establishing baseline | Establishing baseline | ⚪ Baseline |

**KPI Annotations:**
- Order Error Rate 🔴 -- Rate has risen to approximately 2.5% vs. 0.5% target; investigation required immediately using diagnostic drill-down; team lead to pull error type breakdown from QA log within 24 hours.
- Same-Day Ship Cutoff Compliance 🔴 --
