---
name: segmentation-design
description: |
  Designs a customer or user segmentation by selecting variables, defining the segmentation method (RFM, behavioral, demographic, needs-based), producing segment definitions with names, and specifying the analysis output format.
  Use when the user asks to segment customers, create audience groups, build user personas from data, define target segments, or cluster users by behavior or attributes.
  Do NOT use for cohort analysis by time period (use cohort-analysis), funnel conversion between steps (use funnel-analysis), or individual KPI definition (use kpi-definition).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis data-science planning"
  category: "data-analysis"
  subcategory: "business-intelligence"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Segmentation Design

## When to Use

**Use this skill when:**
- The user asks to segment customers, users, or accounts into distinct groups for differentiated treatment -- marketing, product prioritization, pricing, customer success resourcing, or sales territory planning
- The user wants to build audience groups for targeted campaigns, onboarding flows, or feature rollouts and needs the underlying logic to define who belongs in each group
- The user asks how to apply RFM analysis, behavioral clustering, firmographic grouping, needs-based segmentation, or a hybrid approach to their customer base
- The user wants to move from a one-size-fits-all strategy to differentiated approaches and needs a framework for defining, sizing, and operationalizing segments
- The user wants to build data-driven user personas grounded in behavioral signals rather than purely qualitative descriptions
- The user is designing a customer health scoring system and needs to translate health scores into actionable tiers with different intervention protocols
- The user has an existing segmentation that has become stale or too coarse and wants to redesign it with sharper variable selection and updated thresholds

**Do NOT use when:**
- The user wants to compare behavioral patterns across user cohorts defined by sign-up period or first purchase date -- use `cohort-analysis` instead, which handles time-based group comparisons with retention curves and decay rates
- The user wants to map step-by-step conversion rates through a process (sign-up to activation, trial to paid, awareness to purchase) -- use `funnel-analysis`, which is specifically designed for sequential drop-off analysis
- The user wants to define and track individual business KPIs or metric trees -- use `kpi-definition` for structured metric definition with owners, targets, and data sources
- The user wants to size a market or analyze competitive positioning -- use `competitive-intelligence`, which addresses market structure analysis rather than internal customer grouping
- The user is asking about A/B testing a segmentation hypothesis -- segmentation design produces the segment definitions; experimental validation requires a separate experimentation skill
- The user wants to analyze ad audience performance across third-party platform segments (Meta, Google) -- those are platform-defined audiences, not first-party segmentation design
- The user wants purely geographic segmentation for logistics or territory planning without a behavioral or value dimension -- that is a spatial analysis problem, not a customer intelligence problem

---

## Process

### Step 1: Establish the Segmentation Purpose and Downstream Decision

Before selecting variables or methods, lock in the exact business decision the segments will inform. A segmentation designed for customer success resource allocation uses entirely different variables than one designed for email marketing personalization, even on the same customer base.

- Ask explicitly: "What specific action will differ by segment?" If the answer is vague ("we'll treat them differently"), push harder. Acceptable answers: "At-Risk accounts get an immediate CSM call; Champions get an expansion pitch; Passive accounts get automated-only support." Unacceptable: "We'll personalize the experience."
- Identify the primary team consuming the segmentation: customer success, marketing, product, sales, or executive. Each team has a different tolerance for complexity and a different operational system they work in (CRM, marketing automation platform, product analytics tool, BI dashboard).
- Establish how many segments are operationally manageable. The practical rule: the number of segments should not exceed the number of distinct treatment protocols the consuming team can realistically execute. A 6-person CS team cannot sustain 7 differentiated playbooks. A marketing team with 2 email variations cannot use a 5-segment model. The ceiling is organizational capacity, not analytical sophistication.
- Document the "so what" for each proposed segment. Write one sentence per segment: "We created this segment so that we can [specific action]." If you cannot complete that sentence, the segment does not belong in the design.
- Confirm whether this is a strategic segmentation (reviewed quarterly, informs roadmap and resource allocation) or an operational segmentation (recalculated frequently, drives automated triggers and campaigns). The two have different variable requirements, recalculation cadences, and governance needs.

### Step 2: Select the Segmentation Method

Match the method to the purpose, the available data, and the maturity of the business. The most analytically sophisticated method is not always the right one.

