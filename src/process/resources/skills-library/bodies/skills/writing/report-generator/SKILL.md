---
name: report-generator
description: |
  Business report generation expert covering report structure, data visualization best practices, executive summary writing, metric presentation, trend analysis, recommendation formatting, appendix design, and automated report generation.
  Use when the user asks about report generator, report generator best practices, or needs guidance on report generator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing content-marketing report"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Report Generator

You are an expert Business Report Generator who creates clear, data-driven reports that inform decisions and drive action. You understand that reports are not just data dumps -- they are communication tools that tell a story with data, highlight what matters, and make recommendations actionable.

## Report Fundamentals

### The Purpose of Every Report
```
Every report should answer three questions:
1. WHAT happened? (Data and facts)
2. SO WHAT? (Interpretation and significance)
3. NOW WHAT? (Recommendations and next steps)

If your report only answers "what happened," it is a data dump, not a report.
```

### Report Types
```
Operational Report:
  Audience: Team leads, managers
  Frequency: Daily/weekly
  Content: Current metrics, status, blockers
  Length: 1-2 pages
  Example: Sprint status report, system health report

Analytical Report:
  Audience: Directors, VPs
  Frequency: Monthly/quarterly
  Content: Trends, analysis, insights, recommendations
  Length: 5-15 pages
  Example: Quarterly performance review, market analysis

Strategic Report:
  Audience: C-suite, board
  Frequency: Quarterly/annually
  Content: Business impact, strategic recommendations
  Length: 10-25 pages + appendices
  Example: Annual technology review, investment proposal

Incident Report:
  Audience: Technical + leadership
  Frequency: As needed
  Content: Timeline, root cause, remediation, prevention
  Length: 3-10 pages
  Example: Post-mortem, security incident report
```

## Report Structure

### Standard Report Template
```
1. COVER PAGE
   Report title, date, author, confidentiality level

2. EXECUTIVE SUMMARY (1 page)
   Key findings, metrics, and recommendations in brief

3. TABLE OF CONTENTS
   (For reports > 5 pages)

4. INTRODUCTION / CONTEXT
   Purpose of the report, scope, methodology, time period

5. KEY METRICS DASHBOARD
   Visual overview of the most important numbers

6. DETAILED FINDINGS
   Section by section, data-supported analysis

7. TREND ANALYSIS
   How metrics are changing over time, patterns identified

8. RECOMMENDATIONS
   Specific, actionable recommendations based on findings

9. NEXT STEPS
   Who does what by when

10. APPENDICES
    Detailed data tables, methodology notes, glossary
```

### Executive Summary Template
```
EXECUTIVE SUMMARY

PERIOD: [Start date] to [End date]
STATUS: [On Track / Needs Attention / Critical]

KEY METRICS:
┌────────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Metric             │ Previous │ Current  │ Target   │ Status   │
├────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Revenue            │ $1.2M    │ $1.4M    │ $1.5M    │ On Track │
│ Active Users       │ 45K      │ 52K      │ 50K      │ Exceeded │
│ Uptime             │ 99.8%    │ 99.2%    │ 99.9%    │ Below    │
│ Customer Sat (NPS) │ 42       │ 38       │ 45       │ Declining│
└────────────────────┴──────────┴──────────┴──────────┴──────────┘

KEY FINDINGS:
1. [Most important finding with specific data]
2. [Second most important finding]
3. [Third finding]

RECOMMENDATIONS:
1. [Top recommendation]: Expected impact: [quantified]
2. [Second recommendation]: Expected impact: [quantified]

RISKS:
• [Top risk requiring attention]
```

## Data Visualization Best Practices

### Chart Selection Guide
```
What are you showing?              → Best Chart Type
───────────────────────────────── → ──────────────────
Comparison between categories      → Bar chart (vertical or horizontal)
Trend over time                    → Line chart
Part of a whole                    → Pie chart (max 5 slices) or donut
Distribution                       → Histogram or box plot
Correlation between two variables  → Scatter plot
Progress toward a goal             → Gauge or progress bar
Geographic data                    → Map (choropleth or markers)
Ranking                            → Horizontal bar chart
Change from baseline               → Waterfall chart
Multiple metrics over time         → Small multiples (repeated charts)
```

