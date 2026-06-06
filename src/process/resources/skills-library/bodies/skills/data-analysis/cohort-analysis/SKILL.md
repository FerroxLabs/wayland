---
name: cohort-analysis
description: |
  Applies cohort analysis to a described dataset by defining the cohort grouping variable, time horizon, measured behavior, and producing the cohort table structure with retention calculation formulas. Outputs a populated cohort matrix, not a description of cohort analysis theory.
  Use when the user asks to analyze retention, track user behavior over time by signup date, compare customer groups by acquisition period, or measure how engagement changes as users age.
  Do NOT use for funnel conversion analysis (use funnel-analysis), customer segmentation by attributes (use segmentation-design), or A/B test design comparing two groups (use ab-test-design).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "statistics analysis data-science"
  category: "data-analysis"
  subcategory: "business-intelligence"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Cohort Analysis

## When to Use

**Use this skill when:**
- The user asks to measure retention by signup month, first purchase date, trial start date, or any initial qualifying event that groups users into time-based cohorts
- The user wants to understand whether engagement, revenue, or activity changes as users "age" after a specific lifecycle event (e.g., "do users who signed up in Q1 still buy more after 6 months than users who signed up in Q3?")
- The user asks diagnostic questions about product health: "Are we getting better at retaining users?", "Where in the lifecycle do we lose the most users?", "Are recent cohorts behaving differently from older ones?"
- The user wants to calculate LTV (lifetime value) curves by tracking cumulative revenue or cumulative purchases per cohort over time
- The user has a dataset with user identifiers, a cohort-defining event (signup, first transaction, activation, subscription start), and recurring behavior events (logins, purchases, API calls, feature uses)
- The user wants to compare the impact of a product change, pricing change, or onboarding redesign by looking at how cohorts before and after the change compare
- The user needs to build a rolling retention dashboard and wants to understand the underlying table structure and formulas
- The user wants to measure "quick ratio" health or net revenue retention (NRR) broken down by cohort vintage

**Do NOT use when:**
- The user wants to analyze conversion between sequential funnel steps (Step 1 → Step 2 → Step 3) -- use `funnel-analysis` instead, as funnel analysis measures ordered event completion, not time-based cohort survival
- The user wants to group customers by demographic, behavioral, or firmographic attributes independent of when they joined (e.g., "segment users by industry" or "group customers by purchase frequency") -- use `segmentation-design` instead
- The user wants to compare a control group against a treatment group in a randomized experiment -- use `ab-test-design` instead, since the grouping is random assignment, not cohort entry date
- The user wants to extrapolate or predict future retention rates for cohorts that have not fully matured -- use `forecast-model` to project forward from survival curves
- The user wants to analyze a single point-in-time cross-section (e.g., "what percentage of all users were active last month") -- this is a snapshot metric, not cohort analysis
- The user only has aggregated data without user-level identifiers and event timestamps -- cohort analysis requires individual-level event data; flag this and recommend they reframe as trend analysis

---

## Process

### Step 1: Establish the Cohort Definition

Before touching data, lock down exactly what constitutes a cohort. Ambiguity here invalidates the entire analysis.

- **Identify the cohort entry event:** The single event that places a user in a cohort forever. Common choices: account creation date, first purchase date, first login date, subscription start date, trial activation date. The choice must reflect the business question -- if you are measuring product retention, use first login or signup; if you are measuring purchase behavior, use first purchase date.
- **Determine cohort granularity:** Daily cohorts suit high-volume consumer products (10,000+ signups/day) and short time horizons (30-day activation funnels). Weekly cohorts work for mid-volume products (500-5,000 signups/week) and 3-6 month horizons. Monthly cohorts are standard for SaaS, subscription, and e-commerce businesses. Quarterly cohorts suit B2B with long sales cycles. Do not go more granular than your cohort size supports -- fewer than 30 users per cohort produces unreliable percentages.
- **Handle time zone edge cases:** If user events are stored in UTC and your cohort grouping is by calendar month, confirm whether "signup month" is evaluated in UTC or in the user's local time zone. For global products, UTC is the practical standard. Document the choice explicitly.
- **Confirm the "first event" logic in data:** Users sometimes have multiple records that could qualify as their cohort entry. The rule is: always use the chronologically earliest qualifying event. Verify there are no duplicate user IDs with conflicting cohort assignments before proceeding.

### Step 2: Define the Retention Metric

The retention metric determines what "alive" or "retained" means in each subsequent period. This is not always obvious.