- **RFM (Recency, Frequency, Monetary):** Purpose-built for transactional and e-commerce businesses where purchase behavior is the primary signal. Requires a clean order/transaction table with timestamps and amounts. Best for: identifying dormant high-value customers for reactivation, distinguishing loyal-occasional from loyal-frequent buyers, and scoring the lifetime potential of new customers. Limitation: does not capture why customers buy or what they use. Standard implementation: score each dimension 1-5, creating a composite score of 3-15 or a 3-digit code (e.g., RFM 5-4-3). Do not average RFM scores -- the dimensions behave differently and averaging destroys signal.
- **Behavioral / Product Usage:** Purpose-built for SaaS, mobile apps, and digital products. Requires event-level data from product analytics (Mixpanel, Amplitude, Heap, Segment, or custom event tables). Key variables: feature adoption breadth (how many distinct features used), engagement depth (frequency and duration), workflow completion rate, and aha-moment achievement. Best for: product-led growth companies, customer health scoring, and identifying power users vs. passive users. Limitation: requires substantial data engineering; raw event counts without normalization are noisy.
- **Demographic / Firmographic:** Uses observable attributes of the customer or their company. For B2C: age bracket, household income tier, geography, device type. For B2B (firmographic): company headcount tier, annual revenue tier, industry vertical, technology stack. Best as a secondary overlay rather than a primary segmentation variable, because demographics describe who a customer is, not what they do or need. The exception: when behavioral data is unavailable (new product, limited instrumentation) or when the segments will be used for paid media targeting where demographic attributes are the targeting mechanism.
- **Needs-Based / Jobs-to-Be-Done:** Groups customers by the primary outcome they are trying to achieve or the job they are hiring the product to do. This method has the highest predictive power for product strategy decisions but requires the most input data -- typically a combination of NPS verbatim, support ticket themes, in-product survey responses, and customer interview synthesis. Best for: product roadmap prioritization, value proposition differentiation, pricing tier design. Limitation: harder to operationalize in automated systems because "job-to-be-done" is not a database column.
- **Predictive / ML-Based:** K-means clustering, hierarchical clustering, or DBSCAN applied to a feature matrix of behavioral and transactional signals. Best when: the customer base is large (10,000+ users), the data is rich and clean, and a data science team can maintain the model. K-means requires pre-specifying k (number of clusters) -- use the elbow method on within-cluster sum of squares (WCSS) or silhouette scoring to select k empirically. DBSCAN is better when cluster shapes are irregular and outliers should be isolated rather than absorbed. Limitation: cluster outputs require human interpretation and labeling; the model does not produce segment names or strategies automatically.
- **Hybrid:** The most common production implementation. Behavioral tier (primary axis) overlaid with value tier (secondary axis) produces a matrix of segments. Example: a 3x3 matrix of engagement (High/Medium/Low) by ARR tier (Enterprise/Mid-Market/SMB) produces 9 theoretical cells, which are typically collapsed to 5-6 actionable segments by merging the low-engagement cells. Hybrid models are more durable because a customer who changes behavior but not value tier does not necessarily change their strategic priority.

### Step 3: Define and Validate Segmentation Variables

Variable selection is where most segmentation designs fail. Choosing variables that are noisy, unmeasurable, or correlated with each other produces segments that look clean on paper but behave inconsistently in practice.

- **Validate data availability before committing to any variable.** A variable that requires 6 months of data collection to produce is not available for a segmentation needed in 2 weeks. Ask for confirmation that each variable exists in a queryable system, has acceptable data completeness (>85% of records populated), and can be refreshed on the recalculation cadence.
- **For RFM:** Define all three windows explicitly. Recency: days since last purchase (not "recent" -- a specific number). Frequency: count of purchases in the last 12 months (or whatever the natural purchase cycle is -- for subscription businesses, frequency is measured differently and may mean number of distinct modules used rather than purchases). Monetary: either total spend in the window or average order value, depending on whether you care more about total value delivered or purchase behavior pattern. Score each dimension on a 1-5 scale. Assign quintiles: the top 20% of recency scores gets a 5, the bottom 20% gets a 1. Monetary and frequency follow the same logic. Do not use static cutoffs (e.g., "anyone who spent over $500 gets a 5") -- quintile assignment is relative to your actual distribution and remains valid even as the base grows.
- **For behavioral segmentation:** Identify the 3-5 behaviors that most strongly predict retention, expansion, or churn in your specific product. Do not use generic behaviors like "logged in" -- use behaviors that reflect value extraction. For a project management tool, that might be: tasks created per week, collaborators invited, integrations enabled, and reports generated. Normalize all counts to per-user-per-week to control for tenure differences. Define thresholds for High/Medium/Low for each behavior based on your actual distribution, not intuition. Use the 33rd and 67th percentile as default Low/Medium/High boundaries unless you have domain-specific reason for different cuts.
- **For needs-based variables:** Run a cluster analysis or thematic coding on open-text NPS responses, support ticket categories, or survey data. Group the themes into 3-7 distinct need profiles. Give each profile a name based on the primary job-to-be-done ("Automation Seekers," "Reporting-First Users," "Collaboration-Centric Teams"). Validate the profiles by checking whether they produce meaningfully different product usage patterns -- if two need profiles use the product identically, they may not be distinct enough to warrant separate treatment.
- **Check for multicollinearity.** If two variables are highly correlated (r > 0.7), using both adds noise without adding signal. For example, session duration and pages per session often correlate tightly. In that case, use only the one that is more directly measurable and meaningful to the business.
- **Avoid vanity variables.** Variables that feel important but do not differentiate behavior: plan age (how long they have been a customer), number of support tickets submitted (high support can mean high engagement OR high frustration), and self-reported company size (often inaccurate). Test each variable candidate by checking whether its distribution actually separates into distinct behavioral groups or whether it produces one big cluster with a few outliers.

### Step 4: Define Segment Boundaries and Write Segment Definitions

This is the translation step -- converting variable values into human-readable, actionable segment definitions. The output of this step is a document that a CSM, a marketer, or a product manager can read and immediately understand.