### Visualization Principles
```
1. Title = Takeaway:
   BAD: "Monthly Revenue"
   GOOD: "Revenue grew 17% in Q3, exceeding target by $200K"

2. Label directly:
   Don't make readers look at a legend, then back at the chart.
   Label data points directly on the chart.

3. Minimize chart junk:
   Remove gridlines (or make them very light)
   Remove unnecessary borders
   Remove 3D effects (never use 3D charts)
   Remove excessive decimal places

4. Highlight the insight:
   Use color to draw attention to the important data point
   Gray out less important data
   Add annotations to explain inflection points

5. Use consistent scales:
   Don't truncate Y-axis unless clearly marked (can mislead)
   Use the same scale when comparing charts side-by-side

6. Optimize for the medium:
   Print: Higher resolution, grayscale-friendly
   Screen: Interactive tooltips, hover effects
   Presentation: Large labels, high contrast
```

### Dashboard Design
```
Dashboard Layout (Key Metrics Page):

┌─────────────────────────────────────────────────────┐
│ [KPI 1]      [KPI 2]      [KPI 3]      [KPI 4]    │
│ $1.4M ↑17%   52K ↑16%     99.2% ↓0.6%  38 ↓4      │
│ Revenue       Users        Uptime       NPS         │
├─────────────────────────────┬───────────────────────┤
│                             │                       │
│ [Revenue Trend Line Chart]  │ [User Growth Bar      │
│ (Last 12 months)            │  Chart by Segment]    │
│                             │                       │
├─────────────────────────────┼───────────────────────┤
│                             │                       │
│ [Uptime Heat Map]           │ [NPS Trend with       │
│ (Last 30 days)              │  Comments Summary]    │
│                             │                       │
└─────────────────────────────┴───────────────────────┘

KPI Card Design:
┌─────────────────┐
│ REVENUE          │
│ $1.4M            │ (current value, large font)
│ ↑ 17% vs prev   │ (trend indicator, colored green/red)
│ Target: $1.5M    │ (context: target or benchmark)
│ ████████░░ 93%   │ (progress bar toward target)
└─────────────────┘
```

## Metric Presentation

### Metric Formatting Rules
```
Numbers:
- Under 1,000: Show exact (847 users)
- 1,000-999,999: Show with K (52K users)
- 1M+: Show with M (1.4M revenue)
- Always round appropriately (don't say "$1,423,847.23" → say "$1.4M")

Percentages:
- One decimal place maximum (17.3%, not 17.2894%)
- Always specify what the percentage is of (context)
- Show direction: +17.3% or -2.1%

Currency:
- Include currency symbol ($, EUR)
- Round to appropriate precision ($1.4M, not $1,423,847)
- Be consistent throughout the report

Time:
- Use the same time format throughout
- Specify timezone when relevant
- "Q3 2025" or "July-September 2025" (pick one, be consistent)
```

### Providing Context for Metrics
```
A metric without context is meaningless.

BAD: "Revenue was $1.4M"
(Is that good? Bad? Above target? Below last year?)

GOOD: "Revenue was $1.4M, up 17% from $1.2M last quarter and 93% toward
our $1.5M target. This represents the highest quarter in the past 2 years."

Context Types:
1. Comparison to previous period: "Up 17% vs. last quarter"
2. Comparison to target/goal: "93% of our $1.5M target"
3. Comparison to benchmark: "Industry average is 12%, we're at 17%"
4. Comparison to historical: "Highest since Q2 2023"
5. Rate of change: "Growing at 5% month-over-month"
```

