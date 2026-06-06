---
name: growth-experiment
description: |
  Produces a structured growth experiment design with hypothesis, metric,
  test method, success criteria, and analysis plan using lean experimentation
  methodology. Use when the user asks to design a growth experiment, test
  a marketing hypothesis, plan an A/B test, structure a growth hack test,
  or validate a growth assumption.
  Do NOT use for full marketing strategy (use marketing-strategy), campaign
  planning (use campaign-planning), or product A/B test design (use
  ab-test-design in product management skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing strategy analysis planning"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Growth Experiment

## When to Use

Use this skill when the user needs to design a rigorous, lean growth experiment with a testable hypothesis, clearly defined metrics, statistical grounding, and a full analysis plan. Specific trigger scenarios:

- User wants to test whether a specific change to a landing page, email flow, onboarding sequence, referral mechanic, or pricing structure will improve a growth metric
- User needs to validate a growth assumption before committing engineering, design, or paid media budget to a full rollout
- User is running a structured growth sprint and needs to prioritize and design experiments from a backlog
- User wants to apply AARRR (Acquisition, Activation, Retention, Revenue, Referral) framework to identify and test a lever in a specific funnel stage
- User has a gut-feel "growth hack" idea and wants to transform it into a testable, repeatable experiment with real success criteria
- User needs to present an experiment brief to a stakeholder, product team, or growth committee for approval
- User wants to instrument a new channel, tactic, or message variation and needs a measurement structure before launching

**Do NOT use when:**
- User needs a full go-to-market or marketing strategy document -- use `marketing-strategy`
- User is planning a multi-channel paid campaign with budget allocation and creative direction -- use `campaign-planning`
- User is designing an in-product feature A/B test with engineering instrumentation and product metrics -- use `ab-test-design` in product management skills
- User wants to analyze results from an already-completed experiment -- use a data analysis skill
- User is asking for SEO, content, or brand strategy recommendations without a specific testable hypothesis -- use the relevant channel strategy skill
- User wants to run a pricing research study with conjoint analysis or willingness-to-pay surveys -- this requires a research methodology skill

---

## Process

### Step 1: Collect Experiment Context

Before writing a single line of the experiment brief, extract the inputs that determine every downstream decision. If the user has not provided these, ask for them explicitly.

- **The specific change being tested:** One concrete, bounded change -- not "improve onboarding" but "add a progress bar to the 4-step onboarding flow." Vague experiments produce vague learnings.
- **AARRR funnel stage:** Identify which stage is being targeted -- Acquisition (new visitors/leads), Activation (first value moment), Retention (repeat engagement or churn reduction), Revenue (conversion to paid, upsell), or Referral (invites, word of mouth). This determines the right primary metric class.
- **Baseline metric:** The current measured rate or value (e.g., "email open rate is 22%", "trial-to-paid conversion is 4.1%", "Day-7 retention is 31%"). Without a baseline, you cannot calculate sample size or detect a meaningful lift.
- **Traffic or audience volume:** Weekly or monthly volume in the population segment being tested. This directly sets the experiment duration.
- **Available resources:** Engineering time (can you split-test, or is this a before/after?), design capacity, and timeline constraints. These determine test feasibility.
- **Risk tolerance:** Is this a low-stakes copy change (low risk) or a pricing or checkout flow change that could depress revenue (high risk)? High-risk experiments require smaller test populations and stop-loss rules.
- **Experiment history:** Has anything similar been tested before? Previous results reduce uncertainty and tighten the hypothesis.

### Step 2: Formulate the Hypothesis

The hypothesis is the intellectual core of the experiment. A weak hypothesis produces an uninterpretable result even if the data is clean.

- **Use the canonical form:** "If we [specific, single change], then [primary metric] will [increase/decrease] from [baseline] to [target] by [end of experiment duration], because [causal mechanism]."
- **The mechanism is mandatory.** The "because" clause forces you to commit to a theory of why the change works. Without a mechanism, you cannot learn anything from a negative result or generalize a positive one.
- **Target a specific, measurable number.** "Conversion rate will increase from 3.2% to 4.0%" is testable. "Conversion rate will improve" is not -- you cannot calculate sample size or define success without a target.
- **Write the null hypothesis explicitly.** The null is the default assumption: no change, no effect. Being explicit about the null forces rigor and prevents post-hoc rationalization of weak results.
- **Check falsifiability.** If the experiment cannot possibly produce data that proves the hypothesis wrong, redesign it. Every hypothesis must have a plausible negative outcome.
- **Common mistake to avoid:** "We believe users want this feature" is not a growth experiment hypothesis -- it is a product discovery hypothesis. A growth experiment hypothesis must target a measurable growth metric (conversion rate, activation rate, LTV, CAC, referral rate).

### Step 3: Define the Experiment Structure

Structure the experiment so that the only variable is the change being tested. Contamination and selection bias are the two most common failure modes at this step.

- **Control group:** The current, unchanged experience. Document it precisely -- take screenshots, export the current email copy, record the current onboarding step count. The control must be reproducible.
- **Variant group (or groups):** The changed experience. Limit to one primary change per experiment. Testing a new headline and a new CTA simultaneously makes it impossible to attribute causation.
- **Randomization method:** Random assignment is the gold standard. For web experiments, use a cookie-based or user-ID-based random split. For email experiments, randomly split the list before sending. For paid acquisition experiments, use geographic or time-based splits when user-level randomization is unavailable -- but document the tradeoff.
- **Population definition:** Define inclusion criteria precisely. "All pricing page visitors" is ambiguous -- specify "all unique visitors to /pricing who have not previously signed up, excluding returning logged-in users." Segment contamination (including users who have already converted) inflates the baseline and masks true lift.
- **Holdout groups:** For retention and revenue experiments, consider a holdout (a group that never sees the new experience) to measure long-term effects, especially when network effects or habit formation are part of the mechanism.
- **Unit of randomization:** Always randomize at the user level (user ID or cookie), not the session level. Session-level randomization allows the same user to see both variants, corrupting the experiment.

### Step 4: Calculate Sample Size and Duration

This step separates rigorous growth experimentation from cargo-cult testing. Undersized experiments waste time and resources; results are uninterpretable.

- **Standard parameters for most growth experiments:** 95% confidence level (alpha = 0.05), 80% statistical power (beta = 0.20), two-tailed test. Use one-tailed test only when you have strong prior evidence that the effect cannot be negative.
- **Minimum Detectable Effect (MDE):** Define the smallest improvement worth implementing. For a pricing page converting at 3.2%, a 0.1% absolute lift (3.1% to 3.2%) may not justify the engineering cost to maintain the variant permanently -- set the MDE at the minimum business-valuable effect (e.g., 0.5% absolute = 15% relative lift).
- **Sample size formula (two-proportion z-test):** For conversion rates, use n = (Z_alpha/2 + Z_beta)² × [p1(1-p1) + p2(1-p2)] / (p1-p2)². At 95% confidence, 80% power: Z_alpha/2 = 1.96, Z_beta = 0.84. Online calculators (Evan Miller's sample size tool is the standard reference) automate this.
- **Practical benchmarks to internalize:**
  - A conversion rate of 3% trying to detect a 20% relative lift (to 3.6%) needs ~5,500 users per group
  - A conversion rate of 10% trying to detect a 15% relative lift (to 11.5%) needs ~3,100 users per group
  - A conversion rate of 30% trying to detect a 10% relative lift (to 33%) needs ~1,700 users per group
  - Email open rates (around 20-25%) detecting a 5% absolute lift need ~600 emails per group
- **Duration calculation:** Divide sample size per group by the weekly volume in that population. Add 10-20% buffer for natural variance. Round up to full weeks to control for day-of-week effects. Never run an experiment for less than 7 days -- weekend vs weekday behavior differences will corrupt results.
- **Business cycle awareness:** If the product has a monthly billing cycle, a weekly sales rhythm, or a seasonal pattern, the experiment must span at least one full cycle to capture representative behavior.

### Step 5: Select the Right Statistical Method

Choosing the wrong statistical test is one of the most common errors in growth experimentation. The test must match the metric type.

- **Binary conversion metrics (signup rate, click-through rate, trial-to-paid rate):** Two-proportion z-test or chi-squared test. These are the most common growth metrics. The test compares the proportion of successes in control vs variant.
- **Continuous metrics (revenue per user, session duration, number of actions):** Two-sample t-test (for normally distributed data) or Mann-Whitney U test (for skewed data, which is very common in revenue metrics). Revenue per user is almost always right-skewed -- default to Mann-Whitney or use a log transformation before applying a t-test.
- **Bayesian A/B testing:** Preferred when you need actionable decisions with smaller sample sizes or when you want to express results as "probability that variant is better" rather than p-values. Tools like VWO, Optimizely, and AB Tasty offer Bayesian modes. Use Bayesian when stakeholders need intuitive probability statements.
- **Sequential testing / always-valid inference:** Use when you cannot predetermine sample size (continuous traffic) and need to peek at results. Methods like the mSPRT (mixture Sequential Probability Ratio Test) control Type I error even with repeated looks. This is the approach used by Spotify, Airbnb, and Netflix for their internal experimentation platforms.
- **For small populations (n < 200 per group):** Fisher's Exact Test for binary metrics. Permutation tests for continuous metrics. Avoid chi-squared, which has poor accuracy at small cell counts.

### Step 6: Define the Analysis Plan Before Launch

The analysis plan must be locked before any data is collected. Writing it afterward -- even with good intentions -- opens the door to p-hacking.

- **Primary metric:** One metric. One. Decide what success looks like before you see the data. If you are measuring multiple metrics, apply a Bonferroni correction (divide alpha by the number of metrics) to control the family-wise error rate.
- **Secondary metrics:** List 3-5 metrics to monitor for unintended effects. These are not decision metrics -- they are guardrail metrics. Example: if the primary metric is signup conversion, guardrail metrics include time-to-first-value, Day-7 retention, and support ticket volume.
- **Segmentation plan:** Pre-specify 2-3 segments to analyze (e.g., new vs returning visitors, mobile vs desktop, paid vs organic traffic). Post-hoc segmentation fishing is a major source of false positives in growth experimentation. Pre-register the segments.
- **No-peeking policy:** Set a fixed end date based on the sample size calculation. Do not analyze results until that date unless a stop-loss condition is triggered. If you must monitor for safety (revenue experiments, trust experiments), use sequential testing methods.
- **Decision framework:** Pre-commit to the four possible outcomes and what you will do in each case: (1) significant positive -- roll out and continue iterating, (2) significant negative -- revert and investigate, (3) inconclusive (underpowered) -- extend experiment or increase traffic, (4) inconclusive (powered but flat) -- file as learned null, do not re-test the same variant.
- **Novelty effect check:** For UX and email experiments, check whether the lift in the first week is higher than subsequent weeks. Novelty effects inflate results for the variant -- sustained lift over 2+ weeks is more credible than a spike in week one.

### Step 7: Apply ICE Prioritization If Multiple Experiments Are in Backlog

Growth teams always have more experiments to run than time to run them. ICE scoring provides a defensible prioritization framework.

- **ICE = Impact × Confidence × Ease**, each scored 1-10.
- **Impact:** How large could the effect be if the hypothesis is correct? Anchor to the metric and the funnel stage. An experiment targeting signup conversion at the top of a funnel with high volume has higher maximum impact than one targeting referral from a small existing user base.
- **Confidence:** How strong is the evidence that this change will work? Prior A/B test results, user research, industry benchmarks, and analogous case studies all increase confidence. A wild guess scores 2-3. A hypothesis supported by user interviews and a competitor's public case study scores 7-8.
- **Ease:** How fast and cheap is this to implement? A copy change on a landing page scores 9-10. A new referral flow requiring backend engineering scores 2-3.
- **ICE threshold for a healthy growth backlog:** Run experiments with ICE >= 4.0. Park experiments with ICE < 3.0 for reconsideration after 2 sprint cycles.
- **Practical use:** If presenting a growth experiment design alongside a backlog, include a mini-ICE scorecard to justify why this experiment is being run now.

### Step 8: Write the Experiment Brief and Risk Plan

The brief is the artifact that aligns the team, prevents scope creep, and creates institutional memory.

- **One-page summary:** Hypothesis, primary metric, sample size, duration, and success criteria. Stakeholders should be able to understand the experiment in 60 seconds.
- **Implementation checklist:** Tag setup in analytics (Google Analytics 4 event, Mixpanel funnel, Segment event), QA check on variant rendering across device types, URL parameter or cookie logic verified, holdout group confirmed.
- **Stop-loss triggers:** For revenue and trust experiments, define an automatic stop condition. Example: "If the variant reduces trial-to-paid conversion below 2.5% (the current 4.1% rate minus a 40% drop) at any point during the experiment, pause immediately and revert."
- **Post-experiment documentation:** Commit to writing a results card regardless of outcome. The results card includes the final metric data, statistical test result, interpretation, and recommended next action. Negative results are as valuable as positive ones -- a null result rules out a class of interventions and prevents future teams from re-testing the same thing.

---

## Output Format

```
## Growth Experiment: [Experiment Name]

**Experiment ID:** [EXP-YYYY-NNN for experiment log tracking]
**Growth Stage:** [Acquisition / Activation / Retention / Revenue / Referral]
**Funnel Position:** [Specific funnel step, e.g., "Pricing page → Signup"]
**Owner:** [Name or role]
**Date Designed:** [Date]
**Planned Launch:** [Date]
**Planned End Date:** [Date]
**Status:** [Designed / Running / Complete / Paused]
**ICE Score:** [Impact: X / Confidence: X / Ease: X / Total: X.X]

---

### Hypothesis

**If** we [specific, single, bounded change -- be precise about placement, copy, mechanic, or flow],
**then** [primary metric] will [increase / decrease] from [current baseline] to [target value] ([relative % change]),
**by** [experiment end date],
**because** [causal mechanism -- the theory of why this change moves the metric].

**Null Hypothesis:** [The change has no measurable effect on [primary metric]. The observed rate will remain within normal variance of the [baseline] baseline.]

**Assumed Mechanism:** [1-2 sentences explaining the behavioral or psychological theory behind the change. E.g., "Social proof from specific customers reduces decision uncertainty at the moment of highest cognitive load, lowering the perceived risk of commitment."]

---

### Experiment Design

| Component | Detail |
|-----------|--------|
| Control | [Current state -- what users experience without the change. Be specific.] |
| Variant | [The single change being tested. Include exact copy, placement, or mechanic.] |
| Primary Metric | [One metric. Include definition: numerator / denominator.] |
| Guardrail Metrics | [2-4 metrics to monitor for unintended harm. Not decision metrics.] |
| Population | [Who is included. Inclusion and exclusion criteria. Funnel stage.] |
| Randomization Unit | [User ID / Cookie / Email subscriber ID -- user-level, not session-level] |
| Traffic Split | [50/50 or stated split with justification for asymmetric splits] |
| Sample Size | [N per group, with method: "2,500/group based on two-proportion z-test, MDE = 0.8% absolute, 95% CI, 80% power"] |
| Duration | [Weeks. Include: daily/weekly volume, calculation, and business cycle check] |
| Confidence Level | [95% (standard) or stated alternative with justification] |
| Statistical Test | [Two-proportion z-test / t-test / Mann-Whitney U / Bayesian / Sequential] |

---

### Minimum Detectable Effect (MDE) Calculation

| Parameter | Value |
|-----------|-------|
| Baseline Rate | [e.g., 3.2%] |
| Target Rate (MDE) | [e.g., 4.0%] |
| Absolute Lift | [e.g., +0.8 percentage points] |
| Relative Lift | [e.g., +25%] |
| Business Justification for MDE | [Why is this the minimum worth implementing? e.g., "At current traffic, each 0.1% lift = 5 additional signups/month. 0.8% lift = 40 signups/month = $X in pipeline at current close rate."] |

---

### Success Criteria

| Outcome | Statistical Condition | Business Condition | Action |
|---------|----------------------|-------------------|--------|
| Positive | p < 0.05 (or P(variant > control) > 95% Bayesian) | Primary metric >= [target] | Roll out to 100% of traffic. Document. Plan follow-on iteration. |
| Marginal Positive | p < 0.05 but effect < MDE | Primary metric between baseline and [target] | Decision meeting: is the effect worth implementation cost? Do not auto-roll-out. |
| Inconclusive -- Underpowered | p >= 0.05, experiment ended early or traffic lower than expected | N/A | Extend experiment by [X weeks] or identify traffic acceleration. |
| Inconclusive -- Null | p >= 0.05, full sample collected | Metric change < 0.2% absolute | File as null result. Hypothesis mechanism disproved. Do not re-test this variant. |
| Negative | p < 0.05 (variant worse than control) | Primary metric < baseline | Revert immediately. Investigate mechanism. Document learnings. |

---

### Stop-Loss Rules

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Revenue / Conversion Drop | [Primary metric falls below baseline - 20% at any point] | Pause experiment, revert variant, convene post-mortem |
| Error Rate Spike | [JavaScript errors or 404s exceed 0.5% of variant sessions] | Pause experiment, fix implementation, restart with clean data |
| Sample Ratio Mismatch | [Actual split deviates from 50/50 by more than 5 percentage points] | Pause. Investigate randomization bug. Do not analyze results until resolved. |

---

### Implementation Plan

| # | Step | Owner | Deadline | Deliverable | Done? |
|---|------|-------|----------|-------------|-------|
| 1 | [Analytics instrumentation -- define events, confirm tracking fires correctly] | [Owner] | [Date] | QA-confirmed event schema |
| 2 | [Variant build -- design and develop the change] | [Owner] | [Date] | Staging environment ready |
| 3 | [QA -- test variant on all target devices and browsers] | [Owner] | [Date] | QA sign-off |
| 4 | [Launch -- enable experiment for defined traffic split] | [Owner] | [Date] | Experiment live, baseline data confirmed |
| 5 | [Mid-point check -- guardrail metrics only, no primary metric peek] | [Owner] | [Date + half duration] | Guardrail status: green / amber / red |
| 6 | [Analysis -- run statistical test, write results card] | [Owner] | [End date + 2 days] | Results card posted to experiment log |
| 7 | [Decision + rollout / revert] | [Owner] | [End date + 5 days] | Implementation decision documented |

---

### Risk Register

| Risk | Probability | Impact | Prevention | Response |
|------|-------------|--------|-----------|----------|
| [Sample ratio mismatch due to cookie deletion] | Medium | High (invalidates results) | Verify randomization logic in QA; monitor split ratio daily | Pause, debug, restart |
| [Novelty effect inflates early results] | Medium | Medium (false positive) | Run experiment for minimum 2 full weeks | Do not call results early; check week-over-week trend |
| [External event contaminates results (product launch, PR hit)] | Low | High | Note all external events in experiment log | Segment out affected time period if large enough; extend experiment |
| [Variant negatively affects a segment not in the primary metric] | Low | High | Monitor guardrail metrics; segment results by user type | Stop-loss if guardrail triggers |

---

### Analysis Plan

**Primary Statistical Test:** [Method and tool -- e.g., "Two-proportion z-test using Python scipy.stats.proportions_ztest or Evan Miller's A/B testing calculator"]
**Significance Threshold:** alpha = 0.05 (p < 0.05 required for positive decision)
**Power:** 80% (beta = 0.20)
**Test Type:** [Two-tailed (default) or one-tailed with justification]

**Pre-registered Segments for Analysis:**
1. [e.g., New visitors vs returning visitors]
2. [e.g., Mobile vs desktop]
3. [e.g., Organic vs paid traffic source]

**Guardrail Metric Thresholds:**
- [Guardrail 1]: Alert if [metric] changes by more than [threshold] in the variant
- [Guardrail 2]: Alert if [metric] changes by more than [threshold] in the variant

**Peeking Policy:** Results will not be analyzed before [end date]. The only exception is a stop-loss trigger. If you check results early, you must apply a Bonferroni correction (divide alpha by number of peeks) or use sequential testing methods.

**Novelty Effect Check:** Compare week 1 conversion rate vs weeks 2+ in the variant. If week 1 is more than 20% higher than subsequent weeks, flag as potential novelty effect and extend experiment.

**Results Documentation:** Complete a results card within 48 hours of experiment end, regardless of outcome. File in [experiment log location].

---

### Results Card (to be completed post-experiment)

| Field | Value |
|-------|-------|
| Final Control Rate | [X%] |
| Final Variant Rate | [X%] |
| Absolute Lift | [+/- X percentage points] |
| Relative Lift | [+/- X%] |
| p-value | [X.XX] |
| Statistical Significance | [Yes / No] |
| Sample Size Achieved | [N per group] |
| Guardrail Metrics Status | [All green / Amber: describe / Red: describe] |
| Decision | [Roll out / Revert / Extend / Null] |
| Key Learning | [1-2 sentences on what this result tells you about the mechanism] |
| Next Experiment | [What to test next based on this result] |
```

---

## Rules

1. **The hypothesis must contain a mechanism.** A prediction without a causal theory ("adding testimonials will increase conversion because social proof reduces purchase anxiety") is a hypothesis. A prediction without a mechanism ("adding testimonials will increase conversion") is a wish. Without a mechanism, a negative result teaches you nothing and a positive result cannot be generalized.

2. **Set success criteria before the experiment launches -- never after.** Post-hoc success criteria are p-hacking by another name. If you define success as "any statistically significant improvement" after seeing results, you will find something to celebrate in noise. The MDE and decision thresholds must be documented and agreed upon before any data is collected.

3. **Calculate sample size for every experiment, even rough ones.** An experiment that ends with 200 users per group when the MDE required 2,000 per group is not an experiment -- it is anecdote. If you cannot reach statistical significance, either acknowledge the weaker evidence level explicitly or extend the timeline until you can.

4. **Randomize at the user level, not the session level.** Session-level randomization allows the same user to see both control and variant, which violates the independence assumption of every standard statistical test and biases results toward the null. Always use user ID or persistent cookie for the randomization unit.

5. **Watch for the sample ratio mismatch (SRM).** If your 50/50 split produces 3,000 users in control and 2,200 in variant, your randomization is broken -- something is systematically routing users differently between the groups. An SRM invalidates the experiment. Check the actual split ratio within the first 24-48 hours and do not analyze results from an SRM-corrupted experiment.

6. **Run every experiment for at least 7 full days.** Day-of-week behavior patterns (weekday vs weekend intent, B2B Monday peak, consumer Friday engagement) will corrupt experiments shorter than 7 days. Experiments running over monthly boundaries should account for billing cycle effects. Two full weeks is the practical minimum for most growth experiments.

7. **One primary metric per experiment.** If you measure 10 metrics and call whichever one reaches significance a win, you are running 10 experiments with a 5% false positive rate each -- the probability of at least one false positive is 40%. If you must measure multiple outcomes, apply Bonferroni correction (alpha / number of tests) or pre-register a clear primary metric hierarchy.

8. **Do not run overlapping experiments on the same population without mutual exclusion or interaction analysis.** Two experiments running concurrently on the same users contaminate each other. If experiment A changes the email subject line and experiment B changes the email CTA at the same time, and both show lift, you cannot attribute which variable drove what. Use a testing platform with mutual exclusion support or run experiments sequentially on the same population.

9. **Revenue and pricing experiments require a stop-loss trigger and a smaller initial rollout.** A bad pricing experiment can destroy days or weeks of revenue. Set an automatic stop condition before launch (e.g., "if trial-to-paid conversion drops below 2.5% in the variant at any point, pause immediately") and start with 10-20% of traffic in the variant rather than 50%.

10. **Document every result -- especially null and negative results.** The most expensive growth mistake is re-testing a hypothesis that has already been tested and failed. A searchable experiment log with results cards for every experiment (positive, null, negative) is the primary asset of a mature growth function. Over 24 months, a team running 2-3 experiments per week accumulates 150-200 results -- this is a competitive advantage only if it is searchable and readable.

---

## Edge Cases

### Small User Base (Under 1,000 Monthly Users in the Target Funnel Segment)

Statistical significance is unreachable in reasonable timeframes. Do not pretend otherwise. Instead: set a practical significance threshold based on the minimum effect size that would change a business decision (e.g., "if conversion doubles from 5% to 10%, we invest; if it doesn't, we don't"). Run the experiment for a fixed period (typically 4-8 weeks), report the observed effect and confidence interval, and be explicit that the result is directional rather than conclusive. Supplement quantitative data with 5-10 user interviews and session recording analysis (tools like FullStory or Hotjar). Treat the result as a strong hypothesis to re-test at larger scale, not a decision-ready finding.

### No Engineering Resources for A/B Testing (Before/After or Geographic Split)

A concurrent randomized controlled trial is the gold standard. If it is unavailable, use the strongest feasible design and document the limitation explicitly. For before/after tests: choose a baseline period that matches the test period in length, seasonality, and external conditions. Control for known confounders (e.g., if a product launch happened mid-baseline, exclude that window). For geographic splits (e.g., run the experiment in one city or country, use another as control): confirm the populations are comparable on key dimensions (demographics, product maturity, pricing). Label the resulting evidence as "quasi-experimental" and recommend a proper RCT when resources allow.

### Retention Experiments (Long Time Horizon Required for True Measurement)

True retention effects often take 30-90 days to materialize, which is incompatible with weekly sprint cycles. Solution: identify a leading indicator metric that is both faster to measure and validated as predictive of long-term retention. Common validated leading indicators include: Feature X used within first 7 days predicting 30-day retention (the "activation metric"), number of connections or content items created in week 1 predicting 90-day retention, and email engagement in the first 2 weeks predicting subscription renewal. Use the leading indicator as the primary metric for speed, but commit to measuring the actual retention outcome at the full horizon and updating the results card. Never close a retention experiment loop without eventually measuring the metric you actually care about.

### Pricing Experiments

The most risk-laden category of growth experiment. A 20% increase in pricing that reduces conversion by 30% is not just a failed experiment -- it is lost revenue for the duration of the test. Mandatory constraints: (1) Limit variant exposure to 10-20% of new users (never existing customers); (2) Set a hard stop-loss threshold before launch; (3) Never show different prices to users who might compare notes (support forums, communities, B2B buying teams); (4) Ensure legal and compliance review if your pricing experiment involves different prices for protected classes of users. Measure not just conversion rate but revenue per visitor and LTV. A variant that converts fewer users but at higher price may be net positive -- you need revenue metrics, not just conversion metrics.

### Experiment Contamination from External Events

A product launch, a viral PR event, a competitor's announcement, or a paid campaign spike during the experiment period can contaminate results by changing the composition of the audience or the baseline intent level. Prevention: log all external events in the experiment record from day one. Detection: monitor the control group's primary metric daily -- if the control group's rate changes significantly mid-experiment, something external has happened. Response: if the contamination is time-bounded (e.g., a 3-day PR spike), segment out the affected period and re-run the analysis on the clean window. If contamination is pervasive, extend the experiment until you have a clean equivalent period in both arms.

### Multi-Variant Experiments (Testing 3+ Variants Simultaneously)

Testing multiple variants (e.g., three different CTA copy options against a control) is tempting because it seems efficient. The statistical cost is real: with 4 groups (1 control + 3 variants), you need 4x the total sample size and must apply multiple comparison corrections. For growth experiments, limit to 1-2 variants unless you have a specific reason (e.g., you are testing categorically different approaches and have the traffic to support it). If you run 3+ variants, use a false discovery rate (FDR) correction method like the Benjamini-Hochberg procedure rather than Bonferroni, which is overly conservative for multiple comparisons. Pre-specify which variant you will roll out if multiple variants beat control -- do not pick the winner opportunistically after seeing data.

### Experiments with Network Effects or Viral Mechanics

If the experiment tests a referral mechanic, a social sharing feature, or any viral loop, standard user-level randomization breaks down because the treatment effect on one user spills over to others in the same network. A user in the control group who receives an invite from a user in the variant group is contaminated. This is the interference problem, also called SUTVA (Stable Unit Treatment Value Assumption) violation. Solutions include: cluster randomization (randomize by social graph cluster or geographic market, not individual user), ego-network analysis, or switchback experiments (time-based, not user-based randomization). Acknowledge the limitation explicitly if none of these approaches is feasible and interpret results as lower bounds on the true effect.

---

## Example

**Input:** "We run a B2B SaaS product for project management. We want to test whether adding an in-app tooltip prompt during the onboarding flow -- specifically on the 'Create your first project' step -- will improve our Week-1 activation rate. Currently, only 38% of new signups create a first project within 7 days. We get about 800 new signups per month. The team can implement this in a week."

---

**Output:**

## Growth Experiment: In-App Tooltip on 'Create First Project' Step

**Experiment ID:** EXP-2024-017
**Growth Stage:** Activation -- First Value Moment (Signup → First Project Created Within 7 Days)
**Funnel Position:** Onboarding Step 3 "Create Your First Project" → Day-7 Activation
**Owner:** Growth Lead
**Date Designed:** [Today]
**Planned Launch:** [Today + 7 days (implementation window)]
**Planned End Date:** [Launch date + 35 days]
**Status:** Designed
**ICE Score:** Impact: 8 / Confidence: 7 / Ease: 8 / Total: 7.7

---

### Hypothesis

**If** we add a contextual tooltip on the "Create Your First Project" onboarding step that displays a pre-filled project template with three example tasks and a one-click "Start with this template" button,
**then** the percentage of new signups who create at least one project within 7 days of signup (Week-1 activation rate) will increase from 38% to 46% or higher (+8 percentage points absolute, +21% relative improvement),
**by** the end of a 35-day experiment window,
**because** the primary barrier to first project creation is the blank-canvas problem -- new users do not know where to start, experience decision paralysis when faced with an empty project view, and abandon before experiencing the core value of the product. A pre-filled template with realistic content reduces this friction by giving users a concrete starting point that requires only minimal customization rather than a creation effort from scratch.

**Null Hypothesis:** Adding a tooltip with a pre-filled template has no measurable effect on Week-1 activation rate. The observed activation rate in the variant group will remain within normal variance of the 38% baseline.

**Assumed Mechanism:** Activation failures at this step are predominantly effort-and-uncertainty driven, not motivation driven. Users who reach "Create First Project" have already committed to trying the product -- the dropout is caused by implementation friction, not intent. A template lowers the effort threshold from "create something meaningful" to "edit something that already exists," which is a well-established cognitive load reduction technique.

---

### Experiment Design

| Component | Detail |
|-----------|--------|
| Control | Current onboarding flow: "Create Your First Project" step shows an empty project name field and an empty task list with placeholder text "Add your first task..." |
| Variant | Same step with an added tooltip that appears automatically on page load, displaying a pre-filled project template named "Website Relaunch" with 3 example tasks and a blue "Start with this template" button. Tooltip is dismissable with an "I'll start from scratch" link. |
| Primary Metric | Week-1 activation rate: % of new signups who create at least one project containing at least one task within 7 days of signup (unique users who complete action / unique users who signed up in the experiment period) |
| Guardrail Metrics | (1) Day-30 retention rate -- ensure activated users retain at the same or higher rate; (2) Time-to-first-project (median, in hours) -- variant should reduce this; (3) Support ticket volume tagged "onboarding" -- should not increase; (4) Project deletion rate within 48 hours -- ensure template projects are not immediately discarded |
| Population | All new user signups (first-time accounts, not re-registrations). Exclude users invited to an existing workspace -- they have a different onboarding context. |
| Randomization Unit | User ID (assigned at account creation, persists across sessions and devices) |
| Traffic Split | 50/50 (400 users/month per group) |
| Sample Size | 1,580 users per group (3,160 total). Calculation: two-proportion z-test, baseline p1 = 0.38, target p2 = 0.46, alpha = 0.05 (two-tailed), power = 80%. |
| Duration | 35 days (~4.4 weeks at 720 qualified signups/month after exclusions, targeting 1,600+ per group at 50/50 split -- slightly over the minimum, which is intentional to ensure the full sample) |
| Confidence Level | 95% (alpha = 0.05) |
| Statistical Test | Two-proportion z-test (binary outcome: activated / not activated). Python: scipy.stats.proportions_ztest or Evan Miller's A/B testing calculator. |

---

### Minimum Detectable Effect (MDE) Calculation

| Parameter | Value |
|-----------|-------|
| Baseline Activation Rate | 38.0% |
| Target Activation Rate | 46.0% |
| Absolute Lift | +8.0 percentage points |
| Relative Lift | +21.1% |
| Business Justification for MDE | At 800 signups/month, each percentage point of activation lift = 8 additional activated users/month. An 8pp lift = 64 more activated users/month. At current trial-to-paid rates of 22%, this translates to ~14 additional paid conversions/month. At $149 MRR average, that is ~$2,100 MRR uplift per month. A 4pp lift (half the MDE) would add ~7 paid conversions/month = ~$1,050 MRR. The engineering cost to maintain the tooltip is minimal (no ongoing maintenance), so 4pp is likely the actual business minimum -- but we are targeting 8pp as a conservative MDE that is supported by the mechanism theory. |

---

### Success Criteria

| Outcome | Statistical Condition | Business Condition | Action |
|---------|----------------------|-------------------|--------|
| Positive | p < 0.05 (two-tailed), variant rate >= 46% | Activation rate increases by >= 8pp | Roll out tooltip to 100% of new users. Add variant to onboarding as permanent default. Design follow-on experiment: test 3 different template types (by industry vertical). |
| Marginal Positive | p < 0.05, variant rate between 42-45.9% | 4-8pp lift, statistically significant | Convene growth team decision meeting. Quantify incremental MRR impact. Consider rollout if implementation cost remains low. |
| Inconclusive -- Underpowered | p >= 0.05, but fewer than 1,580 users reached per group | N/A | Extend experiment by 2 weeks. Do not analyze until full sample is collected. |
| Inconclusive -- Null | p >= 0.05, full sample collected, < 2pp absolute difference | Effect < 2pp | File as null result. The template tooltip mechanic does not address the blank-canvas barrier at this step. Re-examine the mechanism assumption. Design a user interview study to identify the actual activation barrier. |
| Negative | p < 0.05, variant rate < 38% | Activation rate decreases significantly | Revert immediately. Hypothesize: tooltip may be perceived as intrusive or the template (website project) may not be relevant to enough users. Investigate via session recordings in the variant group. |

---

### Stop-Loss Rules

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Primary Metric Drop | Variant activation rate falls below 30% (8pp below baseline) at any point after Day 7 | Pause experiment, revert variant, conduct post-mortem |
| Support Ticket Spike | Onboarding-tagged tickets increase by more than 25% vs baseline in the variant group | Pause, investigate tooltip implementation, fix and restart |
| Sample Ratio Mismatch | Actual split deviates from 50/50 by more than 5pp (e.g., 55/45 or worse) | Pause immediately, debug randomization logic, do not analyze results from the corrupted period |
| Project Deletion Rate | More than 60% of template-started projects are deleted within 48 hours | Flag for review -- suggests template is creating low-quality activation that will not convert to retained users |

---

### Implementation Plan

| # | Step | Owner | Deadline | Deliverable | Done? |
|---|------|-------|----------|-------------|-------|
| 1 | Define tooltip content: finalize template name, 3 task descriptions, button copy | Product + Growth | Day 2 | Approved copy and design spec |
| 2 | Instrument analytics events: "tooltip_displayed", "template_adopted", "project_created_from_template", "tooltip_dismissed" in Segment | Engineering | Day 4 | Event schema live in staging |
| 3 | Build tooltip variant, implement user-level randomization via feature flag (LaunchDarkly or equivalent) | Engineering | Day 6 | Variant live in staging environment |
| 4 | QA: test variant on Chrome, Safari, Firefox (desktop + mobile), verify event firing, verify 50/50 split ratio | QA + Growth | Day 7 | QA sign-off document |
| 5 | Launch experiment, confirm baseline data flowing, check split ratio after 200 users | Growth | Day 8 | Experiment live; split ratio confirmed 50/50 |
| 6 | Mid-point guardrail check (Day 25): review guardrail metrics only -- do not look at primary metric | Growth | Day 25 | Guardrail status report: green/amber/red |
| 7 | Final analysis (Day 43 = end date + 2 days): run z-test, calculate confidence interval, document result | Growth | Day 43 | Results card completed and posted to experiment log |
| 8 | Decision and rollout or revert (by Day 47) | Growth + Product | Day 47 | Implementation decision documented; next experiment designed |

---

### Risk Register

| Risk | Probability | Impact | Prevention | Response |
|------|-------------|--------|-----------|----------|
| Tooltip template ("Website Relaunch") is irrelevant to majority of users (developers, finance teams, etc.) | Medium | Medium -- reduces signal strength, may suppress effect even if mechanic is sound | Consider a generic template name like "Q4 Planning" with neutral task types; or show the tooltip without a specific template name | If null result: segment by user job title or company size to check if effect exists for a subgroup |
| Novelty effect inflates week-1 results | Low-Medium | Medium -- could produce false positive that fades post-rollout | Run experiment for minimum 5 full weeks to observe trend | Check week-over-week activation rates in the variant; flag if week 1 rate is >20% higher than weeks 2-5 |
| Feature flag service outage causes uneven rollout | Low | High -- SRM and data corruption | Monitor split ratio daily for first week | Pause experiment, restore correct split, restart with clean user cohorts |
| Activated users from template have lower Day-30 retention (low-quality activation) | Low | High -- a dangerous false positive at the activation stage | Monitor Day-30 retention as guardrail metric | If Day-30 retention in variant drops >5pp vs control: do not roll out despite activation lift; the mechanic creates hollow activations |

---

### Analysis Plan

**Primary Statistical Test:** Two-proportion z-test. Implementation: `scipy.stats.proportions_ztest([activated_variant, activated_control], [n_variant, n_control], alternative='two-sided')`. Alternatively, use Evan Miller's A/B testing calculator with the same inputs.

**Significance Threshold:** alpha = 0.05 (p < 0.05 required for a positive decision). No alpha adjustment required -- there is a single pre-registered primary metric.

**Power:** 80% (sample size calculated to detect the MDE with 80% probability if the true effect equals the MDE).

**Test Type:** Two-tailed. We do not have strong prior evidence that the effect cannot be negative -- a confusing or irrelevant tooltip could plausibly hurt activation.

**Pre-registered Segments for Analysis:**
1. Self-reported job function at signup (Product/PM vs Engineering vs Marketing vs Other) -- tooltip relevance likely varies by role
2. Traffic source (organic search vs paid vs direct) -- user intent differs by channel and may moderate the tooltip effect
3. Mobile vs desktop at time of onboarding step -- tooltip rendering and interaction differ significantly across devices

**Guardrail Metric Thresholds:**
- Day-30 retention: Alert if variant rate drops more than 5pp below control
- Time-to-first-project: Alert if variant median does not decrease vs control (if the tooltip is not reducing friction at all, something is wrong)
- Support tickets (onboarding tag): Alert if variant volume increases more than 25% vs control rate

**Peeking Policy:** The primary metric (Week-1 activation rate) will not be examined until Day 43 (end date + 2 days for final cohort to complete their 7-day window). The mid-point check on Day 25 covers guardrail metrics only. If you must examine primary metric data for a stop-loss trigger, apply the O'Brien-Fleming correction: alpha = 0.005 at mid-point, 0.048 at final analysis.

**Novelty Effect Check:** Compare average daily activation rate in the variant for Days 1-7 vs Days 15-22. If the first 7-day period shows a rate more than 20% higher than the second, flag as a potential novelty effect and extend analysis window to 49 days.

**Results Documentation:** Results card to be completed within 48 hours of experiment end (Day 43). Post to the growth experiment log under tag: Activation / Onboarding / In-App Prompts. Tag with null/positive/negative outcome for future searchability.

---

### Results Card (to be completed post-experiment)

| Field | Value |
|-------|-------|
| Final Control Rate | [TBD] |
| Final Variant Rate | [TBD] |
| Absolute Lift | [TBD] |
| Relative Lift | [TBD] |
| p-value | [TBD] |
| Statistical Significance | [TBD] |
| Sample Size Achieved | [TBD per group] |
| Guardrail Metrics Status | [TBD] |
| Decision | [TBD] |
| Key Learning | If positive: template-based prompts lower the blank-canvas friction at the first-project step. If null: the barrier to first project creation is not effort-based; investigate whether it is motivational (user does not understand why to create a project) or navigational (user cannot find the step). |
| Next Experiment | If positive: test 3 industry-specific templates (Software Development, Marketing Campaign, Event Planning) vs single generic template. If null: test a guided walkthrough video (30 seconds) vs tooltip at the same step. |