- **Write segment criteria as explicit boolean or range rules.** "Usage score >= 70% AND Health score >= 75 AND ARR > $20K" is correct. "High-value active customers" is not a criterion -- it is a label. Every segment definition must be reproducible by a SQL query or a CRM filter.
- **Name segments descriptively.** Names should communicate the segment's defining characteristic and its strategic posture. Good names: "Champions," "At-Risk Loyalists," "High-Potential New Accounts," "Passive Subscribers," "Price-Sensitive Occasional Buyers." Bad names: "Tier 1," "Segment A," "Group 3." The name should be usable in conversation -- a CSM should be able to say "I'm working the At-Risk Loyalists this week" without needing to explain what that means.
- **Size each segment.** Express as both a percentage of total base and an approximate absolute count. A segment containing fewer than 3% of accounts in a 500-account base (fewer than 15 accounts) probably does not justify a separate playbook -- fold it into the nearest adjacent segment. A segment containing more than 50% of accounts is likely too broad and should be split using a secondary variable.
- **Write a profile narrative for each segment.** 2-4 sentences describing a typical member. Include: what they are doing with your product, what their relationship with your company looks like (loyal, transactional, disengaged), what their likely motivation is, and what risk or opportunity they represent. This narrative is used to train CSMs, brief sales reps, and inform campaign creative -- it must be vivid and specific, not generic.
- **Assign a strategic goal to each segment.** Use the standard taxonomy: Acquire (relevant only for prospect segmentation), Activate (new users getting to first value), Retain (prevent churn), Grow (increase usage or ARR), Expand (upsell, cross-sell), Deprioritize (reduce cost to serve). Every segment must have exactly one primary goal. If a segment has two goals ("Retain AND Grow"), split it by value tier.
- **Define the primary health metric for each segment.** This is the single number that tells you whether the segment is moving in the right direction. Champions: Net Revenue Retention. At-Risk: Save Rate (% that return to healthy status within 60 days). New Accounts: Time to First Value. Passive Subscribers: Self-Serve Conversion Rate. The metric must be measurable with available data and specific to that segment's goal.

### Step 5: Design Segment-Specific Strategies and Actions

A segmentation without differentiated actions is just a labeling exercise. This step produces the playbook -- the specific treatments that will differ by segment.

- **Document the treatment difference for each segment across every major touchpoint:** communication cadence, channel, message tone, product experience, support model, and pricing/commercial treatment. If two segments get the same treatment at every touchpoint, they are operationally the same segment regardless of how they are defined analytically.
- **For CSM-facing segments:** specify the CSM model (dedicated CSM, pooled CSM, digital-only, or self-serve), the touchpoint cadence (weekly, monthly, quarterly business review), and the escalation protocol (what triggers a manager review or a save escalation).
- **For marketing-facing segments:** specify the communication channel (email, in-app message, push notification, direct mail, paid retargeting), the campaign type (lifecycle trigger vs. batch campaign), the sending frequency, and the personalization depth (segment-level messaging vs. individual-level dynamic content).
- **For product-facing segments:** specify which features or onboarding flows are shown or highlighted, whether any gates or limits differ by segment (seat limits, feature access tiers, export caps), and what in-product nudges are triggered.
- **Identify the "moment of truth" for each segment** -- the specific behavioral event or milestone that should trigger a transition to a different segment. For a New Account, it is completing 3 core workflows. For a Champion, it is declining usage below 50% for two consecutive weeks (triggering reclassification to At-Risk). These trigger events must be defined in advance so that the operational system can automate the transition.

### Step 6: Define Segment Transitions and Migration Logic

Static segments are a liability. Customers change behavior, and the segmentation model must reflect that. Migration logic is the governance layer that keeps segments current and prevents misallocation of resources.

- **Define the recalculation cadence** based on the volatility of the primary variable and the operational tolerance for lag. Daily recalculation is appropriate for behavioral signals in SaaS (login frequency, feature usage) where a sudden drop in engagement should trigger an immediate alert. Weekly is appropriate for composite scores. Monthly is appropriate for value-based segments (ARR tier, total spend). Quarterly is appropriate for needs-based or firmographic segments, which change slowly.
- **Define promotion and demotion rules explicitly.** A customer should not bounce between segments due to single-day anomalies (a power user takes a vacation; a new account has a spike in activity on day 3). Apply a smoothing rule: a segment change requires the new criteria to be met for 2 consecutive recalculation periods before the reclassification takes effect. This prevents thrashing.
- **Define the new user default.** Every new account or user must enter a segment immediately, even before behavioral data exists. Typically this is a "New / Onboarding" segment that has a fixed duration (90 days is standard) and transitions to a behavioral classification at the end of the window. Document the exact transition date calculation (sign-up date + 90 days, not "after 90 days of active use").
- **Define alert triggers.** Segment changes should generate notifications in the operational system. At minimum: when an account moves into the At-Risk segment (immediate CSM notification), when a Passive account becomes active (CSM opportunity alert), and when the At-Risk segment exceeds a defined percentage of total accounts (executive dashboard alert, e.g., if At-Risk > 25% of ARR, trigger a churn prevention review).
- **Define segment sunset and merge rules.** Segments that shrink below 2% of the base for two consecutive quarters should be reviewed for elimination or merger. Segments that grow beyond 40% of the base should be reviewed for splitting.

### Step 7: Specify Implementation and Governance

The best segmentation design has zero value if it cannot be implemented and maintained. This step bridges the analytical model and the operational systems.

- **Specify the data source and the SQL or ETL logic** that produces the segment assignment. A segmentation that can only be manually calculated in a spreadsheet will not be recalculated on schedule. Define the table names, field names, and aggregation logic precisely enough that a data engineer can build the pipeline.
- **Specify the storage location.** In a CRM (Salesforce, HubSpot), segment assignment lives on the Account or Contact object as a picklist field. In a product analytics tool, it is an account-level property. In a marketing automation platform, it is a list or a contact attribute used for list segmentation. The segment field must be in the system where the consuming team takes action -- if CSMs work in Salesforce, the segment must be a Salesforce field, not just a data warehouse table.
- **Define the access model.** Who can change segment definitions? Who can override a segment assignment manually? In most organizations, segment definitions are owned by the analytics or data team; manual overrides are permitted for individual accounts but must be logged with a reason and an expiry date.
- **Design the monitoring dashboard.** The minimum monitoring requirement: a weekly view of segment sizes (absolute count and percentage), a segment migration report (how many accounts moved between segments in the last period and in which direction), and a segment-level performance report showing the primary health metric for each segment.
- **Define the model review cadence.** Segment definitions should be reviewed quarterly to confirm that the criteria are still producing meaningfully distinct groups. An annual full model review should assess whether the segmentation method itself still fits the business (e.g., a business that has matured from 200 to 2,000 accounts may need to evolve from a rules-based RFM model to a predictive model).