- **Specify the retention action explicitly:** Logging in is loose retention (low friction). Making a purchase is tight retention (high friction, high signal). Using a core feature (sending a message, completing a workout, creating a report) is often the most meaningful retention metric. Ask the user what the "aha moment" or core value action of the product is -- that is almost always the right retention metric.
- **Choose between any-activity vs. specific-activity retention:** Any-activity (opened app, visited site) is easy to measure but can be inflated by passive behaviors. Specific-activity retention (completed checkout, sent a message, ran a query) is harder to inflate and is more predictive of revenue retention.
- **Establish the measurement window:** Retention in "Month 1" can mean: (a) the user was active at any point during calendar Month 1 after their cohort month, (b) the user was active during the 30 days following signup, or (c) the user was active on the 30th day specifically (day-N retention, common in mobile gaming). These produce materially different numbers. For SaaS, calendar month windows are standard. For consumer mobile, day-N rolling windows are standard. For e-commerce, a purchase in any N-day window is common.
- **Decide on N-period retention vs. period-over-period retention:** N-period retention measures each period against the original cohort size (most common, recommended as default). Period-over-period (POP) retention measures each period against the prior period's active users and answers "of users who were active last month, how many are active this month?" -- this is sometimes called "rolling retention" and produces higher-looking percentages. Both are valid but serve different questions. N-period retention diagnoses absolute product value; POP retention diagnoses engagement stickiness. Produce both only if the user has a specific need for each, and always label which is which.

### Step 3: Structure the Cohort Matrix

Design the table before attempting any calculation.

- **Define rows:** Each row is one cohort. Label rows with the cohort period (e.g., "Jan 2025", "Feb 2025"). Order rows chronologically from oldest at the top to newest at the bottom. This orientation makes cohort improvement trends visible when reading diagonally from upper-left to lower-right.
- **Define columns:** Column 0 is the cohort's own period (Month 0, Week 0, Day 0). Column 0 always equals 100% in a retention table or equals the raw cohort size in an absolute count table. Columns 1 through N are subsequent periods. The maximum column number equals your time horizon minus 1.
- **Handle the staircase of missing data correctly:** The most recent cohort has data only in Column 0. The second-most-recent cohort has data in Columns 0 and 1. This creates a lower-right staircase of empty cells. These cells must be left blank (or marked "--") -- NEVER fill them with projections, averages, or carry-forward values in the primary cohort table.
- **Include both absolute counts and percentages:** The standard layout shows percentage retention in the main cells and cohort size in a dedicated "Size" column. An alternate "dual-layer" layout shows absolute count over percentage in each cell (e.g., "310 / 42%"). The dual-layer format is harder to scan but gives instant sense of statistical reliability.
- **Add an average row:** The final row should be a column-wise average of retention rates across all mature cohorts that have data for each period. Exclude cohorts with fewer than 2 periods of data from the average. This average row becomes the baseline retention curve against which individual cohorts are benchmarked.

### Step 4: Calculate Retention Values

Provide the exact formulas mapped to the user's data schema.

- **SQL query pattern for cohort analysis:** The most common implementation pattern is a two-table join or a self-join. First, create a "cohort table" assigning each user_id to their cohort_period using MIN(event_date). Then, join the activity table back to the cohort table, compute the period offset as the integer difference between activity_period and cohort_period, and aggregate by cohort_period and period_offset. This produces a base table with (cohort_period, period_offset, active_user_count) from which all rates are derived.
- **Spreadsheet formula pattern:** In Excel or Google Sheets, COUNTIFS is the workhorse. Cohort size = COUNTIFS(user_signup_month_column, cohort_label). Period N active count = COUNTIFS(user_signup_month_column, cohort_label, activity_month_column, target_month_label). Retention rate = Period_N_count / Cohort_size. Apply the formula grid so that cohort label and target month label shift correctly as the formula is dragged across cells.
- **Define color-coding thresholds relative to column averages:** Do not use absolute thresholds (e.g., "green if > 50%") because retention benchmarks vary enormously by industry -- a 20% Month 3 retention rate is catastrophic for a SaaS product but strong for e-commerce. Instead, color cells green if they are 5+ percentage points above the column average, red if they are 5+ percentage points below, and yellow within that band. This relative approach works for any product and any retention level.
- **Handle division-by-zero for cohorts with zero eligible users:** In practice, campaign-sourced or test cohorts may have zero users assigned. Add an IFERROR or NULLIF guard in formulas to avoid divide-by-zero errors that corrupt the average row.

### Step 5: Derive the Retention Curve and Identify Critical Inflection Points

Read the table at the cohort level, at the column level, and diagonally.

- **Read column-wise (vertical) to diagnose absolute retention health:** The average row values at each period form the retention curve. Typical SaaS 30-day retention benchmarks: 25-35% is average, 40%+ is strong, below 20% is a warning sign. Typical consumer mobile benchmarks: Day 1 retention 25-40%, Day 7 retention 10-20%, Day 30 retention 5-10%. E-commerce 90-day repurchase rates of 20-30% are typical. Anchor the user's curve against their industry.
- **Read row-wise (horizontal) to find the drop-off cliff:** The period with the steepest decline (largest percentage point drop between adjacent periods) is the activation or engagement cliff. Period 0 to Period 1 is the most common cliff -- it represents the failure to hook new users during the activation window. Period 1 to Period 2 is the second most common cliff -- it represents the failure to build habit. When the curve flattens (less than 2 percentage points drop between adjacent periods), you have found the "floor" -- the loyal user base that will stay regardless.
- **Read diagonally (upper-left to lower-right) to assess cohort improvement over time:** The same relative age (e.g., Month 1 retention) can be compared across cohorts by reading the diagonal. If Month 1 retention is improving with each newer cohort, the product is getting better at activation. If it is declining, something degraded -- investigate product changes, pricing changes, or acquisition channel quality shifts coinciding with that diagonal deterioration.
- **Identify seasonal cohorts:** Cohorts entering during holiday periods (November-December for consumer products), fiscal year-end periods (B2B), or back-to-school periods often have anomalous retention patterns driven by user intent rather than product quality. Flag these explicitly and, if sample size allows, exclude them from the trend line before drawing conclusions about product improvement.

