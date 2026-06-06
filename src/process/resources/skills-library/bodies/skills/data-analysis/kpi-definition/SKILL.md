---
name: kpi-definition
description: |
  Produces a complete KPI definition document with metric name, business question, formula, data source, owner, update frequency, baseline, and target for each KPI. Outputs a populated metric catalog table, not advice about which KPIs to consider.
  Use when the user asks to define KPIs, set up performance metrics, create a measurement framework, or build a metric catalog for a business area.
  Do NOT use for metric hierarchy and goal trees (use metric-framework), dashboard layout design (use bi-dashboard-spec), or personal goal setting (use smart-goal-builder in productivity).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis data-visualization template"
  category: "data-analysis"
  subcategory: "business-intelligence"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# KPI Definition

## When to Use

**Use this skill when:**
- A user asks to define, document, or formalize KPIs for a specific business function -- sales, marketing, product, customer success, operations, finance, or HR
- A user wants to build a metric catalog that will be used in recurring reviews, dashboards, or QBRs
- A user has informal tracking (spreadsheets, ad hoc reports) and wants to standardize how metrics are calculated and owned
- A user needs to align a team around a small, agreed-upon set of measurements tied to strategic objectives
- A user is standing up a new business unit, product line, or initiative and needs a measurement framework from scratch
- A user has KPIs that are inconsistently defined across teams (two people calculating "churn" differently) and needs canonical definitions
- A user needs to populate a BI tool (Tableau, Power BI, Looker, Metabase) with documented metric logic before building views

**Do NOT use when:**
- The user needs a full goal decomposition tree with north star metric, level-1 driver metrics, and diagnostic metrics (use `metric-framework` -- that skill produces a hierarchy, this one produces a flat catalog of fully specified metrics)
- The user needs a dashboard layout with panel placement, filter design, and refresh cadence (use `bi-dashboard-spec` -- this skill defines the metrics, not the visual presentation)
- The user is setting personal goals or team OKRs (use `smart-goal-builder` or `okr-builder` in the productivity category -- KPIs measure operational performance, OKRs define aspirational outcomes)
- The user wants to design the data pipelines or ETL jobs that populate the metrics (use `etl-pipeline-design` in data engineering -- that skill handles ingestion, transformation, and scheduling)
- The user is asking which KPIs they should consider philosophically without committing to a specific business area (redirect to `metric-framework` first to establish strategic context, then return here)
- The user needs statistical analysis of whether a metric change is significant (use `statistical-significance-analysis` in data-analysis)

## Process

### Step 1: Establish Strategic Context