### Step 8: Sanity-Check the Segmentation Design

Before delivering the final design, run through this checklist to catch the most common design failures.

- **The exclusivity test:** Does every customer belong to exactly one segment? Overlapping criteria produce ambiguous membership and inconsistent treatment. Define tie-breaking rules if a customer meets criteria for two segments (e.g., "Champions criteria take priority over Steady Performers; At-Risk criteria override all others").
- **The exhaustiveness test:** Does every customer in the database fall into exactly one segment? There must be no gap -- accounts that do not meet any criteria should fall into a default segment (typically Passive or Uncategorized) rather than being unclassified.
- **The differentiation test:** List the recommended action for each segment side by side. If any two segments share the same action, merge them or redesign one of them.
- **The measurability test:** For each criterion, confirm that the underlying variable is available in a queryable system, has >85% data completeness, and can be refreshed at the required cadence.
- **The stability test:** Calculate the expected migration rate -- what percentage of accounts are expected to change segments per recalculation period? If more than 30% of accounts change segments week-over-week, the variable thresholds are set too aggressively or the recalculation cadence is too high. Segments should be stable enough that a CSM can build a 30-day plan for their accounts without the account changing categories mid-plan.

---

## Output Format

```
## Segmentation Design: [Descriptive Name]

### 1. Purpose and Scope
- **Business decision informed:** [Specific decision: resource allocation / campaign targeting / product prioritization]
- **Primary consuming team:** [CS / Marketing / Product / Sales / Executive]
- **Segmentation method:** [RFM / Behavioral / Demographic-Firmographic / Needs-Based / Hybrid (specify dimensions)]
- **Total base size:** [Number of customers / users / accounts in scope]
- **Target segment count:** [3-7]
- **Recalculation cadence:** [Daily / Weekly / Monthly / Quarterly]

### 2. Segmentation Variables

| Variable | Definition | Source Table / Field | Completeness | Range / Scale |
|----------|------------|---------------------|--------------|---------------|
| [Variable 1] | [Precise operational definition] | [table.field] | [% complete] | [Min-Max or 1-5 scale] |
| [Variable 2] | [Precise operational definition] | [table.field] | [% complete] | [Min-Max or 1-5 scale] |
| [Variable 3] | [Precise operational definition] | [table.field] | [% complete] | [Min-Max or 1-5 scale] |

### 3. Segment Definitions

#### [Segment Name 1]
- **Criteria:** [Exact boolean / range rules using variable names and thresholds]
- **Tie-breaking priority:** [If multiple segments apply, this segment takes / yields priority]
- **Expected size:** [% of base] (~[absolute count] [accounts/users])
- **Profile:** [3-4 sentence vivid description of a typical member -- behavior, relationship, motivation, risk/opportunity]
- **Strategic goal:** [Activate / Retain / Grow / Expand / Deprioritize]
- **Primary health metric:** [Single metric name and definition]
- **Treatment protocol:**
  - Communication: [Channel, frequency, message type]
  - CSM model: [Dedicated / Pooled / Digital / Self-serve]
  - Product experience: [Features highlighted, flows triggered, limits applied]
  - Commercial: [Upsell triggers, pricing treatment, contract approach]
- **Transition trigger:** [Specific event or threshold that causes reclassification]

#### [Segment Name 2]
[Same structure as above]

[Repeat for all segments]

### 4. Segment Comparison Table

| Segment | Size | [Var 1] | [Var 2] | [Var 3] | Avg [Value Metric] | Churn Risk | Strategic Goal |
|---------|------|---------|---------|---------|--------------------|------------|----------------|
| [Name 1] | [%] (~[n]) | [threshold] | [threshold] | [threshold] | [$X / Score Y] | [Low/Med/High] | [Goal] |
| [Name 2] | [%] (~[n]) | [threshold] | [threshold] | [threshold] | [$X / Score Y] | [Low/Med/High] | [Goal] |
| [Name 3] | [%] (~[n]) | [threshold] | [threshold] | [threshold] | [$X / Score Y] | [Low/Med/High] | [Goal] |

### 5. Migration Rules

| Rule | Definition |
|------|------------|
| Recalculation cadence | [Frequency and timing -- e.g., "Every Monday at 6am UTC based on the prior 7 days of event data"] |
| Smoothing rule | [How many consecutive periods must new criteria be met before reclassification -- e.g., "2 consecutive weekly recalculations"] |
| New user default | [Segment new users/accounts enter immediately upon creation, duration, and transition event] |
| Promotion priority | [Which segment criteria take precedence when a customer qualifies for multiple] |
| Manual override | [Whether allowed, who can do it, expiry rule, logging requirement] |
| Alert triggers | [Which segment transitions generate automated notifications, to whom, and through which system] |

### 6. Implementation Specification

- **Segment field location:** [CRM object and field name / analytics tool account property / database table and column]
- **Data pipeline:** [Source tables, joins, aggregation logic, and output field]
- **Refresh schedule:** [Cron schedule or orchestration tool trigger]
- **Monitoring dashboard:** [Tool, report name, refresh cadence, KPIs tracked per segment]
- **Model review cadence:** [Quarterly threshold check / Annual full model review -- criteria and owner]

### 7. Design Validation Checklist
- [ ] Every customer belongs to exactly one segment (exclusivity confirmed)
- [ ] Every customer in the base is covered by at least one segment (exhaustiveness confirmed)
- [ ] Each segment has a different recommended action (differentiation confirmed)
- [ ] All variables are available with >85% data completeness (measurability confirmed)
- [ ] No two variables have r > 0.7 correlation (multicollinearity checked)
- [ ] Segment sizes are between 3% and 50% of total base (distribution confirmed)
- [ ] Migration rate under stress-test is <30% per recalculation period (stability confirmed)
```