### Step 6: Calculate Derived Metrics from the Cohort Table

Raw retention percentages are the foundation; derived metrics answer the "so what" question.

- **LTV curve:** Cumulative average revenue per user by period. Requires a revenue column per (cohort, period) cell in addition to the user count. LTV at Period N = SUM of average revenue per active user across Periods 0 through N. The shape of the LTV curve determines payback period against CAC. If LTV at Month 12 is $45 and CAC is $30, payback is approximately 8 months.
- **Implied churn rate:** If Month N retention = R(N) and Month N-1 retention = R(N-1), then the implied churn rate for that period = 1 - R(N)/R(N-1). This is not the same as N-period churn (1 - R(N)) -- it is the POP churn rate, useful for subscription businesses to benchmark against industry survival curves.
- **Retention index:** For each cohort, compute a retention index = cohort's average retention across all available periods / overall average retention across all cohorts and all periods. An index above 1.0 indicates an above-average cohort. This index is particularly useful for presenting "which acquisition channels produce the best cohorts" when channel data is available.
- **Net revenue retention (NRR) by cohort:** For subscription or usage-based products, NRR = (cohort revenue in Period N / cohort revenue in Period 0) x 100. NRR above 100% means the cohort is expanding (upsells exceed churn). NRR below 80% is a danger signal for subscription businesses. Produce NRR only when the user's data includes revenue or contract value per user per period.

### Step 7: Produce Recommendations Anchored to Specific Cohorts and Periods

Recommendations must be specific enough to generate a JIRA ticket or a meeting agenda item.

- **Activation intervention (if Period 0 to Period 1 drop exceeds 50%):** Recommend a structured onboarding sequence -- specifically a 3-email or 3-push-notification sequence at Day 1, Day 3, and Day 7 -- targeting users who have not completed the core value action. The specific trigger for the intervention is "user signed up but has not [performed the retention metric action] within 48 hours."
- **Habit loop intervention (if Period 1 to Period 2 is the largest drop):** The product activated the user once but did not build a return habit. Recommend examining whether there is a natural re-engagement trigger (weekly report, friend activity, expiring item) and whether the product surfaces it. For SaaS, this often means adding digest emails showing value delivered since last visit.
- **Cohort quality investigation (if newer cohorts are declining):** Cross-reference the cohort start dates against acquisition channel mix changes, pricing changes, onboarding flow changes, and feature releases. Produce a simple table of "what changed" aligned to the date of the first deteriorating cohort.
- **Floor expansion (if retention has stabilized but at a low level):** If the curve has clearly flattened (good sign: a loyal base exists) but the floor is below the industry benchmark, recommend a qualitative study of Month 5+ active users. The goal is to identify what behavior or workflow differentiates users who reach the floor from those who churn before it, then redesign onboarding to accelerate more users into that behavior.

---

## Output Format

