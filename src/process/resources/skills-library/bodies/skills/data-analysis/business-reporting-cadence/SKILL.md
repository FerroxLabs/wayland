---
name: business-reporting-cadence
description: |
  Designs a business reporting cadence with weekly, monthly, and quarterly report structures including audience, content, format, and distribution list for each. Produces report templates with section headings and chart placeholders.
  Use when the user asks to set up a reporting schedule, design recurring business reports, standardize report formats across teams, or define who gets what report and when.
  Do NOT use for dashboard design (use bi-dashboard-spec), individual KPI definition (use kpi-definition), or data storytelling for a one-time presentation (use data-storytelling).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "report template planning"
  category: "data-analysis"
  subcategory: "business-intelligence"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Business Reporting Cadence

## When to Use

**Use this skill when:**
- User asks to set up recurring business reports (weekly, monthly, quarterly)
- User wants to standardize report formats across teams or business units
- User asks who should receive which reports and how often
- User wants to design a reporting schedule that aligns with decision cycles
- User is building a reporting program from scratch or overhauling an inconsistent one

**Do NOT use when:**
- User wants a live dashboard specification (use `bi-dashboard-spec`)
- User wants to define KPIs with formulas (use `kpi-definition`)
- User wants to write a one-time data narrative or presentation (use `data-storytelling`)
- User wants to design a forecast model (use `forecast-model`)

## Process

1. **Identify the reporting scope.** Ask the user:
   - What business function or team needs reporting? (entire company, specific department, specific project)
   - What existing reports exist today? (identify overlap and gaps)
   - What decisions are currently made without data that should have data support?
   - What is the reporting maturity level? (no reports, ad-hoc reports, some recurring, fully structured)

2. **Map the decision cadence.** Reports serve decisions. Align report frequency to decision frequency:
   - **Daily:** Operational triage decisions (support queue, production incidents, sales activity)
   - **Weekly:** Tactical adjustments (campaign tweaks, resource reallocation, sprint priorities)
   - **Monthly:** Performance assessment (target tracking, budget review, hiring pipeline)
   - **Quarterly:** Strategic evaluation (goal progress, market positioning, resource planning for next quarter)
   - **Annual:** Strategic direction (annual planning, board reporting, organizational design)

3. **Design each report type.** For every frequency tier, define:
   - **Report name:** Descriptive, standardized (e.g., "Weekly Sales Activity Report" not "Friday Update")
   - **Owner:** Who is responsible for preparing and delivering the report
   - **Audience:** Who receives it and what they need from it
   - **Content sections:** The specific sections included (with the question each answers)
   - **Data sources:** Where the numbers come from
   - **Delivery method:** Email, Slack, dashboard link, presentation, printed
   - **Delivery schedule:** Exact day and time
   - **Preparation time:** How long it takes to compile (informs whether automation is needed)

4. **Create report templates.** For each report, produce:
   - Section headings in order
   - Chart/table placeholders showing what visualization goes where
   - Narrative prompts (what the author should write in each section)
   - Standard formatting rules (fonts, colors, header hierarchy)

5. **Define the escalation protocol.** When a report reveals a problem:
   - What thresholds trigger escalation? (KPI below target, trend reversal, anomaly)
   - Who is escalated to?
   - What format does the escalation take? (ad-hoc alert, emergency meeting, email to leadership)
   - What is the expected response time?

6. **Set the maintenance schedule.** Reports decay if not maintained:
   - Quarterly review: Are all reports still being read and acting on? Remove zombie reports.
   - Annual review: Do the report structures still match the business strategy? Restructure if objectives have changed.
   - Feedback loop: After each quarterly review cycle, survey report recipients: "Did you act on this report in the last 90 days?"

## Output Format