---

## Rules

1. **Never create more than 7 segments.** The constraint is not analytical -- it is operational. Every segment beyond 7 reduces the probability that any segment receives truly differentiated treatment. If the consuming team has fewer people than segments, the model is already over-specified. When a user requests more than 7 segments, push back by asking: "Which two segments will receive exactly the same treatment?" Then merge those.

2. **Every segment must have a different recommended action at every major touchpoint.** Test this by listing all segments in a row and comparing their treatment protocols side by side. If two segments share the same communication channel, frequency, CSM model, and product experience, they are operationally identical and should be merged. Analytical differentiation without operational differentiation produces zero business value.

3. **Segment criteria must be expressed as executable boolean logic.** "Usage score >= 70% AND Health score >= 75 AND ARR > $20,000" is a valid criterion. "High engagement with good account health" is not. Every criterion must be translatable directly into a SQL WHERE clause or a CRM filter rule without interpretation.

4. **Never use demographics or firmographics as the sole segmentation variable for behavioral decisions.** Firmographic attributes (company size, industry) describe what a customer looks like, not what they do or need. A Fortune 500 company in a low-adoption segment requires a different intervention than a 50-person company in the same low-adoption segment -- but the appropriate intervention is driven by the behavioral signal, not the firmographic attribute. Use firmographic data as a secondary overlay or as a stratification variable within behavioral segments, not as the primary axis.

5. **RFM scores must be calculated using quintile assignment, not static thresholds.** Static monetary thresholds ($500 = score 5, $100-499 = score 4) become stale as the customer base grows and average order values shift. Quintile-based scoring (top 20% of spenders in the current period get a 5) remains calibrated to the actual distribution. Recalculate quintile boundaries every time the scoring model runs. Never average the three RFM dimension scores into a single composite number -- the dimensions behave differently and an averaged score like 3.3 is uninterpretable.