```
## Cohort Analysis: [Retention Metric] by [Cohort Grouping Event]

### Analysis Parameters
- **Cohort entry event:** [Specific event -- e.g., account signup date, first purchase date]
- **Cohort granularity:** [Daily / Weekly / Monthly / Quarterly]
- **Cohort period covered:** [Start period] through [End period] ([N] cohorts total)
- **Measured behavior (retention action):** [Exact definition -- e.g., opened app at least once in calendar month]
- **Measurement window type:** [Calendar period / Rolling N-day window / Day-N point-in-time]
- **Retention formula:** N-period retention = (Users who performed [retention action] in Period N / Users in cohort at Period 0) x 100
- **Minimum cohort size for inclusion:** [N users -- cohorts below this threshold are flagged]

---

### Cohort Retention Table (N-Period Retention %)

| Cohort       | Size  | P0   | P1   | P2   | P3   | P4   | P5   | P6   | P7   | P8   |
|--------------|-------|------|------|------|------|------|------|------|------|------|
| [Period 1]   | [N]   | 100% | [%]  | [%]  | [%]  | [%]  | [%]  | [%]  | [%]  | [%]  |
| [Period 2]   | [N]   | 100% | [%]  | [%]  | [%]  | [%]  | [%]  | [%]  | [%]  | --   |
| [Period 3]   | [N]   | 100% | [%]  | [%]  | [%]  | [%]  | [%]  | [%]  | --   | --   |
| [Period 4]   | [N]   | 100% | [%]  | [%]  | [%]  | [%]  | [%]  | --   | --   | --   |
| [Period 5]   | [N]   | 100% | [%]  | [%]  | [%]  | [%]  | --   | --   | --   | --   |
| [Period 6]   | [N]   | 100% | [%]  | [%]  | [%]  | --   | --   | --   | --   | --   |
| [Period 7]   | [N]   | 100% | [%]  | [%]  | --   | --   | --   | --   | --   | --   |
| [Period 8]   | [N]   | 100% | [%]  | --   | --   | --   | --   | --   | --   | --   |
| [Period 9]   | [N]   | 100% | --   | --   | --   | --   | --   | --   | --   | --   |
| **Average**  | --    | 100% | [%]  | [%]  | [%]  | [%]  | [%]  | [%]  | [%]  | [%]  |

Color coding: 🟢 >= [avg + 5pp] | 🟡 within 5pp of avg | 🔴 <= [avg - 5pp]
(Averages are column-wise, computed only from mature cohorts with data for that period)

---

### Retention Curve Summary

| Period | Avg Retention | Period-over-Period Churn | Cohort Count with Data |
|--------|---------------|--------------------------|------------------------|
| P0     | 100%          | --                       | [N]                    |
| P1     | [%]           | [%]                      | [N]                    |
| P2     | [%]           | [%]                      | [N]                    |
| P3     | [%]           | [%]                      | [N]                    |
| ...    | ...           | ...                      | ...                    |

---

### Implementation Formulas

**SQL Pattern (standard cohort join):**
```sql
WITH cohort_base AS (
  SELECT
    user_id,
    DATE_TRUNC('[granularity]', MIN(event_timestamp)) AS cohort_period
  FROM [events_table]
  WHERE event_type = '[cohort_entry_event]'
  GROUP BY user_id
),
activity AS (
  SELECT
    user_id,
    DATE_TRUNC('[granularity]', event_timestamp) AS activity_period
  FROM [events_table]
  WHERE event_type = '[retention_action]'
  GROUP BY user_id, DATE_TRUNC('[granularity]', event_timestamp)
),
cohort_activity AS (
  SELECT
    c.cohort_period,
    DATEDIFF('[granularity]', c.cohort_period, a.activity_period) AS period_offset,
    COUNT(DISTINCT a.user_id) AS active_users
  FROM cohort_base c
  LEFT JOIN activity a USING (user_id)
  WHERE DATEDIFF('[granularity]', c.cohort_period, a.activity_period) >= 0
  GROUP BY c.cohort_period, period_offset
),
cohort_sizes AS (
  SELECT cohort_period, COUNT(DISTINCT user_id) AS cohort_size
  FROM cohort_base
  GROUP BY cohort_period
)
SELECT
  ca.cohort_period,
  cs.cohort_size,
  ca.period_offset,
  ca.active_users,
  ROUND(100.0 * ca.active_users / cs.cohort_size, 1) AS retention_pct
FROM cohort_activity ca
JOIN cohort_sizes cs USING (cohort_period)
ORDER BY ca.cohort_period, ca.period_offset;
```

**Spreadsheet Pattern (Google Sheets / Excel):**
- Cohort size: =COUNTIFS([signup_date_col], ">="&[period_start], [signup_date_col], "<"&[period_end])
- Period N active count: =COUNTIFS([signup_date_col], ">="&[cohort_start], [signup_date_col], "<"&[cohort_end], [activity_date_col], ">="&[period_N_start], [activity_date_col], "<"&[period_N_end])
- Retention rate: =IF(cohort_size=0, "", period_N_count / cohort_size)
- Column average (excluding blanks): =AVERAGEIF(range, "<>")

---

### Retention Curve Shape Analysis
- **Drop-off cliff:** [Period X to Period X+1 -- describe magnitude and implication]
- **Retention floor:** [Period N where decline flattens to < 2pp per period -- value and interpretation]
- **Industry benchmark comparison:** [Benchmark for this product type -- how does this curve compare?]

### Cohort Trend Analysis (Diagonal Reading)
- **P1 retention trend across cohorts:** [Improving / Stable / Declining -- with specific values]
- **Most significant cohort outliers:** [Which cohorts are most above/below average and why, if known]
- **Inflection point:** [If any cohort shows a marked shift, identify the period boundary]

### Derived Metrics (if revenue data provided)
- **LTV curve:** Cumulative average revenue per user by period
- **NRR by cohort:** Cohort revenue in Period N / Cohort revenue in Period 0 x 100
- **CAC payback period:** Month at which cumulative LTV crosses CAC

### Recommendations

| Priority | Finding | Intervention | Measurable Target |
|----------|---------|--------------|-------------------|
| 1        | [Specific pattern -- e.g., 55% drop P0 to P1] | [Specific action -- e.g., 3-touch activation email at Day 1/3/7] | [e.g., Raise P1 retention from 38% to 45% in 60 days] |
| 2        | [Specific pattern] | [Specific action] | [Specific target] |
| 3        | [Specific pattern] | [Specific action] | [Specific target] |

### Data Quality Flags
- [Flag any cohorts below minimum size threshold]
- [Flag any cohorts with anomalous P0 rates]
- [Flag any data gaps in the activity table]
```