Before generating a single metric, anchor the catalog in strategy. Ask the user for:
- The specific business function or sub-function (not "marketing" but "demand generation" or "lifecycle marketing" -- specificity prevents overlap with other teams' KPI catalogs)
- The top 2-3 strategic objectives for this area over the next quarter or two quarters (6 months is the maximum useful horizon for operational KPIs)
- The primary audience for these KPIs: C-suite executives need 5-7 high-level indicators; team leads need 8-12 operational metrics; individual contributors need granular, daily-actionable measures
- The decisions these KPIs must inform -- a KPI that cannot change a decision is decorative
- The existing data infrastructure: what systems are already instrumented (CRM, product analytics, billing system, data warehouse), and what is not yet tracked

If the user cannot name a strategic objective -- push back explicitly. Say: "Before I define metrics, I need to know the most important outcome for this function in the next 6 months. What would make this area a clear success?" Do not generate a catalog without anchoring objectives. Metrics without objectives are just numbers.

### Step 2: Generate and Classify Candidate Metrics

For each strategic objective, generate 4-6 candidate metrics and immediately classify each one:

- **Leading indicators:** Measure inputs, behaviors, or early signals that predict future outcomes. Examples: pipeline coverage ratio (predicts revenue), trial-to-paid conversion rate in week 1 (predicts activation), support ticket volume on product issues (predicts churn). These are actionable before the outcome occurs.
- **Lagging indicators:** Measure results after the fact. Examples: monthly churn rate, quarterly revenue, Net Promoter Score. These confirm whether strategy worked but cannot be acted upon in real time.
- **Input metrics:** Activities the team controls directly (emails sent, calls made, features shipped). Not KPIs in isolation -- only valid as KPIs when tied to an outcome metric.
- **Ratio vs. absolute:** Always prefer a rate or ratio over an absolute count as the primary metric. "Conversion rate" is a KPI; "number of conversions" is context. The exception: absolute volume metrics (tickets opened, deals created) are valid when the team has a direct throughput objective.

Ensure every strategic objective has at least one leading and one lagging indicator. Objectives measured only by lagging indicators leave the team unable to intervene before the quarter ends.

Eliminate vanity metrics immediately:
- Page views without a behavioral qualifier (time on page, scroll depth, click-through)
- Total registered users without an activity qualifier (weekly active, feature-touched)
- Social media followers without an engagement rate
- Gross revenue figures for teams that do not control pricing or contract value

### Step 3: Apply the Five-Gate Quality Filter

Every candidate metric must pass all five gates before it enters the catalog:

**Gate 1 -- Actionable:** If this metric drops 15% from baseline tomorrow, can the owner name three specific investigations or interventions within 5 minutes? If no, the metric is informational, not operational. Cut it or redesign it.

**Gate 2 -- Attributable:** Is this metric primarily influenced by the team that owns it? A product team should not own "revenue" (which is influenced by sales, pricing, and market conditions). They should own "feature adoption rate" or "activation rate." If a team cannot move the metric through their own decisions, they should not be accountable for it.

**Gate 3 -- Comparable:** Can the metric be compared meaningfully across time periods, cohorts, or segments? Absolute counts fail this gate when headcount, user base, or product scope changes. Rates and ratios pass. A metric that cannot be compared to last month or to a benchmark is not a KPI.

**Gate 4 -- Instrumentable:** Is the data source real and accessible? If the data requires a new integration, a new event, or data that does not exist, flag it as a "Data Gap" and include it as a requirement in the output -- do not omit the metric, but do not pretend the data exists either.

**Gate 5 -- Understandable:** Can a new team member explain this metric correctly in one sentence after reading its definition? If the formula requires a paragraph of caveats to avoid misinterpretation, simplify the formula or split it into two metrics.

### Step 4: Write Complete KPI Definitions

For each metric that passes all five gates, populate every field. Partial definitions are not acceptable in a final catalog.

**Metric Name:** Short (2-4 words), unambiguous, and consistent with how the team already talks about this concept. Use title case. Avoid jargon abbreviations without a full expansion in the definition (e.g., "LTV:CAC Ratio" is acceptable if the definition expands both terms).

**Business Question:** A single sentence in plain language starting with "What" or "How." This is what a non-technical stakeholder reads to understand why the metric exists. Example: "What percentage of trial users convert to a paid plan within 14 days of signup?"

**Formula:** Exact calculation syntax referencing real fields or systems. Not "conversions divided by trials" but "(COUNT(subscriptions.account_id WHERE subscriptions.plan_type = 'paid' AND subscriptions.created_at <= trials.started_at + 14 days) / COUNT(trials.account_id)) x 100". If the formula uses conditional logic, write it out. If it is a ratio, specify the numerator and denominator explicitly. If it involves a time window, specify the window precisely (rolling 30 days vs. calendar month).

**Data Source:** The specific system, database table, or report that supplies the raw data. Not "Salesforce" but "salesforce.opportunities (stage, close_date, amount, account_id)." If multiple sources are joined, name all of them and the join key.

**Owner:** A specific named person or, when the person is unknown, a specific role title. "The CS team" is not an owner. "Director of Customer Success" is. The owner is responsible for: (a) ensuring data accuracy, (b) investigating alerts, and (c) presenting the metric in reviews.

**Update Frequency:** Match to the decision cycle. Real-time metrics require real-time dashboards and on-call owners. Daily metrics suit operational teams with daily standups. Weekly metrics suit team-lead reviews. Monthly metrics suit executive reviews. Do not set weekly update frequency for a metric that is only reviewed monthly -- the extra computation creates no value.

**Baseline:** The most recent measured value with the date of measurement. If no historical data exists, write "TBD -- establish after [specific date or number of weeks] of data collection" and use a credible industry benchmark as a provisional target. Do not leave baseline blank.

**Target:** A specific numeric value with a time horizon. "85% by end of Q3 2026" not "improve." Targets should be challenging but achievable: 10-30% improvement from baseline for mature products, 50-100% improvement for nascent metrics where baseline is low due to low instrumentation, not low performance.

**Alert Threshold:** The value at which automated or manual investigation is triggered -- set this between the baseline and the target, not at the target itself. For improvement metrics (higher is better), the alert threshold is the minimum acceptable value before the target is missed. For reduction metrics (lower is better), it is the maximum acceptable value. Rule of thumb: set the alert threshold at 60-70% of the way from baseline to target.

**Indicator Type:** Leading or Lagging. Include this in the catalog so reviewers know which metrics are diagnostic (leading) and which are confirmatory (lagging).

### Step 5: Size and Structure the Catalog

A single KPI catalog must not exceed 12 metrics. Research on management attention and review quality (Doerr, "Measure What Matters"; Kaplan and Norton, "The Balanced Scorecard") consistently shows that teams tracking more than 12 metrics in a single catalog lose focus -- the review becomes a status report rather than a decision-making session.

If the business area requires more than 12 metrics:
- Split by sub-function: "Marketing -- Demand Generation" and "Marketing -- Lifecycle & Retention" are separate catalogs
- Create a tiered structure: 5-7 "primary" KPIs reviewed at every meeting, 5 "secondary" metrics reviewed monthly only
- Move operational metrics (email open rate, call duration) to a separate operational dashboard and exclude them from the KPI catalog

For executive audiences: limit to 5-7 KPIs. Include "drill-down available" notes to indicate that diagnostic metrics exist but are presented separately.

For operational team leads: 8-12 metrics are appropriate.

For individual contributors: Metrics should be daily-actionable. If a metric updates monthly, it is not a working metric for an individual contributor's day-to-day decisions.

### Step 6: Define Measurement Cadence and Escalation

For the full catalog, specify:

**Review cadence:** Which KPIs are reviewed at which meetings. Weekly operational reviews should cover leading indicators. Monthly reviews should cover both. Quarterly reviews should include target recalibration and objective alignment.

**Single owner per metric:** Even if multiple teams contribute to a metric, one person is accountable. Use a RACI-style note if needed: "Owner: Sarah Chen (Accountable). Contributors: CS team (Responsible for data input)."

**Display location:** The dashboard name, report name, spreadsheet tab, or BI view where each KPI appears. If it does not exist yet, name it as a requirement.

**Alert protocol:** Define two tiers --
- **Yellow (watch):** Metric has moved 50-70% of the way toward the alert threshold from baseline in one review period. Owner investigates within 48-72 hours and posts findings.
- **Red (act):** Metric has breached the alert threshold. Owner escalates to the named escalation contact within 24 hours with a root cause hypothesis and proposed action.

**Escalation path:** Name the specific person to escalate to, not "management." "Escalate to VP of Product" is actionable. "Escalate to leadership" is not.

### Step 7: Validate and Finalize

Review the completed catalog against this checklist before outputting:
- Every strategic objective has at least two KPIs (at least one leading, at least one lagging)
- No KPI has a missing formula or "TBD" data source without a flagged Data Gap action item
- No two KPIs measure the same thing with different names (deduplicate)
- No KPI is an absolute count where a rate would be more comparable (challenge every raw count)
- Targets are numeric with a time horizon -- no qualitative targets
- Alert thresholds are set between baseline and target, not at or beyond target
- Every owner is a named person or specific role, not a team name
- The total catalog is 12 KPIs or fewer (if not, restructure)
- Conflicting KPIs are documented in a Trade-off Notes section

## Output Format

```markdown
## KPI Catalog: [Business Function] -- [Sub-function if applicable]
**Prepared for:** [Audience: Executive / Team Lead / Operational]
**Catalog Date:** [Date]
**Catalog Owner:** [Person responsible for maintaining this document]

---

### Strategic Objectives
1. [Objective 1 -- specific, time-bound, owned]
2. [Objective 2 -- specific, time-bound, owned]
3. [Objective 3 -- specific, time-bound, owned]

---

### KPI Definitions

| # | Metric Name | Business Question | Formula | Data Source | Owner | Update Freq. | Baseline (as of [date]) | Target | Alert Threshold | Type |
|---|-------------|-------------------|---------|-------------|-------|--------------|------------------------|--------|-----------------|------|
| 1 | [Name] | [Single-sentence "What/How" question] | [Exact formula with field names] | [System.table (relevant fields)] | [Named person or role] | [Daily / Weekly / Monthly] | [Value, date] | [Value by date] | [Value] | [Leading / Lagging] |
| 2 | | | | | | | | | | |
| ... | | | | | | | | | | |

---

### Data Gaps
*(Metrics flagged as Gate 4 failures -- data does not yet exist)*

| Metric Name | Missing Data | Required Action | Owner | Due Date |
|-------------|-------------|-----------------|-------|----------|
| [Name] | [What data is missing] | [Instrument event / build integration / pull report] | [Person] | [Date] |

---

### Trade-off Notes
*(Where optimizing one KPI may harm another)*

| KPI Pair | Tension | Monitoring Rule |
|----------|---------|----------------|
| [KPI A] vs [KPI B] | [Description of trade-off] | [When to pause optimization of A if B degrades] |

---

### Measurement Cadence

| Review Type | Frequency | KPIs Reviewed | Forum | Audience |
|-------------|-----------|---------------|-------|----------|
| Operational Review | Weekly | [List KPI numbers] | [Meeting name] | [Attendees] |
| Performance Review | Monthly | All | [Meeting name] | [Attendees] |
| Calibration Review | Quarterly | All | [Meeting name] | [Attendees] |

---

### Escalation Protocol

| Alert Level | Trigger | Owner Action | Escalation Target | Timeframe |
|-------------|---------|--------------|-------------------|-----------|
| Yellow (Watch) | [Metric moves X% toward alert threshold in one period] | Investigate, post findings | [Named person] | 48-72 hours |
| Red (Act) | [Metric breaches alert threshold] | Root cause + proposed action | [Named person] | 24 hours |

---

### KPI Health Check Schedule
- **Baseline establishment (TBD items):** [Date by which any TBD baselines will be measured]
- **Next target review:** [End of current quarter]
- **Catalog refresh:** Quarterly -- next scheduled [Month Year]
- **Objective alignment check:** [Date of next strategic planning cycle]

---

### Glossary
*(Define any terms that appear in formulas or metric names that could be interpreted differently by different team members)*

- **[Term]:** [Precise definition used in this catalog, e.g., "Active User: an account that has triggered at least one session_start event in the past 7 calendar days"]
- **[Term]:** [Definition]
```

## Rules

1. **Never produce a metric without a formula.** A metric definition that says "measures customer satisfaction" instead of "(SUM(survey_responses.score) / COUNT(survey_responses.response_id)) where survey_responses.sent_date >= CURRENT_DATE - 30" is not a KPI definition -- it is a wishlist item. Every formula must specify the calculation, the time window, and the fields involved.

2. **Never accept "the team" as an owner.** Shared ownership is no ownership. If a metric is influenced by multiple teams (e.g., time-to-resolution involves both engineering and support), the owner is the team most able to directly influence the outcome. List contributing teams in the Trade-off or Cadence sections, not in the Owner field.

3. **Require at least one leading indicator per strategic objective.** A catalog with only lagging indicators gives the team no ability to intervene before the period ends. If the user proposes objectives with only lagging metrics, generate at least one predictive leading metric and explain why it is needed.

4. **Set alert thresholds between baseline and target -- never at or beyond the target.** An alert threshold that equals the target provides zero early warning. The threshold should be reached when the metric is trending toward missing the target, not after it already has. For improvement metrics: threshold = baseline + (target - baseline) x 0.5 to 0.6. For reduction metrics: threshold = baseline - (baseline - target) x 0.5 to 0.6.

5. **Prefer rates and ratios over absolute counts as primary KPIs.** Absolute counts conflate growth in denominator (user base, team size, time elapsed) with genuine performance improvement. The only acceptable absolute-count KPIs are throughput metrics where the team has a direct volume objective (e.g., "process 500 tickets per week") and the denominator is constant.

6. **Cap the catalog at 12 metrics.** If the user asks for more, split by sub-function or create a tiered primary/secondary structure. Output a note explaining the split and what criteria were used to prioritize the primary catalog.

7. **Formulas must reference actual field names from the named data source, not abstract placeholders.** "conversions / visitors" is not a formula. "(COUNT(analytics.sessions.session_id WHERE sessions.converted = TRUE) / COUNT(analytics.sessions.session_id)) x 100" is a formula. If the user does not know the field names, ask -- or flag the metric as a Data Gap and specify what schema information is needed.

8. **Every target must be a number with a date.** "Increase retention" is not a target. "Increase 90-day retention rate from 62% to 75% by September 30, 2026" is a target. If the user gives a qualitative target ("improve customer satisfaction"), convert it to numeric ("increase CSAT score from 3.8 to 4.3 on a 5-point scale by Q4") and confirm with the user.

9. **Flag conflicting KPIs explicitly in Trade-off Notes.** Common conflicts: Average Handle Time vs. First Contact Resolution (faster calls reduce quality); Conversion Rate vs. Lead Quality Score (relaxing qualification criteria increases conversion but attracts poor-fit customers); Velocity vs. Defect Rate (shipping faster increases bugs). If the catalog contains KPI pairs known to conflict, the Trade-off Notes section is mandatory, not optional.

10. **Vanity metrics that appear KPI-worthy must be rejected with a specific explanation.** Common vanity metrics in disguise: "email open rate" (measures subject line curiosity, not business outcome -- replace with "email click-to-meeting booked rate"); "website traffic" (replace with "qualified traffic: sessions from target ICP segments with > 60 seconds time on page"); "features shipped per sprint" (measures activity, not outcome -- replace with "feature adoption rate within 30 days of release"). When you reject a vanity metric, name the replacement.

## Edge Cases

### Startup or New Initiative with No Historical Data
Set baselines as "TBD -- establish after [specific date or event, e.g., first 90 days post-launch or first 200 users]." Use credible industry benchmarks as provisional targets and label them explicitly as benchmarks: "Provisional target based on SaaS industry median (source: company internal benchmark data) -- recalibrate after [date]." Common benchmarks to reference: B2B SaaS trial-to-paid conversion 2-5% (bottom quartile) to 15-25% (top quartile); monthly churn rate 1-2% healthy range for B2B SaaS; Net Revenue Retention above 100% indicates expansion revenue covering churn. Flag the catalog with a header note: "Baseline targets are provisional benchmarks. Full recalibration scheduled for [date]."

### Multiple Teams Share Influence Over a Metric
Name the single team most able to directly move the metric as owner. Create a "Contributing Teams" column in the KPI table (add it after Owner). Document the contribution boundary explicitly: "Sales owns this metric; Marketing contributes via lead quality (measured separately in Marketing KPI Catalog)." If two teams are genuinely co-equal in their influence (NPS is affected equally by product quality and support quality), create two sub-metrics each owned separately, and use the combined metric as an executive-level KPI only -- with both sub-metric owners listed as contributors.

### KPI Conflicts Within the Catalog
When two KPIs in the same catalog create optimization tension, the Trade-off Notes section is mandatory. Document: the pair, the direction of tension, the monitoring rule (e.g., "if First Contact Resolution drops below 72% while Average Handle Time is being optimized, pause AHT reduction efforts and convene a root cause review"), and the decision authority (who decides to pause optimization of one metric in service of another). The most common conflict pairs: speed vs. quality, volume vs. accuracy, conversion rate vs. average contract value, feature adoption vs. system performance.

### User Provides Too Many Objectives (5 or More)
More than 3 strategic objectives for a single function in a single period is a prioritization failure, not a KPI definition problem. Do not attempt to build a 15-20 metric catalog. Instead: (1) Output the catalog for the top 3 objectives only (ask the user to rank them if they have not), (2) List the deferred objectives with a note explaining they should be covered in a separate catalog or the next planning cycle, (3) Explicitly state: "A KPI catalog covering 5+ objectives simultaneously typically exceeds 12 metrics, dilutes team focus, and produces reviews that generate status updates rather than decisions." This is a known failure mode in measurement programs.

### KPI Requires Data That Does Not Yet Exist
Do not omit the metric from the catalog. Include it with "Data Gap" in the Baseline field and add it to the Data Gaps table with: (a) what specific data is missing (event name, table, field), (b) the engineering or instrumentation action required, (c) the owner of the instrumentation work (typically a data engineer or analytics engineer, not the metric owner), and (d) a target date by which the data gap must be resolved before the metric is removed from the catalog and replaced with a confirmed KPI. A metric in "Data Gap" status should not appear in any review meeting until it is resolved -- note this in the Cadence table.

### Executive Audience Requesting Operational Metrics
If the stated audience is C-suite or VP-level but the user is providing a list of 10+ granular operational metrics, redirect: "For executive audiences, I recommend limiting to 5-7 primary KPIs with drill-down notes. I'll flag which of your requested metrics are better suited for a team-lead operational dashboard." Then produce two outputs: an executive summary KPI set (5-7 metrics, business-question language, monthly cadence) and a note listing which metrics belong in an operational catalog. Do not try to combine both into a single table -- executives reading a 12-row metric table will not engage with it.

### Metrics Defined Differently Across Teams
When the user says "we measure churn differently in finance and in product" -- this is a governance problem, not a KPI definition problem, and it must be addressed before the catalog is finalized. Output the catalog with a single canonical definition for each contested metric, flagged with: "CANONICAL DEFINITION -- supersedes previous calculations. All teams should align to this formula by [date]. Previous calculation: [description]. Reason for change: [brief rationale]." Recommend the user present this in a data governance forum before using the catalog in reviews, because metric definition changes that affect reported numbers will cause confusion if not communicated.

### B2C vs. B2B Metrics Have Different Denominators
Many standard KPI formulas change fundamentally between B2C and B2B contexts. In B2C, "active user" means an individual human; in B2B, it typically means an account or a seat within an account. Daily Active Users / Monthly Active Users (DAU/MAU) is a valid B2C engagement metric but is nearly meaningless for B2B software used primarily during business hours (expected DAU/MAU in B2B SaaS is 0.25-0.45, vs. 0.5-0.7 for B2C social apps). When defining metrics, confirm whether the denominator is an individual user, a seat, an account, or an organization -- and make this explicit in the formula and the Glossary section.

## Example

**Input:** "We need KPIs for our B2B SaaS customer success team. Our goals this year are to reduce churn, grow net revenue retention, and improve onboarding completion. The audience is the CS team lead."

---

## KPI Catalog: Customer Success -- Retention & Onboarding
**Prepared for:** Team Lead (CS Director)
**Catalog Date:** June 2026
**Catalog Owner:** Maria Santos, Director of Customer Success

---

### Strategic Objectives
1. Reduce gross logo churn rate from 8% to below 5% annually by December 31, 2026
2. Grow Net Revenue Retention (NRR) from 98% to 108% by December 31, 2026
3. Increase structured onboarding completion rate from 41% to 75% by September 30, 2026

---

### KPI Definitions

| # | Metric Name | Business Question | Formula | Data Source | Owner | Update Freq. | Baseline (May 2026) | Target | Alert Threshold | Type |
|---|-------------|-------------------|---------|-------------|-------|--------------|------------------------|--------|-----------------|------|
| 1 | Gross Logo Churn Rate | What percentage of customer accounts cancel in a given month? | (COUNT(subscriptions.account_id WHERE subscriptions.status changed to 'cancelled' in calendar month) / COUNT(subscriptions.account_id WHERE subscriptions.status = 'active' on first day of calendar month)) x 100 | billing.subscriptions (account_id, status, status_changed_date) | Maria Santos, CS Director | Monthly | 0.67%/month (~8% ann.) | 0.42%/month by Dec 2026 | 0.55%/month | Lagging |
| 2 | Net Revenue Retention | Are existing customers collectively paying more or less than they were 12 months ago? | (SUM(billing.invoices.amount WHERE invoice_date in current month AND account_id IN accounts active 12 months ago) / SUM(billing.invoices.amount WHERE invoice_date 12 months prior AND account_id IN same cohort)) x 100 | billing.invoices (account_id, amount, invoice_date), billing.subscriptions (account_id, status) | Maria Santos, CS Director | Monthly | 98% | 108% by Dec 2026 | 103% | Lagging |
| 3 | At-Risk Account Count | How many accounts are showing disengagement signals that predict churn? | COUNT(accounts WHERE (product.sessions.logins_last_14_days < 3 AND product.feature_events.events_last_30_days < 10) AND subscriptions.renewal_date <= CURRENT_DATE + 90) | product.sessions (account_id, login_date), product.feature_events (account_id, event_date, event_type), billing.subscriptions (account_id, renewal_date) | Devon Park, Senior CSM | Weekly | 18 accounts | <8 accounts by Sep 2026 | 13 accounts | Leading |
| 4 | Onboarding Completion Rate | What percentage of new accounts complete all required onboarding milestones within 30 days of contract start? | (COUNT(onboarding.milestones.account_id WHERE milestones_completed = total_required_milestones AND completion_date <= contract_start_date + 30) / COUNT(onboarding.milestones.account_id WHERE contract_start_date in rolling 90-day window)) x 100 | onboarding.milestones (account_id, milestone_id, completion_date, total_required_milestones), billing.subscriptions (account_id, contract_start_date) | Jamie Reyes, Onboarding Lead | Weekly | 41% | 75% by Sep 30, 2026 | 58% | Lagging |
| 5 | Time to First Value | How many days does it take a new account to complete their first core workflow after contract start? | MEDIAN(DATEDIFF(day, billing.subscriptions.contract_start_date, product.feature_events.event_date) WHERE product.feature_events.event_type = 'core_workflow_completed' AND account_id in accounts with contract_start in last 90 days) | product.feature_events (account_id, event_type, event_date), billing.subscriptions (account_id, contract_start_date) | Jamie Reyes, Onboarding Lead | Weekly | 21 days | 10 days by Sep 2026 | 15 days | Leading |
| 6 | QBR Coverage Rate | What percentage of accounts with ACV > $10,000 have had a Quarterly Business Review in the last 90 days? | (COUNT(crm.activities.account_id WHERE activity_type = 'QBR' AND activity_date >= CURRENT_DATE - 90 AND accounts.acv >= 10000) / COUNT(accounts.account_id WHERE accounts.acv >= 10000 AND subscriptions.status = 'active')) x 100 | crm.activities (account_id, activity_type, activity_date), crm.accounts (account_id, acv), billing.subscriptions (account_id, status) | Maria Santos, CS Director | Monthly | 52% | 90% by Dec 2026 | 70% | Leading |
| 7 | Expansion Revenue Rate | What percentage of active accounts have purchased an upsell or expansion in the past 90 days? | (COUNT(DISTINCT billing.invoices.account_id WHERE invoice_type = 'expansion' AND invoice_date >= CURRENT_DATE - 90) / COUNT(accounts.account_id WHERE subscriptions.status = 'active')) x 100 | billing.invoices (account_id, invoice_type, invoice_date, amount), billing.subscriptions (account_id, status) | Devon Park, Senior CSM | Monthly | 8% | 20% by Dec 2026 | 13% | Leading |
| 8 | CS Escalation Rate | What percentage of active accounts are in active escalation status this month? | (COUNT(crm.accounts.account_id WHERE accounts.health_status = 'escalated') / COUNT(accounts.account_id WHERE subscriptions.status = 'active')) x 100 | crm.accounts (account_id, health_status), billing.subscriptions (account_id, status) | Maria Santos, CS Director | Weekly | 6.2% | <2.5% by Dec 2026 | 4.0% | Leading |

---

### Data Gaps
*(Metrics flagged as Gate 4 failures -- data does not yet exist)*

| Metric Name | Missing Data | Required Action | Owner | Due Date |
|-------------|-------------|-----------------|-------|----------|
| Time to First Value | `product.feature_events.event_type = 'core_workflow_completed'` event not yet instrumented in product analytics | Analytics engineer to add `core_workflow_completed` event trigger at workflow completion screen | Priya Nair, Analytics Engineer | July 15, 2026 |

*Note: KPI #5 (Time to First Value) will appear in the catalog but will not be reviewed in meetings until the data gap is resolved. Provisional baseline of 21 days estimated from manual CSM survey of 20 accounts.*

---

### Trade-off Notes

| KPI Pair | Tension | Monitoring Rule |
|----------|---------|----------------|
| Onboarding Completion Rate (#4) vs. Time to First Value (#5) | Reducing time to first value (shortening onboarding) may lower completion rate if milestones are skipped rather than accelerated | If Onboarding Completion Rate drops below 58% while Time to First Value is improving, convene a milestone audit. Do not attribute improvement in TTFV to milestone removal without CS Director sign-off. |
| Expansion Revenue Rate (#7) vs. At-Risk Account Count (#3) | CSM time spent on expansion outreach reduces time available for at-risk account intervention | If At-Risk Account Count exceeds 13 accounts, suspend active expansion outreach for accounts in the at-risk cohort until they clear risk status. |

---

### Measurement Cadence

| Review Type | Frequency | KPIs Reviewed | Forum | Audience |
|-------------|-----------|---------------|-------|----------|
| Operational Review | Weekly (Tuesday 9am) | #3, #4, #5, #8 (leading indicators + onboarding) | CS Weekly Standup | All CSMs, Onboarding Lead |
| Performance Review | Monthly (first Monday) | All (#1 through #8) | CS Monthly Review | CS Director, VP of Customer Success, Finance BP |
| Calibration Review | Quarterly | All + target recalibration | CS QBR Prep | CS Director, VP of CS, CEO |

---

### Escalation Protocol

| Alert Level | Trigger | Owner Action | Escalation Target | Timeframe |
|-------------|---------|--------------|-------------------|-----------|
| Yellow (Watch) | Any KPI moves 50% of the way from current value toward alert threshold in a single review period | Owner investigates root cause, posts written findings in #cs-metrics Slack channel | Maria Santos, CS Director | 48-72 hours |
| Red (Act) | Any KPI breaches its alert threshold | Owner presents root cause hypothesis and proposed corrective action | VP of Customer Success | 24 hours |

---

### KPI Health Check Schedule
- **Baseline establishment (TBD items):** Time to First Value -- instrument and measure by July 15, 2026; confirmed baseline by August 1, 2026
- **Next target review:** September 30, 2026 (post-onboarding target horizon)
- **Catalog refresh:** Quarterly -- next scheduled October 1, 2026
- **Objective alignment check:** Annual planning cycle, November 2026

---

### Glossary
- **Active Account:** An account with subscriptions.status = 'active' and at least one product.sessions.login in the past 30 calendar days
- **Core Workflow Completed:** The event triggered when an account completes their primary configured workflow for the first time, as defined by the `core_workflow_completed` event in product.feature_events (pending instrumentation per Data Gaps table)
- **Gross Logo Churn:** Count of unique accounts (logos) that cancelled during the period, regardless of contract value -- does not net out new or expansion revenue
- **Net Revenue Retention (NRR):** Also called Net Dollar Retention (NDR) in some contexts. Measures revenue retained and grown from an existing customer cohort over 12 months, including expansion, contraction, and churn. NRR above 100% means expansion revenue exceeds churn revenue.
- **At-Risk Account:** An account meeting the disengagement threshold defined in KPI #3 (fewer than 3 logins in 14 days AND fewer than 10 feature events in 30 days) AND with a renewal date within the next 90 days
- **QBR (Quarterly Business Review):** A scheduled, structured review meeting between a CSM and the customer's executive sponsor, logged in crm.activities with activity_type = 'QBR'
- **ACV (Annual Contract Value):** The annualized revenue value of a customer subscription, as stored in crm.accounts.acv