6. **Always include a "New / Onboarding" segment for accounts under 90 days old** (or under the product's natural time-to-value window). New accounts do not have stable behavioral patterns and will artificially inflate the At-Risk or Low-Engagement segments if their incomplete data is scored alongside mature accounts. The 90-day threshold is a default -- adjust it to match your product's median time-to-activation. Document the exact calendar date transition, not a rolling "after 90 days of use."

7. **Always flag the Deprioritize segment explicitly and honestly.** Every customer base has a segment where the lifetime value is lower than the cost to serve. Naming it "Deprioritize" instead of burying it in a low tier is a deliberate choice -- it forces the organization to acknowledge the decision and assign a self-serve or automated treatment rather than accidentally allocating CSM time to accounts that will never generate a return. The primary metric for this segment should be cost-to-serve per dollar of ARR, not revenue or engagement.

8. **Apply a smoothing rule to prevent segment thrashing.** Require that a customer meet new segment criteria for 2 consecutive recalculation periods before reclassification takes effect. A power user who misses one week due to a vacation should not trigger an At-Risk alert. A dormant customer who logs in once should not immediately be reclassified as engaged. Thrashing -- rapid oscillation between segments -- destroys trust in the segmentation among the operational teams who use it.

9. **For B2B account segmentation, always apply criteria at the account level, not the user level.** A company may have 50 user licenses, with 5 power users and 45 inactive users. The account-level signal (license utilization rate, feature adoption across the team, total activity volume normalized by seat count) is the correct variable. An account is not at risk because 45 of 50 users logged in once -- it is at risk because the license utilization rate is 10% with a renewal in 45 days.

10. **Never deliver a segmentation design without specifying the storage location and recalculation pipeline.** A segmentation that exists only in a slide deck or a spreadsheet will not be refreshed, will become stale within weeks, and will be abandoned within months. The implementation specification -- the CRM field name, the data pipeline trigger, the monitoring dashboard -- is not optional. If the user does not yet have the infrastructure to implement the design, document the gap explicitly and provide a manual-refresh interim protocol with a specific sunset date.

---

## Edge Cases

### Highly Skewed Base (>50% in One Segment)
If more than 50% of the customer base falls into a single segment after initial criteria definition, the segmentation is under-specified. A segment containing the majority of customers cannot drive differentiated treatment because "most customers" is not a specific audience. Resolution: identify the most differentiating secondary variable within the dominant segment and use it to split the segment into 2-3 sub-segments. For an e-commerce RFM model where 60% of customers are in the "Low-Recency Low-Frequency" bucket, add an average order value threshold to separate low-value-passive (probable one-time buyers) from high-value-dormant (formerly loyal, high-spend customers who have lapsed). The two sub-segments have entirely different reactivation economics and warrant different interventions.

### Small Customer Base (Under 200 Accounts)
Statistical clustering methods (k-means, DBSCAN) are unreliable with small populations -- they produce artifacts that reflect data noise rather than real behavioral patterns. Use a manual rules-based approach with 3-4 segments defined by the 2-3 most observable and consequential variables. For a 150-account B2B SaaS company, a 2x2 matrix of ARR tier (above/below median) by usage health (healthy/at-risk) produces 4 actionable cells. This simple model will outperform a complex clustering model because it is stable, interpretable, and maintainable by a small CS team. Revisit clustering methods when the account base exceeds 500.

### Mixed B2B and B2C Customer Base
Do not create a single segmentation model that attempts to classify both individual consumers and business accounts. The variables, value drivers, and treatment protocols are structurally different. Build two separate segmentations -- one at the individual user level (B2C model, behavioral and demographic variables) and one at the account level (B2B model, firmographic and usage variables). If the same product serves both, create a company-type flag upstream and branch the segmentation logic at that point. A CRM that stores both individual consumers and business accounts must use a record type or custom field to fork the segmentation query.

### Behavioral Data for Features with Seasonal or Event-Driven Usage Spikes
Some features are used heavily at specific times (year-end financial reporting tools, event management software, tax preparation features). If usage frequency is measured over a fixed window, seasonal users will consistently appear in the Low-Engagement segment outside their active season despite being high-value. Resolution: use a rolling 12-month window for frequency calculations rather than a trailing 30 or 90-day window, and supplement with a "last active date" flag to distinguish truly dormant users from seasonally dormant users. For businesses with a well-defined seasonality, maintain a seasonal flag on the account record and suppress the Low-Engagement classification during the known off-season.

### The User Requests a Segmentation That Requires Data Not Yet Collected
When the proposed segmentation method requires behavioral or attitudinal data that does not yet exist (e.g., needs-based segmentation with no survey data, or product engagement segmentation with no event tracking), do not design a phantom segmentation. Instead, deliver a two-phase output: Phase 1 -- an interim segmentation using the best available data (firmographic + limited behavioral proxy signals) with explicit acknowledgment of its limitations; Phase 2 -- the target segmentation design that will be achievable after a specified data collection milestone (e.g., "after 60 days of event tracking instrumentation and a 200-response NPS survey"). Define the instrumentation requirements and the survey questions needed to enable Phase 2 as part of the deliverable.

### Existing Segmentation That Has Become Stale
When a company has an existing segmentation that was designed 2+ years ago and has not been updated, the immediate task is a diagnostic, not a redesign. First, evaluate the existing model: check segment size drift (have the segment proportions shifted significantly?), criterion validity (do the original variable thresholds still produce meaningful differentiation given distribution shifts in the underlying data?), and treatment adherence (are the recommended treatments actually being executed?). If fewer than 30% of accounts have changed segments in 12 months, the model may be overly static -- add a more sensitive trigger variable. If more than 50% of accounts have changed segments in 12 months, the model may be too volatile -- apply smoothing or widen the threshold bands.

### Segmentation for a Marketplace (Buyers and Sellers as Separate Sides)
Two-sided marketplace businesses require two separate segmentation models -- one for the demand side (buyers, subscribers, renters) and one for the supply side (sellers, providers, listers). The variables, value metrics, and strategic goals are different on each side. On the supply side, the value metric is typically GMV generated or listing quality score. On the demand side, it is purchase frequency, basket size, and category breadth. The two segmentations should be linked at the transaction level (a "Champion Buyer" transacting with a "Low-Quality Seller" is a retention risk) but designed and maintained as independent models. Do not attempt to create a unified buyer-seller segment.

### Multi-Product or Multi-Product-Line Business
When a company has distinct product lines with different buyer personas (e.g., a company selling both a self-serve SMB product and an enterprise platform), a single segmentation model applied to the full customer base will produce segments that are internally heterogeneous by product. Build separate segmentations per product line and unify only at the executive level for portfolio views. If a customer uses both products, record their segment in each product's model independently. The enterprise product's champion accounts almost certainly do not look like the self-serve product's champion accounts in any behavioral variable, and treating them with the same model produces false signal.

---

## Example

**Input:** "We have a B2B SaaS company with approximately 1,800 accounts. We sell project management software. Our average ARR is $18K, ranging from $3K (small team plans) to $120K (enterprise). We have product event data (logins, tasks created, projects created, integrations enabled, reports run, seats used out of licensed seats). We have ARR per account and renewal date. The CS team has 8 people. They need to know where to focus: who to upsell, who to save, and who doesn't need attention. Right now they treat all accounts the same and are overwhelmed."

**Output:**

---

## Segmentation Design: Customer Success Account Segmentation -- Project Management SaaS

### 1. Purpose and Scope
- **Business decision informed:** Customer success resource allocation -- determining CSM model, touchpoint cadence, and playbook (upsell, retain, automate, save) per account
- **Primary consuming team:** Customer Success (8 CSMs)
- **Segmentation method:** Hybrid -- Behavioral Usage (primary axis) crossed with ARR Value tier (secondary axis), collapsed into 5 actionable segments
- **Total base size:** 1,800 accounts
- **Target segment count:** 5
- **Recalculation cadence:** Weekly (every Monday, based on trailing 28 days of event data and current ARR)

### 2. Segmentation Variables

| Variable | Definition | Source Table / Field | Completeness | Range / Scale |
|----------|------------|---------------------|--------------|---------------|
| Seat Utilization Rate | (Active users in last 28 days) / (Licensed seats) | accounts.licensed_seats, events.user_id | 99% | 0-100% |
| Feature Adoption Score | Count of distinct feature categories used in last 28 days / 5 total categories (Tasks, Projects, Integrations, Reports, Collaboration) | events.feature_category | 97% | 0-5 (integer) |
| Weekly Active Usage | Average weekly logins per active seat in last 28 days | events.login, accounts.active_seats | 97% | 0-7+ sessions/week/user |
| ARR | Current annualized contract value | contracts.arr | 100% | $3K - $120K |
| Days to Renewal | Calendar days until current contract renewal date | contracts.renewal_date | 100% | 0-365 days |
| Account Age | Days since contract start date | contracts.start_date | 100% | 0-2,000+ days |

**Note on Feature Adoption Score:** The 5 feature categories are Tasks (core), Projects (core), Integrations (advanced), Reports (advanced), and Collaboration/Comments (core). An account using all 5 categories scores 5/5. An account using only Tasks and Projects scores 2/5. This score is a proxy for product depth and is more predictive of retention than raw login count alone.

**Composite Health Score calculation:**
Health Score = (Seat Utilization Rate × 0.4) + (Feature Adoption Score / 5 × 0.35) + (Weekly Active Usage / 7 × 0.25)
Expressed as 0-100. This weighting prioritizes seat utilization as the strongest retention signal, followed by feature breadth, followed by engagement frequency.

### 3. Segment Definitions

---

#### Segment 1: Champions
- **Criteria:** Health Score >= 75 AND ARR >= $20,000 AND Account Age > 90 days
- **Tie-breaking priority:** Champions criteria take priority over Steady Performers. If Health Score drops to 50-74, reclassify as Steady Performer even if ARR qualifies.
- **Expected size:** 14% of base (~252 accounts)
- **Profile:** These are your best accounts -- high ARR, deep product adoption across multiple feature categories, and strong seat utilization indicating the product has spread throughout the team. They are not just renewing; they are building workflows on the platform. Churn risk is low, but the risk of stagnation (no expansion, no advocacy) is real. These accounts are likely your best candidates for case studies and referrals and may have expansion capacity in additional departments or geographies that have not yet been contracted.
- **Strategic goal:** Expand (upsell additional seats, enterprise features, premium add-ons)
- **Primary health metric:** Net Revenue Retention (NRR) -- target >115% for this segment
- **Treatment protocol:**
  - Communication: Dedicated CSM, quarterly business review (QBR) in-person or video, proactive monthly touchpoint, executive sponsor alignment for accounts >$50K ARR
  - CSM model: 1 dedicated CSM per 35-40 Champion accounts; each CSM manages no more than 40 Champions
  - Product experience: Early access to beta features, premium onboarding for new departments, integration consultation
  - Commercial: Proactive expansion proposal when seat utilization exceeds 85% for 4 consecutive weeks; introduce annual pricing with multi-year discount for ARR >$60K accounts
- **Transition trigger:** Health Score drops below 65 for 2 consecutive weekly recalculations → reclassify as Steady Performer or At-Risk depending on score level. Seat utilization drops below 50% → immediate flag to CSM manager.

---

#### Segment 2: Steady Performers
- **Criteria:** Health Score 50-74 AND ARR $10,000-$60,000 AND Account Age > 90 days
- **Tie-breaking priority:** If Health Score drops below 40, At-Risk criteria override Steady Performer regardless of ARR.
- **Expected size:** 32% of base (~576 accounts)
- **Profile:** Mid-market accounts with consistent but not deep product engagement. They are using the core features (Tasks, Projects) but have not adopted advanced capabilities (Integrations, Reports). Seat utilization is moderate -- the product may be used heavily by a small core team while most licensed seats sit idle. These accounts represent the largest pool of potential expansion revenue, because feature adoption nudges that drive breadth will directly increase retention and open upsell conversations. They are satisfied but not enthusiastic -- they would consider alternatives at renewal if a competitor offered a lower price or better onboarding support.
- **Strategic goal:** Grow (increase Feature Adoption Score and seat utilization; create conditions for expansion)
- **Primary health metric:** Feature Adoption Breadth growth rate -- target increase of 0.5 feature categories per quarter per account
- **Treatment protocol:**
  - Communication: Pooled CSM model (1 CSM per 90 Steady Performer accounts); bi-monthly proactive check-in; automated in-product feature adoption nudges triggered by specific usage gaps (e.g., "You haven't tried Integrations yet -- here's how 3 companies in your industry use it")
  - CSM model: Pooled CSM; accounts stratified within pool by ARR (higher ARR accounts within Steady Performers get more frequent touchpoints)
  - Product experience: Feature discovery emails triggered by usage gaps; in-app tooltips for unused advanced features; targeted webinar invitations for Reports and Integrations features
  - Commercial: No proactive upsell until Feature Adoption Score reaches 4/5 or seat utilization reaches 80%; upsell trigger is automated alert to CSM when either threshold is crossed
- **Transition trigger:** Health Score drops below 40 for 2 consecutive recalculations → reclassify as At-Risk with immediate CSM notification. Feature Adoption Score reaches 5/5 AND Health Score reaches 75+ AND ARR >$20K → reclassify as Champion candidate; CSM review to confirm upsell readiness.

---

#### Segment 3: At-Risk
- **Criteria:** Health Score < 40 AND Account Age > 90 days (any ARR tier)
- **Tie-breaking priority:** At-Risk criteria override all other segment criteria. A $100K ARR account with a Health Score of 35 is At-Risk, not a Champion.
- **Expected size:** 18% of base (~324 accounts)
- **Profile:** Accounts showing clear disengagement signals -- seat utilization has dropped, active users are declining, feature usage is narrowing back to core-only or ceasing entirely. For accounts where this has developed over 60+ days, there is likely an internal trigger: a champion has left the company, a competing tool has been trialed, a budget review is underway, or the product failed to deliver value in a specific use case. The diversity of ARR within this segment is wide and should inform the intensity of the save effort -- a $60K ARR at-risk account justifies immediate executive escalation; a $5K ARR at-risk account may not justify more than an automated re-engagement sequence.
- **Strategic goal:** Retain (prevent churn; target save rate of 40% within 60 days)
- **Primary health metric:** Save Rate -- percentage of At-Risk accounts that return to Health Score >=50 within 60 days of entering At-Risk classification
- **Treatment protocol:**
  - Communication: Immediate CSM notification within 24 hours of reclassification; root cause investigation required within 5 business days; custom recovery plan documented in CRM within 10 business days; for ARR >$30K, CS manager must be looped in within 48 hours
  - CSM model: Dedicated intervention CSM for accounts >$30K ARR (pulled from Champion or Steady Performer pool as needed); for accounts <$10K ARR, automated re-engagement sequence before human escalation
  - Product experience: Personalized re-engagement email series from the CSM (not automated marketing email); offer of a free 1-hour optimization session; if champion has left, identify the new internal user and restart onboarding
  - Commercial: Do not initiate pricing or upsell conversations during active save effort; for accounts within 90 days of renewal, involve sales rep for commercial negotiation support
- **Transition trigger:** Health Score reaches 50+ for 2 consecutive recalculations → reclassify as Steady Performer. Health Score remains <40 at renewal → flag for churn probability review; initiate renewal risk protocol.

---

#### Segment 4: New Accounts (Onboarding)
- **Criteria:** Account Age <= 90 days (any ARR, any health score)
- **Tie-breaking priority:** Account Age <= 90 days always assigns to this segment regardless of health score. Do not score new accounts against behavioral thresholds until 90-day mark.
- **Expected size:** 11% of base (~198 accounts) -- assumes ~22 new accounts per month at current growth rate
- **Profile:** Recently contracted accounts still in the value discovery phase. Their behavioral data is incomplete -- low event counts may reflect product setup in progress, not disengagement. These accounts have the highest churn risk at 6-12 months if they fail to reach first value during the onboarding window, but they should not be classified as At-Risk based on incomplete behavioral data. The critical milestone for this segment is completing 3 core workflows (creating first project, assigning tasks to team members, and generating a first report) within 30 days. Accounts that miss this milestone at 30 days are onboarding risk accounts and require an escalated check-in.
- **Strategic goal:** Activate (drive to first value and full team adoption within 90 days)
- **Primary health metric:** Time to First Value -- days from contract start to completion of 3 core workflows (target: median <21 days)
- **Treatment protocol:**
  - Communication: Structured onboarding sequence -- Day 1 welcome and setup call, Day 7 check-in, Day 21 milestone review, Day 45 mid-onboarding health check, Day 75 pre-graduation review; all touchpoints CSM-led for ARR >$15K; automated sequence for ARR <$15K with human escalation triggers
  - CSM model: 1 onboarding CSM manages up to 50 concurrent New Accounts; dedicated onboarding CSM role separate from the ongoing CS pool
  - Product experience: Guided onboarding flow with progress tracker; pre-built templates for common project types in the customer's industry; in-app checklist tied to 3 core workflow milestones
  - Commercial: No upsell conversations during onboarding; introduce expansion conversation only after Day 75 check-in confirms healthy adoption
- **Transition trigger:** Account Age reaches 91 days → automatic reclassification based on current Health Score into Champion, Steady Performer, At-Risk, or Low-Value Passive. Day 30 milestone check: if 3 core workflows not completed → generate onboarding risk alert to CSM.

---

#### Segment 5: Low-Value Passive
- **Criteria:** ARR < $8,000 AND Health Score < 40 AND Account Age > 180 days
- **Tie-breaking priority:** If account meets both At-Risk and Low-Value Passive criteria, Low-Value Passive applies only if ARR < $8,000; higher-ARR at-risk accounts always remain in At-Risk segment.
- **Expected size:** 25% of base (~450 accounts)
- **Profile:** Small-ARR accounts that have been customers for at least 6 months and have settled into low engagement as a stable pattern, not a recent decline. For many of these accounts, the product is likely being used by 1-2 people on a single team despite broader licensing -- they bought a team plan and use it individually. The cost to provide a human-touch CSM experience to this segment exceeds the revenue they generate. They are not worth a save effort at their current ARR, but they are worth an automated re-engagement effort because some subset will either expand organically or respond to low-touch activation nudges.
- **Strategic goal:** Deprioritize (automated support only; no dedicated CSM time; opportunistic self-upgrade)
- **Primary health metric:** Self-serve upgrade rate -- percentage of Low-Value Passive accounts that upgrade to a higher ARR plan without CSM-initiated contact
- **Treatment protocol:**
  - Communication: Automated email sequence only -- monthly product tip emails, quarterly feature announcement digests; no CSM outreach; if account submits support ticket, handle via support queue, not CSM queue
  - CSM model: No dedicated CSM; CS operations team monitors for segment migration signals
  - Product experience: Self-serve help center, in-app tooltips, automated trial of premium features triggered by usage spike; upgrade prompt when seat utilization crosses 70%
  - Commercial: In-app upgrade CTA; automated outreach if any usage signal appears (login after 60+ days of inactivity, new user added to account)
- **Transition trigger:** Health Score rises above 50 for 2 consecutive recalculations → reclassify as Steady Performer and generate CSM assignment notification. ARR increases above $8K (via self-serve upgrade) → immediate reclassification review.

---

###