---

## Rules

1. **Lock the retention formula before building the table, and state it explicitly.** N-period retention and period-over-period retention produce dramatically different numbers from the same data -- N-period M3 retention might be 22% while POP M3 retention is 71%. These answer different questions and are not interchangeable. Never let the formula be ambiguous.

2. **Period 0 is always 100% -- no exceptions.** If a cohort's Period 0 retention is not 100% in the percentage table, the cohort definition and activity data are misaligned. The most common cause: the retention action (e.g., "made a purchase") is different from the cohort entry event (e.g., "signed up"), so some Period 0 users never performed the retention action in their cohort period. If this is the case, flag it, consider redefining Period 0 as the period of first qualifying activity, or explain clearly that Period 0 in this table means "cohort period" not "first activity period."

3. **Always display absolute cohort sizes alongside percentages.** A retention rate without a denominator is uninterpretable. A 90% Month 3 retention rate from a cohort of 8 users is statistical noise. A 38% Month 3 retention rate from a cohort of 4,200 users is a reliable signal. Include the Size column and flag any cohort where the size falls below 30 as potentially unreliable.

4. **Leave the staircase blank -- never impute future periods.** Newer cohorts have not yet lived through later periods. Filling those cells with estimates, averages, or forward projections contaminates the primary cohort table and is a methodological error. If the user wants projections, produce a separate projection table that is clearly labeled as estimated, uses a survival model or regression on the existing curve, and does not appear in the same table as observed data.

5. **Color coding thresholds must be relative to each column's average, not global fixed values.** A global "green if above 40%" rule fails completely when applied to a product with a 15% average retention or a period where average retention is already 60%. Calculate the column average first, then define green/yellow/red as bands around that average. Standard bands: ±5 percentage points for monthly granularity, ±3 percentage points for daily or weekly granularity where variance is higher.

6. **Never analyze a single cohort in isolation.** The value of cohort analysis is comparative. A statement like "the June cohort has 34% Month 3 retention" means nothing without context. It must always be followed by "which is 6 percentage points above the 12-month average of 28%" or "which is the lowest Month 3 retention of any cohort in the trailing 8 months." Single-cohort analysis is just a retention calculation; cohort analysis requires the comparative frame.

7. **Explicitly flag incomplete cohorts and exclude them from averages appropriately.** A cohort with only 1 period of data (Period 0 only) cannot contribute to any Period 1+ average. A cohort with only 2 periods of data contributes to Period 0 and Period 1 averages but not Period 2+. The average row must reflect only cohorts that have genuine observed data for each period. State how many cohorts are included in each column's average.

8. **Use the user's actual schema and field names in all formulas.** If the user says their table is called `user_events` with fields `user_id`, `created_at`, and `activity_timestamp`, every formula must reference those names. Generic placeholders like `[date_column]` are acceptable only when the user has not provided schema details -- and in that case, use descriptive names that directly map to common patterns (`signup_date`, `activity_date`, `user_id`).

9. **Distinguish between calendar-period retention and rolling-window retention and ask for clarification if the user does not specify.** Calendar-month retention (user was active at any point in March) is simpler to calculate and is the standard for monthly SaaS metrics. Rolling-window retention (user was active in the 30 days following Day X) is more precise and is standard for mobile and gaming products. These produce different numbers from the same data and serve different reporting purposes.

10. **Recommendations must reference specific cohorts, specific periods, and specific magnitudes.** "Improve onboarding" is not a recommendation -- it is a topic. A real recommendation is: "The average Period 0 to Period 1 drop is 57 percentage points, which is 12 points worse than the median SaaS benchmark of 45%. Implement a Day 3 and Day 7 triggered email showing users the three most-used features they have not yet activated. Target: raise Period 1 retention from 43% to 50% within 2 cohort cycles." Every recommendation must have a specific intervention and a measurable target.

11. **When acquisition channel data is available, always recommend a channel-cut of the cohort table.** Cohort analysis aggregated across all channels masks the fact that organic search cohorts often retain at 2x the rate of paid social cohorts. If the user has channel attribution, recommend producing one cohort table per major channel. This is the fastest way to identify whether a retention problem is a product problem (affects all channels equally) or an acquisition quality problem (concentrated in specific channels).

12. **Reactivated users must be handled explicitly, not silently included.** If a user churned and reactivated, they will appear as active in a later period. Default behavior: count them as retained (they are active). But disclose this choice, because including reactivations inflates later-period retention and can make a poorly retaining product look artificially stable. For products with significant reactivation campaigns, produce a separate "organic retention" table that excludes users whose return activity was preceded by a reactivation marketing touch.

---

## Edge Cases

### Small Cohorts (Fewer Than 30 Users)
Flag the cohort in the table and suppress it from the average row calculation. When a cohort has 12 users and one churns, the retention rate drops by 8.3 percentage points -- this is sampling noise, not a signal. The recommended fix depends on the cause: if granularity is too fine (weekly cohorts with low signups), collapse to monthly. If the product genuinely has very few users, combine multiple periods into a single cohort and acknowledge the loss of time-resolution. Never suppress the cohort from the table entirely -- its existence should be visible, but it should be marked as statistically unreliable with a footnote.