```
## Business Reporting Cadence: [Team/Company Name]

### Reporting Calendar

| Frequency | Report Name | Owner | Audience | Delivery | Day/Time |
|-----------|------------|-------|----------|----------|----------|
| Weekly | [Name] | [Person] | [Audience] | [Method] | [Day, Time] |
| Monthly | [Name] | [Person] | [Audience] | [Method] | [Day of month, Time] |
| Quarterly | [Name] | [Person] | [Audience] | [Method] | [Week of quarter, Time] |

---

### Weekly Report: [Report Name]

**Owner:** [Person/Role]
**Audience:** [Recipients and what they need]
**Delivery:** [Method] by [Day] at [Time]
**Preparation time:** [Estimated hours]
**Data sources:** [List of sources]

#### Template

**Section 1: Executive Summary (3-5 bullets)**
- [Key metric 1] this week: [value] vs. target [value] -- [up/down/flat]
- [Key metric 2] this week: [value] vs. last week [value]
- Top highlight: [Narrative placeholder]
- Top concern: [Narrative placeholder]

**Section 2: KPI Scorecards**
[Table: KPI Name | This Week | Last Week | Target | Status (G/Y/R)]

**Section 3: [Specific Analysis Area]**
[Chart placeholder: Type, dimensions, measures]

**Section 4: Action Items**
- [Action item format: Owner, Due Date, Status]

---

### Monthly Report: [Report Name]

[Same template structure as weekly but with monthly-specific sections]

---

### Quarterly Report: [Report Name]

[Same template structure with quarterly-specific sections]

---

### Escalation Protocol
| Trigger | Threshold | Escalation To | Format | Response Time |
|---------|-----------|---------------|--------|---------------|
| [Trigger] | [Threshold] | [Person/Role] | [Format] | [Time] |

### Maintenance Schedule
- **Quarterly audit:** [Date] -- review report usage and relevance
- **Annual restructure:** [Date] -- align reports to updated strategy
- **Feedback survey:** [Frequency] -- assess report utility
```

## Rules

1. NEVER create a report without a named owner -- unowned reports stop being produced within 60 days
2. Every report section must answer a specific question -- sections that exist "for completeness" waste the reader's time
3. Delivery schedules must allow preparation time -- a Monday morning report requires Friday afternoon preparation, not Monday morning scrambling
4. ALWAYS include an action items section in weekly and monthly reports -- reports without action items are informational noise
5. Report frequency must match the audience's decision cycle -- daily reports to executives and weekly reports to operations teams are both mismatches
6. Quarterly reports must include trend analysis across the full quarter, not just the last month repeated three times
7. NEVER schedule more than 5 recurring reports for the same person -- consolidate or create a summary digest
8. Every chart or table in a template must have a narrative prompt -- numbers without interpretation are not a report
9. Escalation thresholds must be specific and numeric -- "when things look bad" is not a trigger
10. Include preparation time estimates for each report -- if a report takes more than 4 hours to prepare weekly, it needs automation investment

## Edge Cases

- **Startup with no established cadence:** Start with weekly only. Monthly and quarterly reports should begin only after 90 days of weekly cadence, once the team has data literacy and the habit of data-informed decisions.

- **Multiple teams with different cadences:** Create a "reporting calendar" that shows all reports on a timeline. Identify conflicts (two reports requiring the same data source updated at the same time) and stagger delivery windows.

- **Reports consumed by external stakeholders (board, investors, clients):** Create separate external versions that exclude internal commentary, action items, and sensitive data. External reports are polished documents, not working reports.

- **Team wants daily reports:** Push back unless the team makes daily decisions that change based on yesterday's data (support, production, sales). Most "daily report" requests are better served by a real-time dashboard, not a produced report.

- **Legacy reports that no one reads:** During the audit phase, add a "report readership tracker" (email open rates, dashboard view counts, meeting attendance for report review meetings). If a report has below 30% engagement for two consecutive months, flag it for elimination.

## Example

**Input:** "Set up a reporting cadence for our marketing team. We have about 15 people. We run digital campaigns and track leads, pipeline, and brand metrics."

**Output:**

## Business Reporting Cadence: Marketing Team

### Reporting Calendar

| Frequency | Report Name | Owner | Audience | Delivery | Day/Time |
|-----------|------------|-------|----------|----------|----------|
| Weekly | Marketing Pulse | Marketing Ops Lead | Marketing team (15), VP Marketing | Slack #marketing-metrics | Monday 9am |
| Monthly | Marketing Performance Review | Marketing Ops Lead | VP Marketing, CMO, Sales VP | Email + presentation | 3rd business day of month |
| Quarterly | Marketing QBR | VP Marketing | Executive team, Sales leadership | Live presentation + document | 2nd week after quarter end |

---

### Weekly Report: Marketing Pulse

**Owner:** Alex Rivera, Marketing Ops Lead
**Audience:** Marketing team (campaign managers, content team, demand gen), VP Marketing
**Delivery:** Slack channel #marketing-metrics by Monday 9am
**Preparation time:** 1.5 hours (Friday afternoon)
**Data sources:** Google Analytics, HubSpot, LinkedIn Ads, Google Ads, Salesforce

#### Template

**Section 1: This Week in 30 Seconds (3-5 bullets)**
- MQLs generated this week: [N] vs. target [N] -- [% to weekly target]
- Campaign spend this week: $[N] vs. budget $[N] -- [% utilized]
- Top-performing channel: [Channel] at $[N] cost per MQL
- Top concern: [Narrative placeholder for the biggest issue requiring attention]
- Upcoming: [Key activity or launch for next week]