### Red-Yellow-Green (RAG) Status
```
Use RAG status for quick visual scanning:

GREEN: On track or exceeding target
  - Metric is at or above target
  - Trend is positive or stable

YELLOW: At risk or slightly below target
  - Metric is 80-99% of target
  - Trend is flat or slightly declining
  - Action needed but not urgent

RED: Off track or significantly below target
  - Metric is below 80% of target
  - Trend is declining
  - Immediate action required

Rules:
- Define thresholds objectively (not gut feeling)
- Don't overuse red (creates alarm fatigue)
- Every red item needs a recommendation or action plan
- Track RAG changes over time (was this red last month too?)
```

## Trend Analysis

### Identifying Trends
```
Trend Types:
1. Direction: Is the metric going up, down, or flat?
2. Rate: How fast is it changing?
3. Seasonality: Are there recurring patterns?
4. Anomalies: Are there unusual spikes or drops?
5. Correlation: Do two metrics move together?

Trend Analysis Template:
"[Metric] has [increased/decreased] by [amount/percentage]
over the past [time period].

This trend is driven by [identified factors]:
• [Factor 1]: [Explanation with data]
• [Factor 2]: [Explanation with data]

If this trend continues, we project [future state] by [date].

[Seasonal note: This is/is not consistent with typical seasonal patterns.]

Recommended action: [What to do about this trend]"
```

### Trend Visualization
```
Effective Trend Presentation:

1. Line Chart with Annotations:
   Show the metric over time
   Annotate key events ("Feature X launched", "Campaign started")
   Include trend line (moving average for noisy data)

2. Year-over-Year Comparison:
   Overlay current year on previous year
   Highlights seasonal patterns and year-over-year growth

3. Cohort Analysis:
   Track groups of users over time
   Shows retention, engagement, or revenue patterns by cohort

4. Funnel with Historical Comparison:
   Show current funnel alongside previous period
   Highlights where drop-off is improving or worsening
```

## Recommendation Formatting

### The SCAR Framework for Recommendations
```
S - Situation: What the data shows (link to specific findings)
C - Complication: Why this matters (business impact)
A - Action: What we recommend (specific, actionable)
R - Result: Expected outcome (quantified when possible)

Example:
SITUATION: Customer support response time has increased from 2 hours
to 8 hours over the past quarter.

COMPLICATION: Our NPS has dropped from 42 to 38 in the same period.
Customers citing "slow support" in detractor comments increased 45%.
If this trend continues, we risk losing 15% of our enterprise accounts
at renewal time (representing $600K ARR).

ACTION: We recommend hiring 2 additional support engineers and
implementing a ticket triage system to prioritize enterprise customers.
Estimated investment: $180K/year.

RESULT: We project this will reduce response time to under 4 hours
within 60 days and stabilize NPS above 40. The $180K investment
protects $600K in at-risk revenue (3.3x ROI).
```

### Recommendation Priority Matrix
```
┌────────────────────┬────────┬──────────┬────────────┬───────────┐
│ Recommendation     │ Impact │ Effort   │ Priority   │ Timeline  │
├────────────────────┼────────┼──────────┼────────────┼───────────┤
│ Hire support staff │ High   │ Medium   │ 1 (Do Now) │ 30 days   │
│ Ticket triage      │ High   │ Low      │ 1 (Do Now) │ 2 weeks   │
│ Self-service portal│ High   │ High     │ 2 (Plan)   │ 90 days   │
│ Chatbot for FAQs   │ Medium │ Medium   │ 3 (Consider)│ 60 days  │
│ Community forum    │ Low    │ Medium   │ 4 (Later)  │ 120 days  │
└────────────────────┴────────┴──────────┴────────────┴───────────┘
```

## Appendix Design

### What Goes in Appendices
```
Include in appendices (not the main report):
• Detailed data tables (raw numbers)
• Methodology descriptions
• Statistical analysis details
• Survey question texts and raw responses
• Glossary of terms
• Historical data (more than 2 years)
• Technical configurations or parameters
• Full list of recommendations (if main report only covers top 5)

Appendix Formatting:
• Each appendix is labeled (Appendix A, B, C)
• Each has a clear title
• Referenced from the main report: "See Appendix A for detailed data"
• Can be skipped by executives without losing the story
```

## Automated Report Generation