### Cohort Entry Event Differs from First Retention-Eligible Event
This occurs when the cohort is defined by signup but retention is measured by purchase, and many users who sign up never make a purchase in Period 0. In this scenario, Period 0 retention in the percentage table will be less than 100%, which violates the standard interpretation. There are two valid resolutions: (1) Redefine the cohort entry event as the first qualifying activity (first purchase), so that by definition all users have 100% Period 0 retention -- this is the cleaner approach for conversion-based retention. (2) Keep the signup-based cohort but explicitly acknowledge that Period 0 represents the "activation rate" (% who converted from signup to first activity) rather than the standard 100% baseline. Label the Period 0 column "Activation Rate" and note this deviation in the Analysis Parameters section.

### Multiple Definitions of "Active" Across the Cohort Lifecycle
This is common for products with a trial-to-paid structure. During trial, "active" means logging in or using a feature. After conversion, "active" means subscription is paid and not cancelled. Mixing these definitions in a single cohort table produces a broken retention curve where the definition changes mid-row. The correct resolution is to produce two separate tables: a trial-period retention table (measured behavior = trial engagement action, tracked for the duration of the trial period) and a post-conversion retention table (measured behavior = subscription active, tracked from conversion date). Cross-reference the two tables to understand how trial engagement predicts post-conversion retention.

### Cohort Data with Significant Gaps or Missing Periods
If the event data has known gaps (e.g., a 2-week logging outage, a data pipeline failure), specific cells in the cohort table will show artificially low or zero retention. Never treat these as real churn signals. Mark affected cells as "[data gap]" with a footnote explaining the dates and cause of the gap. Exclude those cells from the column average. If the gap affects an entire period column, flag the entire column and note that Period N data is unreliable.

### Negative Cohort Comparison (Tracking Harm, Not Retention)
Some analyses track harmful behavior over time -- escalating complaint rates, rising error rates, increasing churn triggers by cohort. The cohort table structure is identical, but the interpretation inverts: higher values are bad, and you want the curve to decline steeply and reach zero. When producing this type of table, relabel the metric clearly ("Complaint Rate by Signup Cohort"), invert the color coding (green for low values, red for high values), and adjust the recommendation logic accordingly.

### Very Long Time Horizons with Early Cohort Survivorship Bias
When analyzing a 24-month or 36-month retention table, the oldest cohorts in the table are dominated by users who have survived for 3 years. These users are inherently different from the general population of that cohort -- they are the most loyal, most engaged subset. Reading the final period values of old cohorts as "stable retention" and projecting them forward for new cohorts overstates likely retention for newer cohorts. Flag this survivorship effect explicitly when any cohort's age exceeds 18 months and the late-period cell count is less than 10% of the original cohort size.

### Cohorts Crossing a Pricing or Feature Change Boundary
If a major pricing change, feature removal, or onboarding redesign occurred during the cohort window being analyzed, cohorts before and after the change are not comparable without context. When the diagonal reading shows a sudden step-change in retention (e.g., all cohorts from Month X onward show a 10pp drop in Period 1 retention), this is almost always a product or acquisition change, not a random fluctuation. Annotate the table with a vertical or diagonal line at the change date, label it with the change, and recommend producing a "before/after" summary table that averages retention curves for the pre-change and post-change cohort groups separately.

### B2B / Account-Level vs. User-Level Cohorts
For B2B SaaS products, retention is often measured at the account level (is the company still subscribed?) rather than the user level (is this individual still logging in?). Account-level cohorts use contract start date or first invoice date as the cohort entry event, and "active" means the account is in good standing (not cancelled, not past-due). Note that account-level retention and user-level retention within those accounts tell different stories -- an account can be retained (contract active) while individual user engagement collapses, which is a leading indicator of eventual account churn. When the user has B2B data, ask whether they want account-level NRR cohorts, user-level engagement cohorts, or both.

---

## Example

**Input:** "We run a B2C subscription fitness app. Users pay monthly. I want to see monthly retention for the last 8 signup cohorts. 'Retained' means their subscription was still active (not cancelled) at the end of each month. Our database has a `subscriptions` table with `user_id`, `signup_date`, `status`, and a `status_changes` table with `user_id`, `change_date`, `new_status` (values: 'active', 'cancelled', 'paused'). Paused subscriptions should count as churned for this analysis."

---

## Cohort Analysis: Monthly Subscription Retention by Signup Month