**Section 2: Channel Performance Scorecards**

| Channel | MQLs | Cost | CPL | Conv. Rate | vs. Last Week | Status |
|---------|------|------|-----|------------|---------------|--------|
| Paid Search | [N] | $[N] | $[N] | [%] | [+/-] | [G/Y/R] |
| Paid Social | [N] | $[N] | $[N] | [%] | [+/-] | [G/Y/R] |
| Organic | [N] | -- | -- | [%] | [+/-] | [G/Y/R] |
| Email | [N] | $[N] | $[N] | [%] | [+/-] | [G/Y/R] |
| Events/Webinars | [N] | $[N] | $[N] | [%] | [+/-] | [G/Y/R] |

**Section 3: Campaign Spotlight**
[1-paragraph narrative on the most notable campaign result this week -- what worked, what did not, what changed]

**Section 4: Action Items**
| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| [Action item from last week] | [Person] | [Date] | [Done/In Progress/Blocked] |
| [New action item from this week's data] | [Person] | [Date] | [New] |

---

### Monthly Report: Marketing Performance Review

**Owner:** Alex Rivera, Marketing Ops Lead
**Audience:** VP Marketing, CMO, VP Sales
**Delivery:** Email with attached PDF + 30-minute review meeting on 3rd business day
**Preparation time:** 4 hours (1st and 2nd business day)
**Data sources:** HubSpot, Salesforce, Google Analytics, Finance budget system

#### Template

**Section 1: Monthly Summary**
- Total MQLs: [N] vs. target [N] ([% attainment])
- Total SQLs from marketing: [N] vs. target [N]
- Marketing-sourced pipeline: $[N] vs. target $[N]
- Total spend: $[N] vs. budget $[N] ([% utilized])
- Cost per MQL (blended): $[N] vs. target $[N]

**Section 2: Funnel Performance**
[Chart placeholder: Horizontal funnel bar showing Visitors > Leads > MQLs > SQLs > Opportunities > Closed Won, with conversion rates between each stage]

**Section 3: Channel Deep-Dive**
[Table: Channel, MQLs, SQLs, Pipeline, Revenue, ROI, Month-over-Month Trend]
[Narrative: Top 2 channels by ROI and what is driving performance. Bottom channel and recommended action.]

**Section 4: Content and Brand Metrics**
- Blog traffic: [N] sessions, [top 3 posts by traffic]
- Social engagement rate: [%] across platforms
- Brand mention volume: [N] vs. last month

**Section 5: Next Month Priorities**
[3-5 priorities with owner and expected impact]

---

### Quarterly Report: Marketing QBR

**Owner:** VP Marketing
**Audience:** Executive team, Sales leadership
**Delivery:** Live 45-minute presentation + PDF document distributed after
**Preparation time:** 8 hours (VP Marketing + Marketing Ops over 3 days)
**Data sources:** All marketing systems + Finance + Salesforce pipeline data

#### Template

**Section 1: Quarter in Review (1 slide / 1 page)**
- Revenue target: $[N], Marketing-sourced: $[N] ([%] of total)
- Pipeline generated: $[N] vs. plan $[N]
- Total spend: $[N], ROI: [X]:1
- Key win: [1 sentence]
- Key miss: [1 sentence]

**Section 2: Goal Progress (OKR / Target Tracking)**
[Table: Goal, Target, Actual, Status, Commentary]

**Section 3: Channel and Campaign Analysis**
[Chart: Revenue by channel, quarter over quarter trend]
[Chart: CAC by channel, with target lines]
[Narrative: What worked, what did not, what we learned]

**Section 4: Market and Competitive Landscape**
[Qualitative section: notable competitor moves, market shifts, new opportunities]

**Section 5: Next Quarter Plan**
[Strategic priorities, budget allocation, headcount needs, key experiments planned]

---

### Escalation Protocol

| Trigger | Threshold | Escalation To | Format | Response Time |
|---------|-----------|---------------|--------|---------------|
| MQLs below weekly target | <70% of weekly target for 2 consecutive weeks | VP Marketing | Slack DM + 15-min call | Same day |
| Spend pacing ahead of budget | >110% of monthly budget by mid-month | VP Marketing + Finance | Email with spend analysis | 24 hours |
| Campaign failure | Any campaign with CPL > 2x target after 500+ impressions | Campaign owner + Marketing Ops | Campaign pause recommendation | 4 hours |

### Maintenance Schedule
- **Quarterly audit:** First week of each quarter -- review which reports were read, which action items were completed
- **Annual restructure:** January -- align reporting to new annual strategy and updated KPIs
- **Feedback survey:** End of each quarter -- 3-question survey to all report recipients on utility and clarity