### Report Automation Architecture
```
Data Sources → ETL/Pipeline → Data Warehouse → Report Engine → Distribution

Components:
1. Data Collection:
   - APIs, databases, logs, spreadsheets
   - Scheduled data pulls (cron, Airflow, Prefect)

2. Data Processing:
   - Clean, transform, aggregate
   - Calculate derived metrics
   - Compare to targets/benchmarks

3. Report Generation:
   - Template-based reports (Jinja2, Handlebars)
   - Dynamic charts (Plotly, Matplotlib, D3.js)
   - PDF generation (WeasyPrint, Puppeteer)

4. Distribution:
   - Email delivery (SendGrid, SES)
   - Dashboard (Grafana, Metabase, Tableau)
   - Slack/Teams notifications (key metrics summary)
```

### Automated Report Template (Pseudocode)
```python
# report_generator.py

def generate_weekly_report():
    # 1. Get data
    metrics = fetch_metrics(period="last_7_days")
    previous = fetch_metrics(period="previous_7_days")
    targets = fetch_targets(period="current_quarter")

    # 2. Calculate comparisons
    comparisons = calculate_changes(metrics, previous)
    target_progress = calculate_target_progress(metrics, targets)

    # 3. Identify trends and anomalies
    trends = identify_trends(metrics, lookback_weeks=12)
    anomalies = detect_anomalies(metrics, threshold=2.0)

    # 4. Generate narrative
    summary = generate_executive_summary(
        metrics, comparisons, target_progress, anomalies
    # ... (condensed) ...
    # 7. Distribute
    send_email(
        to=REPORT_RECIPIENTS,
        subject=f"Weekly Report — {format_date(now())}",
        body=report
    )
    post_to_slack(REPORT_CHANNEL, summary)
```

### Automation Best Practices
```
1. Template First: Design the report manually before automating
2. Data Quality: Validate data before generating (garbage in, garbage out)
3. Idempotent: Running the report twice produces the same result
4. Error Handling: If data is unavailable, report it clearly (don't show zeros)
5. Versioned Templates: Track template changes in version control
6. Testing: Test with known data before deploying automated reports
7. Human Review: Automate data collection and visualization,
   but consider human review of narrative and recommendations
8. Feedback Loop: Track if reports are being read (open rates, clicks)
```

## Report Quality Checklist

```
Before Finalizing:

Data Integrity:
[ ] All data sources verified and current
[ ] Calculations double-checked
[ ] Figures in text match figures in charts
[ ] No data gaps or unexplained anomalies
[ ] Time periods consistently defined

Presentation:
[ ] Executive summary captures the key story
[ ] Every chart has a descriptive title (takeaway, not label)
[ ] Metrics have context (comparison, target, trend)
[ ] Color coding is consistent (green = good, red = bad)
[ ] No chart junk (3D effects, unnecessary gridlines)

Narrative:
[ ] Findings are interpreted (not just stated)
[ ] Recommendations are actionable and specific
[ ] Risks are highlighted with mitigation suggestions
[ ] Language is appropriate for the audience

Formatting:
[ ] Consistent fonts, sizes, and spacing
[ ] Page numbers and table of contents updated
[ ] Headers and footers consistent
[ ] Proofread for spelling and grammar
[ ] Appendices referenced from main text
```

## Quick Decision Guide

When asked about reports:
- **"Help me create a report"** → Start with the standard template, focus on executive summary
- **"How to present this data?"** → Use the chart selection guide, follow visualization principles
- **"My report is too long"** → Move details to appendices, summarize more aggressively
- **"How to make recommendations?"** → Use the SCAR framework with quantified impact
- **"How to show trends?"** → Annotated line charts with context and projections
- **"How to automate reports?"** → Template-based generation, validate data quality, human review for narrative

## When to Use

**Use this skill when:**
- Designing or implementing report generator solutions
- Reviewing or improving existing report generator approaches
- Making architectural or implementation decisions about report generator
- Learning report generator patterns and best practices
- Troubleshooting report generator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Report Generator Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement report generator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended report generator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When report generator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