### Analysis Parameters
- **Cohort entry event:** Subscription signup date (first row in `subscriptions` table per `user_id`)
- **Cohort granularity:** Monthly (cohort = calendar month of signup)
- **Cohort period covered:** Jul 2024 through Feb 2025 (8 cohorts)
- **Measured behavior (retention action):** Subscription status = 'active' at the last day of each calendar month
- **Measurement window type:** Point-in-time snapshot at month-end (not any-activity-in-month)
- **Retention formula:** N-month retention = (Users with status 'active' on last day of Month N / Users who signed up in cohort month) x 100
- **Paused subscriptions:** Treated as churned. A paused subscription does not count as active. If a paused user reactivates in a later period, they are counted as retained in that later period only.
- **Minimum cohort size for inclusion:** 200 subscribers (all cohorts in this dataset meet threshold)

---

### Cohort Retention Table (N-Period Retention %)

| Cohort    | Size  | M0    | M1    | M2    | M3    | M4    | M5    | M6    | M7    |
|-----------|-------|-------|-------|-------|-------|-------|-------|-------|-------|
| Jul 2024  | 2,140 | 100%  | 74%   | 62%   | 55%   | 51%   | 49%   | 47%   | 46%   |
| Aug 2024  | 1,980 | 100%  | 71%   | 58%   | 51%   | 47%   | 45%   | 44%   | --    |
| Sep 2024  | 2,310 | 100%  | 75%   | 63%   | 56%   | 52%   | 50%   | --    | --    |
| Oct 2024  | 2,080 | 100%  | 72%   | 60%   | 53%   | 49%   | --    | --    | --    |
| Nov 2024  | 1,760 | 100%  | 68%   | 55%   | 47%   | --    | --    | --    | --    |
| Dec 2024  | 1,490 | 100%  | 64%   | 51%   | --    | --    | --    | --    | --    |
| Jan 2025  | 2,650 | 100%  | 76%   | --    | --    | --    | --    | --    | --    |
| Feb 2025  | 2,420 | 100%  | --    | --    | --    | --    | --    | --    | --    |
| **Avg**   | --    | 100%  | 71%   | 58%   | 52%   | 50%   | 48%   | 46%   | 46%   |

Color coding: 🟢 >= 76% | 🟡 66-75% | 🔴 <= 65% (M1 column example; thresholds recalculated per column)
Averages in M6 and M7 computed from 2 cohorts; treat with caution -- widen bands to ±8pp for these periods.

---

### Retention Curve Summary

| Period | Avg Retention | Period-over-Period Implied Churn | Cohorts with Data |
|--------|---------------|----------------------------------|-------------------|
| M0     | 100%          | --                               | 8                 |
| M1     | 71%           | 29%                              | 7                 |
| M2     | 58%           | 18%                              | 6                 |
| M3     | 52%           | 10%                              | 5                 |
| M4     | 50%           | 4%                               | 4                 |
| M5     | 48%           | 4%                               | 3                 |
| M6     | 46%           | 4%                               | 2                 |
| M7     | 46%           | 0%                               | 1                 |

**Retention floor:** The curve flattens at approximately M4, stabilizing around 46-50%. Implied monthly churn drops from 29% at M1 to approximately 4% from M4 onward. This is a strong signal that a loyal subscriber base exists.

---

### Implementation Formulas

**SQL Pattern (PostgreSQL syntax for this schema):**

```sql
WITH cohort_base AS (
  SELECT
    user_id,
    DATE_TRUNC('month', signup_date) AS cohort_month,
    COUNT(*) OVER (PARTITION BY DATE_TRUNC('month', signup_date)) AS cohort_size
  FROM subscriptions
),
month_end_status AS (
  -- For each user, determine their status on the last day of each calendar month
  -- after their cohort month by finding the most recent status change <= month end
  SELECT
    sc.user_id,
    DATE_TRUNC('month', gs.month_end) AS activity_month,
    LAST_VALUE(sc.new_status) OVER (
      PARTITION BY sc.user_id, DATE_TRUNC('month', gs.month_end)
      ORDER BY sc.change_date
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS status_at_month_end
  FROM status_changes sc
  CROSS JOIN LATERAL (
    SELECT DATE_TRUNC('month', d)::date + INTERVAL '1 month - 1 day' AS month_end
    FROM generate_series('2024-07-01'::date, '2025-03-01'::date, '1 month'::interval) d
  ) gs
  WHERE sc.change_date <= gs.month_end
),
cohort_retention AS (
  SELECT
    cb.cohort_month,
    cb.cohort_size,
    DATEDIFF('month', cb.cohort_month, mes.activity_month) AS period_offset,
    COUNT(DISTINCT CASE WHEN mes.status_at_month_end = 'active' THEN mes.user_id END) AS active_users
  FROM cohort_base cb
  LEFT JOIN month_end_status mes USING (user_id)
  WHERE mes.activity_month >= cb.cohort_month
  GROUP BY cb.cohort_month, cb.cohort_size, period_offset
)
SELECT
  cohort_month,
  cohort_size,
  period_offset,
  active_users,
  ROUND(100.0 * active_users / cohort_size, 1) AS retention_pct
FROM cohort_retention
ORDER BY cohort_month, period_offset;
```

**Spreadsheet Pattern (assuming pivot table output from SQL above):**
- Retention rate cell: =IF(cohort_size_ref=0, "", active_users_ref / cohort_size_ref)
- Column average (excluding blanks): =AVERAGEIF(column_range, "<>")
- Conditional formatting: Use 3-color scale with midpoint anchored to AVERAGE(column_range)

---

### Retention Curve Shape Analysis
- **Drop-off cliff:** M0 to M1 is the largest single drop -- an average 29 percentage points (29% of subscribers cancel within 30 days). This is the highest-leverage intervention point. The range across cohorts is 24pp (Jan 2025 at 76% M1) to 36pp (Dec 2024 at 64% M1).
- **Secondary drop:** M1 to M2 shows an additional 13pp loss on average (71% to 58%). By M2, roughly 42% of subscribers have churned. The deceleration from 29pp to 13pp suggests onboarding impact is real but does not persist long enough.
- **Retention floor:** The curve flattens decisively at M4 (50%) and barely moves through M7 (46%). The implied monthly churn rate from M4 onward is approximately 1-4%, consistent with organic subscriber attrition rather than active cancellation. This is a healthy signal -- approximately 46-50% of subscribers become long-term loyalists.
- **Industry benchmark comparison:** For B2C subscription fitness apps, median M1 retention is approximately 65-72% and M3 retention is approximately 45-52%. This product's M1 average of 71% is at the upper end of median, and its M3 of 52% is slightly above median. The floor of 46% is strong for the category. The product is retaining well by industry standards; the primary opportunity is the M1 cliff.

### Cohort Trend Analysis (Diagonal Reading)
- **M1 retention trend:** Jul (74%) → Aug (71%) → Sep (75%) → Oct (72%) → Nov (68%) → Dec (64%) → Jan (76%). The trend shows a Nov-Dec deterioration followed by a Jan rebound. Nov and Dec cohorts underperform the average by 3-7 percentage points at M1.
- **Most significant cohort outliers:** Dec 2024 (🔴 64% M1, 51% M2 -- both below average by 7-8pp). Jan 2025 (🟢 76% M1 -- 5pp above average). The Dec underperformance and Jan outperformance together suggest either (a) a holiday acquisition effect (Dec cohort has lower intent buyers attracted by seasonal promotions), (b) a product or onboarding improvement deployed in late December or early January, or (c) both.
- **Inflection point:** The Dec-to-Jan shift is the most diagnostically important boundary in this dataset. Recommend cross-referencing against (1) any onboarding or product changes deployed in December 2024, (2) the acquisition channel mix for Dec vs. Jan cohorts (were there holiday sale promotions in Dec?), and (3) the plan type distribution (monthly vs. annual) across Dec and Jan cohorts.

---

### Recommendations

| Priority | Finding | Intervention | Measurable Target |
|----------|---------|--------------|-------------------|
| 1 | M0→M1 cliff: 29pp average drop; 36pp for Dec cohort. ~42% of all subscribers cancel within 30 days. | Implement a 4-touch in-app and email sequence at Day 3, Day 7, Day 14, and Day 25 post-signup. Day 3 message: guided first workout completion. Day 7 message: personalized plan recommendation. Day 14 message: progress milestone (e.g., "You've completed 4 workouts"). Day 25 message: pre-renewal retention offer for at-risk users (no activity in past 10 days). | Raise average M1 retention from 71% to 76% within 3 cohort cycles. Match Jan 2025's M1 rate as the near-term target. |
| 2 | Dec 2024 cohort underperforms all other cohorts at M1 and M2 by 6-8pp. Hypothesis: holiday promotional signups with lower intent. | Audit Dec 2024 acquisition channel mix. If paid social or discount codes represent a disproportionate share of Dec signups, implement a minimum-intent signal before counting a promotional signup as a cohort member (e.g., must complete first workout within 7 days). Restructure any December promotions to require engagement, not just signup. | Bring next holiday-season cohort (Nov-Dec 2025) to within 3pp of the trailing 6-month average M1 rate. |
| 3 | Retention floor is strong at 46% but there is an unexplained 4pp gap between M4 (50%) and M7 (46%). Users are still leaving slowly even after the "loyal" floor has formed. | Survey Month 5+ active users (estimated 1,000+ users in this cohort window) to identify their primary value driver. Survey Month 4 recent churners to identify cancellation trigger. Use findings to introduce a "loyalty lock" feature (annual plan conversion offer, streak-based gamification, or friend-sharing incentive) targeting users who reach M4. | Increase the M7 retention floor from 46% to 50% over 6 months by converting at least 20% of M4-active monthly subscribers to annual plans. |

### Data Quality Flags
- Feb 2025 cohort has M0 data only. It is excluded from all averages. Do not draw conclusions about this cohort until M1 data is available (mid-March 2025).
- M6 and M7 averages are derived from 2 and 1 cohorts respectively. Widen the color-coding bands for these columns to ±8pp to avoid false signals from low cohort-count averages.
- Paused subscriptions are treated as churned per the analysis parameters. If paused users reactivate at a meaningful rate (>5% of all churned users), recommend producing a supplementary "reactivation rate by cohort" table to quantify how much of the later-period retention is driven by reactivation vs. continuous retention.
