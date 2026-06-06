---
name: ab-test-design
description: |
  Designs A/B tests with hypothesis, control and variant definitions, primary metric, sample size calculation, test duration, and analysis plan using experimentation methodology. Use when the user asks about A/B testing, experiment design, split testing, hypothesis testing, or controlled experiments.
  Do NOT use for statistical analysis of completed tests (use a statistics skill), survey design (use employee-survey or user-research-plan), or feature prioritization (use prioritization-framework).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis research strategy planning decision-making"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# A/B Test Design

## When to Use

**Use this skill when:**
- A user wants to design a controlled experiment before shipping a product change -- including UI changes, copy changes, pricing changes, onboarding flow changes, algorithm changes, or notification strategies
- A user needs to validate a product hypothesis with statistical rigor before committing engineering resources to a full rollout
- A user asks about sample size calculation, test duration estimation, or minimum detectable effect selection for a split test
- A user wants to compare two versions of an experience and needs a structured framework for control/variant definition, metric selection, and analysis pre-registration
- A user needs to decide between two competing product directions using behavioral data rather than opinion or intuition
- A user is setting up experimentation infrastructure and needs to understand the methodology behind traffic allocation, assignment mechanisms, and guardrail monitoring
- A user wants to run a holdout test, a switchback test, or a geo-based experiment and needs guidance on the appropriate variant of experimentation methodology

**Do NOT use this skill when:**
- The user wants to analyze results from a test that has already run -- use a statistical analysis skill instead (t-tests, chi-squared, Mann-Whitney U, Bayesian posterior analysis)
- The user needs to design a survey to collect attitudinal or qualitative data -- use `employee-survey` or `user-research-plan`
- The user wants to rank or prioritize a backlog of features without testing -- use `prioritization-framework`
- The user explicitly needs a multivariate test (MVT) with 3+ factors varying simultaneously -- MVT requires fractional factorial design, interaction effect modeling, and Taguchi methods that differ substantially from two-variant A/B methodology
- The user is asking about causal inference from observational data without randomization -- that requires difference-in-differences, regression discontinuity, or instrumental variable methods
- The user wants to test a change that cannot be isolated to a single variable (e.g., a full redesign touching layout, copy, and navigation simultaneously) -- recommend a sequential rollout or phased testing strategy instead
- The user needs to interpret p-values or confidence intervals from existing results -- that is statistical output interpretation, not experiment design

---

## Process

### Step 1: Clarify the Business Question and Change Hypothesis

Before writing anything, extract the minimum required inputs from the user. Do not proceed to design without understanding these fundamentals.

- **What is the specific change being made?** Get surgical precision: "Change the H1 from 'Powerful analytics for your business' to 'See what's working in your business'" is actionable. "Improve the homepage" is not.
- **What is the current state (control)?** This must be the existing production experience, not an idealized baseline. If the user cannot describe the control precisely, the test cannot be designed.
- **Why does the team believe this change will work?** The reasoning should connect to a specific user behavioral theory -- cognitive load reduction, loss aversion framing, social proof activation, friction removal. If the team cannot articulate why, the test is exploratory (still valid, but hypothesis must reflect that).
- **What is the unit of diversion?** This determines the randomization level: user-level (by user ID), session-level, device-level, or geo-level. User-level is default for most product experiments. Session-level is only appropriate for anonymous traffic where personalization is not possible, but it introduces carry-over contamination risk.
- **What is the eligible population?** Not all users should be in the experiment. Identify who is eligible: new users only, logged-in users only, users who have reached a specific page, users on a specific platform (iOS vs. Android vs. web). Sample size is calculated against the eligible daily traffic, not total daily users.
- **Are there any hard constraints?** Regulatory restrictions, seasonal events (Black Friday, year-end), contractual obligations, or in-flight engineering changes that make a clean test impossible.

---

### Step 2: Write a Falsifiable, Directional Hypothesis

The hypothesis is not a wish. It is a structured prediction that can be proven false.

- **Use the If-Then-Because structure without exception:**
  - **If** [specific, singular change to the experience]
  - **Then** [named metric] will [increase/decrease] by [X% relative or X percentage points absolute]
  - **Because** [behavioral mechanism that connects the change to the outcome]
- **The quantified prediction (the "by X%") serves as the Minimum Detectable Effect (MDE).** If the team says "we expect a 20% lift," that sets the MDE. If the team says "we just want to see any improvement," default to a 5% relative MDE for high-volume metrics and 10-15% for low-volume metrics, and explain the trade-off.
- **Do not use vague outcome language.** "Users will prefer the new design" is not a hypothesis. "7-day retention rate among new users will increase by 8% relative (from 25.0% to 27.0%)" is.
- **Classify hypothesis type:**
  - **Optimization hypothesis:** "This specific change improves a known metric by X." High confidence, well-reasoned, narrow change.
  - **Exploratory hypothesis:** "We predict a directional positive effect but are uncertain about magnitude." Set a smaller MDE and plan to learn rather than strictly ship/no-ship.
  - **Defensive hypothesis:** "This change will not harm our primary metric." When making a change for technical or regulatory reasons, the test is a guardrail check rather than a lift test.
- **Pre-commit to directionality.** If the hypothesis is directional (variant will be better), use a one-tailed test, which has more power but cannot detect unexpected negative effects. If there is genuine uncertainty about direction, use a two-tailed test. For product experiments, two-tailed tests are almost always the right default -- they detect harmful regressions.

---

### Step 3: Define Control and Variant with Surgical Precision

Ambiguous variant definitions are the single most common source of test failure in practice.

- **Document the control as the exact production state on the day the test design is written.** If the production experience changes during the test, the test is contaminated. Lock the control specification.
- **Change exactly one variable between control and variant.** This is not a stylistic preference -- it is the logical precondition for causal attribution. If the button copy changes AND the button color changes, you cannot determine which drove the effect.
- **For UI changes:** Provide or request a screenshot, Figma link, or component-level specification. "The button says 'Get Started'" is insufficient. Document: text, font weight, color hex code, size in px, placement relative to page elements, and any surrounding context that differs.
- **For algorithm or ranking changes:** Specify the exact parameter change (e.g., "personalization model weights increased from 0.3 to 0.5 for recency signal"), the fallback behavior if the model fails, and whether users in the control group receive the old model output or a static baseline.
- **For pricing or packaging changes:** Document the exact pricing displayed, any asterisks or fine print, the checkout flow downstream of the pricing page, and whether the discount or price difference is persistent through the funnel or only on the first screen.
- **For email or notification experiments:** Document the exact subject line, preview text, send time, sender name, and whether the experiment is on open rate (subject line variable only) or click rate (body content variable) or downstream conversion (full funnel).
- **Explicitly list what does NOT change.** This prevents implementation drift. "The following elements are identical in both variants: button color (#2563EB), button size (48px height), surrounding copy, page layout, header, footer, and all other interactive elements."

---

### Step 4: Select Primary Metric, Secondary Metrics, and Guardrail Metrics

Metric selection is a design choice with major consequences. Getting this wrong invalidates the entire experiment.

- **Primary metric rules:**
  - There is exactly one primary metric. One. Pre-registering multiple primary metrics requires a Bonferroni correction that dramatically reduces power.
  - The primary metric must be directly observable within the test duration -- a metric that takes 90 days to manifest cannot be primary for a 3-week test.
  - The primary metric must be causally connected to the change being made. If the change is on the pricing page, the primary metric should be trial signups, not 30-day revenue (which is too distant and high-variance).
  - Prefer rate metrics over absolute count metrics for primary. "Signup conversion rate" is better than "total signups" because it normalizes for traffic fluctuations.

- **Primary metric hierarchy by test type:**
  - Landing page / CTA changes → conversion rate (visits-to-action)
  - Onboarding flow changes → activation rate (users completing key setup step), day-1 or day-3 retention
  - In-product feature changes → feature adoption rate, task completion rate, engagement depth (sessions per user, actions per session)
  - Search or recommendation algorithm changes → click-through rate (CTR), NDCG (normalized discounted cumulative gain) if ranking quality matters, dwell time
  - Pricing or packaging changes → trial-to-paid conversion rate, average revenue per user (ARPU), or plan selection distribution
  - Email or push notification changes → click rate (not open rate -- open rate is unreliable post-iOS Mail Privacy Protection), downstream conversion

- **Secondary metrics:** 2-4 supporting metrics that provide mechanistic understanding. If signup rate goes up, does activation rate also go up, or did we attract lower-quality signups? Secondary metrics answer that question.

- **Guardrail metrics:** These are hard stops. Define a threshold for each:
  - Page load time: must not increase by more than 200ms (P95 latency)
  - Error rate: must not increase by more than 0.5 percentage points
  - Core downstream funnel: the next conversion step must not decrease by more than 2% relative
  - Customer support tickets or complaint rate: must not increase
  - Revenue per user: even if not the primary metric, must not decrease significantly
  - Guardrail violations trigger an immediate test pause regardless of primary metric performance.

- **Avoid vanity metrics as primary:** Page views, raw visit counts, and "engagement" without definition are not primary metrics. They can be secondary.

- **For tests where the primary metric has high variance (revenue, order value):** Use a variance-reduction technique such as CUPED (Controlled-experiment Using Pre-Experiment Data), which uses pre-experiment baseline data for each user as a covariate to reduce variance by 30-70%, dramatically reducing required sample size.

---

### Step 5: Calculate Sample Size and Test Duration

This is the most technically demanding step. Walk through it explicitly -- do not skip or estimate loosely.

**Inputs required:**
- **Baseline metric value (p):** The current control conversion rate or metric value from the last 14-30 days of production data. Do not use the all-time average -- use recent data because baselines drift.
- **Minimum Detectable Effect (MDE):** The smallest effect size worth detecting. Expressed as relative change (10% relative lift on a 4% baseline = 0.4 percentage points absolute) or absolute change. Smaller MDE = larger required sample. The MDE should be grounded in business impact: "A 5% relative lift would generate $240K in additional ARR and is therefore worth detecting."
- **Significance level (alpha):** 0.05 is standard (5% false positive rate). For tests with major business consequences or irreversible decisions, use 0.01.
- **Statistical power (1 - beta):** 0.80 is the standard minimum. For critical tests or when false negatives are costly (e.g., a safety-critical feature), use 0.90.
- **Number of variants:** For a standard A/B test (1 control, 1 variant), the sample size is calculated per variant.

**Sample size formula for proportions (exact):**

For a two-tailed test at alpha=0.05, power=0.80:

```
n = (z_alpha/2 + z_beta)^2 * (p1*(1-p1) + p2*(1-p2)) / (p1 - p2)^2
```

Where:
- z_alpha/2 = 1.96 (for alpha=0.05, two-tailed)
- z_beta = 0.84 (for power=0.80)
- p1 = baseline rate (control)
- p2 = expected rate under variant (p1 + MDE_absolute)

**Practical approximation for proportions:**
```
n ≈ 16 * p * (1-p) / d^2
```
Where d = absolute MDE in proportion terms. This approximation is valid when p is between 0.05 and 0.50.

**For continuous metrics (revenue per user, session length):**
```
n = 2 * (z_alpha/2 + z_beta)^2 * sigma^2 / d^2
```
Where sigma is the standard deviation of the metric and d is the absolute MDE. This requires historical standard deviation data, not just a mean.

**Duration calculation:**
```
Duration (days) = n_per_variant / (daily_eligible_traffic * allocation_fraction)
```

**Duration constraints:**
- **Minimum: 7 days (1 full business week).** Day-of-week effects are real. A test that runs Monday-Wednesday will have biased results.
- **Preferred minimum: 14 days (2 full weeks).** Captures two full business cycles and reduces novelty effect contamination.
- **Maximum: 28-42 days.** Beyond 6 weeks, external factors (competitor launches, seasonality, media coverage) increasingly contaminate results. Users who joined partway through the test had different experiences. The experimental population shifts.
- **If calculated duration exceeds 8 weeks:** The test is likely infeasible as designed. Options: increase MDE (accept only larger detectable effects), switch to a higher-funnel metric with more daily events, apply CUPED variance reduction, or abandon A/B testing in favor of a phased rollout with pre-post analysis (with appropriate caveats about confounding).
- **Round up duration to the nearest full week** to ensure complete business cycles.

**Novelty effect buffer:** For changes to UI elements users interact with daily (navigation, feed ranking, dashboard layout), add a novelty effect observation period. Plan to analyze the first 7 days separately from subsequent days. Novelty effects manifest as an initial spike in engagement that decays to a true steady-state effect. The steady-state result is the reliable signal.

---

### Step 6: Define Traffic Allocation and Assignment Mechanism

- **Standard allocation: 50/50.** Equal split maximizes statistical power for a two-variant test. Only deviate from 50/50 if there is a specific reason (risk aversion, see below).
- **Ramp-up allocation:** For high-risk changes (new checkout flow, pricing change, infrastructure-level change), start at 10/90 (10% to variant, 90% to control) for the first 48 hours while monitoring guardrail metrics. If guardrails hold, ramp to 50/50. Document this ramp-up in the analysis plan, as early data from the ramp period should not be included in the final analysis.
- **Assignment unit:** User ID hash is the gold standard for logged-in products. Session ID for anonymous traffic. Cookie-based for anonymous web users (with awareness of cookie clearing contamination). Device ID for mobile apps.
- **Stickiness:** Assignment must be deterministic and consistent. The same user ID must always resolve to the same variant. Implement via hash function: `variant = hash(user_id + experiment_id) % 100`. If the experiment ID is stable, assignment is stable.
- **Mutual exclusivity:** If multiple experiments are running simultaneously, ensure users cannot be in two experiments that interact. An experiment on the CTA button and a simultaneous experiment on the pricing displayed on the same page will have interaction effects. Use a mutual exclusivity layer or a sequential experiment design.
- **Exclusions to specify:**
  - Internal employees and QA users (they interact with the product artificially)
  - Bots and automated traffic (filter by user agent, session behavior analysis)
  - Users who are mid-funnel in a separate experiment that affects the same downstream metric
  - Users in geographic regions with regulatory restrictions on the change
  - New users vs. existing users: if the change is only relevant for one cohort, restrict eligibility

---

### Step 7: Write the Pre-Registered Analysis Plan

The analysis plan must be written and locked before the test launches. Changes after seeing data are p-hacking by definition.

- **Primary analysis method:**
  - For conversion rate (proportion metric): Two-proportion z-test or chi-squared test. Report the p-value, the confidence interval on the difference, and the relative lift.
  - For continuous metrics (revenue, session length): Two-sample t-test. Check for normality violations -- if the distribution is heavily right-skewed (as revenue data typically is), use a Mann-Whitney U test or apply a log transformation before the t-test.
  - For count metrics (actions per session, messages sent): Poisson regression or negative binomial regression if overdispersed.

- **When to read results:** Set a single predetermined analysis date (when minimum sample size is reached and minimum duration is satisfied). Do not log into the dashboard daily. Early peeking -- even without acting -- inflates the Type I error rate significantly. If one analysis is pre-planned, alpha=0.05 is valid. If 5 peeks are taken, the true Type I error rate approaches 0.19.

- **If sequential testing (multiple peeks) is required:** Use an alpha-spending function (O'Brien-Fleming boundary or Pocock boundary). This is acceptable but requires pre-registration of the number of interim analyses and the alpha-spending schedule.

- **Decision rules (pre-register all four outcomes):**
  1. **Ship variant:** Primary metric improves by >= MDE with p < alpha and no guardrail violations.
  2. **Keep control:** Primary metric shows statistically significant degradation (p < alpha in wrong direction) OR any guardrail metric violates its threshold.
  3. **Inconclusive -- extend:** Result is not significant but sample size was not fully reached (early termination scenario). Extend by a pre-specified increment (typically 1 additional week).
  4. **Inconclusive -- conclude:** Minimum sample size and duration were reached. Result is not significant. The test has adequate power. Conclude "no detectable effect at the specified MDE." This is a valid result -- it means the change did not produce the effect hypothesized at the specified magnitude. Do not call it "neutral" and ship anyway.

- **Segment analysis plan:** Pre-register any segments to be analyzed (mobile vs. desktop, new vs. returning users, geographic regions, pricing tiers). Post-hoc segment mining produces false positives at a high rate. If a segment analysis is not pre-registered, treat its result as a hypothesis for a future test, not a decision-making input.

- **Novelty effect analysis:** Compare the primary metric for week 1 vs. week 2+ within the variant group. If the week 1 rate is substantially higher than week 2+, novelty effect is present and the week 2+ rate is the more reliable estimate.

---

### Step 8: Assemble the Test Documentation and Communication Plan

- Write the full test design document using the Output Format below before any implementation begins.
- Share the document with: engineering (for implementation verification), data/analytics (for logging verification), and product leadership (for awareness and stakeholder alignment).
- **Implementation verification checklist:**
  - Logging is confirmed for the primary metric event, all secondary metrics, and all guardrail metrics
  - Assignment logging is confirmed (every assignment event writes to an experiment log with user_id, variant, timestamp)
  - The assignment is verified to be sticky (run a query: same user_id should never appear in both variant and control)
  - Baseline sample ratio mismatch (SRM) check is planned: the split should be within ~1% of the target ratio after 48 hours. If the control group has 52% of users and the variant has 48% when 50/50 was specified, there is a bug in the assignment mechanism. Do not analyze results until SRM is resolved.
- **Stakeholder communication:** Set a calendar hold for the results readout date. Communicate the test duration and results date to stakeholders in advance. This prevents "when will we know?" pressure that causes premature peeking.

---

## Output Format

```
## A/B Test Design: [Test Name]

---

### Test Overview

| Field              | Value                                      |
|--------------------|-------------------------------------------|
| Test name          | [Descriptive name: Component-Change-Goal] |
| Experiment ID      | [Internal tracking ID if applicable]      |
| Owner              | [Name / Team]                             |
| Status             | [Draft / Ready for Review / Approved / Running / Complete] |
| Target launch date | [Date]                                    |
| Results read date  | [Date = launch + estimated duration]      |
| Estimated duration | [X weeks]                                 |
| Platform           | [Web / iOS / Android / Email / Server-side] |
| Eligible audience  | [Description of eligible user population] |

---

### Business Context

[1-3 sentences on why this test is being run now. What business problem or
opportunity does it address? What will the team do with the result?]

---

### Hypothesis

**If** [specific, singular change to the experience],
**then** [named metric] will [increase/decrease] by [X% relative / X pp absolute]
(from [current baseline] to [expected variant value]),
**because** [behavioral mechanism connecting the change to the outcome].

**Hypothesis type:** [Optimization / Exploratory / Defensive]
**Test directionality:** [Two-tailed (default) / One-tailed (justify reason)]

---

### Variants

| Variant        | Description                                  | Implementation Notes       |
|----------------|----------------------------------------------|---------------------------|
| Control (A)    | [Current production experience -- precise description] | [Engineering notes] |
| Variant (B)    | [Modified experience -- precise description] | [Engineering notes]        |

**Single variable changed:** [Exactly one element that differs between A and B]

**What is explicitly NOT changed:** [List of elements confirmed identical]

---

### Metrics

| Type        | Metric Name                    | Measurement Method         | Baseline Value | Target / Threshold        |
|-------------|-------------------------------|---------------------------|----------------|--------------------------|
| PRIMARY     | [Metric name]                  | [Event name / query]       | [X%]           | [+X% relative / +X pp]   |
| Secondary   | [Metric name]                  | [Event name / query]       | [X]            | [Direction: increase]     |
| Secondary   | [Metric name]                  | [Event name / query]       | [X]            | [Direction: increase]     |
| GUARDRAIL   | [Metric name]                  | [Event name / query]       | [X]            | Must not exceed [X]       |
| GUARDRAIL   | [Metric name]                  | [Event name / query]       | [X]            | Must not degrade > X%     |

---

### Sample Size and Duration Calculation

| Parameter                      | Value                                      |
|-------------------------------|-------------------------------------------|
| Baseline conversion rate       | [X%]                                      |
| Minimum detectable effect      | [X% relative] = [X pp absolute]           |
| Expected variant rate          | [X%]                                      |
| Significance level (alpha)     | 0.05 (two-tailed)                         |
| Statistical power              | 0.80                                      |
| Required sample per variant    | [N users]                                 |
| Total required sample          | [2N users]                                |
| Daily eligible traffic         | [X users/day]                             |
| Traffic allocation per variant | [50%] = [X users/day per variant]         |
| Raw duration                   | [X days]                                  |
| **Adjusted duration (full weeks)** | **[X weeks] (rounded up to [Y days])** |
| Test start date                | [Date]                                    |
| First valid analysis date      | [Date = start + adjusted duration]        |

**Sample size calculation method:** [Two-proportion z-test / formula used]
**Variance reduction:** [CUPED applied / Not applied -- reason]

---

### Traffic Allocation

| Setting                 | Value                                              |
|------------------------|----------------------------------------------------|
| Allocation method       | [User ID hash / Session ID / Device ID]            |
| Traffic split           | [50% Control (A) / 50% Variant (B)]                |
| Sticky assignment       | Yes -- same user always sees same variant           |
| Ramp-up plan            | [None / Ramp: 10% variant for 48h, then 50/50]     |
| Exclusions              | [Internal employees, bots, users in Experiment X]  |
| Mutual exclusivity      | [Confirm no overlapping experiments on same surface]|

---

### Pre-Registered Analysis Plan

**Primary statistical test:** [Two-proportion z-test / Two-sample t-test / Mann-Whitney U]
**Analysis date:** [Date -- minimum sample size AND minimum duration satisfied]
**Peeking policy:** No analysis before the analysis date. No metric review before this date.

**Decision rules (pre-registered):**

| Outcome                     | Condition                                                  | Action                               |
|-----------------------------|-----------------------------------------------------------|--------------------------------------|
| Ship variant                | Primary metric >= MDE, p < 0.05, no guardrail violations   | Ramp variant to 100%                 |
| Keep control                | Primary metric significantly degrades (p < 0.05, wrong direction) OR any guardrail violation | Revert / stop test immediately |
| Inconclusive -- extend      | Sample size not yet reached at planned read date           | Extend by [X] days, re-read at [date]|
| Inconclusive -- conclude    | Sample size reached, result not significant                | No ship. Conclude no detectable effect at specified MDE. Document learnings. |

**Novelty effect check:** Compare primary metric for days 1-7 vs. days 8+ within variant group.

**Pre-registered segment analyses (if any):**
- [Segment name]: [Metric] by [Segment definition]

**Post-hoc segment results** (not pre-registered) will be treated as hypotheses for future tests only.

---

### Logging and Implementation Verification

| Check                     | Verified By     | Date Verified |
|--------------------------|-----------------|---------------|
| Assignment logging confirmed | [Name]       | [Date]        |
| Primary metric event firing  | [Name]       | [Date]        |
| Guardrail metric events firing | [Name]     | [Date]        |
| Sticky assignment verified (query) | [Name] | [Date]        |
| SRM check scheduled (48h post-launch) | [Name] | [Date]   |
| Internal users excluded      | [Name]       | [Date]        |

---

### Risks and Mitigations

| Risk                                  | Likelihood | Mitigation                                   |
|---------------------------------------|-----------|----------------------------------------------|
| [e.g., Seasonality during test window]| Medium    | [Extend to capture full cycle, note in results]|
| [e.g., Overlapping experiment]        | Low       | [Confirmed mutex with Experiment Y]          |
| [e.g., Low traffic -- long duration]  | High      | [Increased MDE to 15% to reduce to 4 weeks] |
```

---

## Rules

1. **Never change the primary metric, MDE, or stopping rules after seeing any data, even partial data.** This is p-hacking regardless of intent. If the team feels compelled to change the metric after seeing preliminary results, stop the test, treat it as null, and redesign. The pre-registered analysis plan is a contract.

2. **Change exactly one variable between control and variant without exception.** If engineering "also fixed a small bug" in the variant, the test is contaminated and cannot be analyzed as a clean A/B test. If multiple changes must go out together, ship them as one unit of change and accept that the test measures the bundle effect.

3. **Always check for Sample Ratio Mismatch (SRM) before analyzing results.** Run a chi-squared test on observed group sizes vs. expected sizes. If p < 0.01 for the SRM test, the assignment mechanism is broken. Do not analyze business metrics until SRM is resolved. Common SRM causes: bot traffic, caching bugs, redirect logic affecting one variant differently, logging failures.

4. **Never run a test without first confirming that all metric events are logging correctly in production.** Verify the primary metric event fires correctly by running an A/A test (same experience in both groups) for 24-48 hours pre-launch and confirming no statistically significant difference. An A/A test also serves as a calibration check on the randomization mechanism.

5. **Always specify guardrail metrics with quantitative thresholds, not qualitative direction.** "Page load time should not increase" is unenforceable. "P95 page load time must not increase by more than 200ms from baseline (baseline: 1,800ms -- threshold: 2,000ms)" is enforceable and enables automated alerting.

6. **Test duration must cover a minimum of 7 days, and must be extended to the nearest full week above the calculated raw duration.** A test that runs 10 days includes one full weekend but only one Monday and one Friday. A 14-day test (2 full weeks) is the minimum for reliable results in most product contexts. This is non-negotiable even if the sample size is reached in 5 days.

7. **Assignment must be user-level and sticky for any experiment involving multi-session user behavior.** Session-level assignment is permissible only for single-session, anonymous contexts (e.g., landing page A/B test for paid traffic with no login). For any logged-in product, a user who sees variant B on Monday and control A on Wednesday is contaminated -- they will introduce noise that biases results toward null.

8. **The sample size calculation must use the actual daily eligible traffic, not total daily traffic.** If 10,000 users visit the site daily but only 3,000 visit the pricing page, the sample size for a pricing page experiment accrues at 3,000/day (or 1,500/day per variant at 50/50). Using the wrong denominator will underestimate test duration by 3x and produce a massively underpowered test.

9. **Do not use statistical significance alone as the decision criterion.** A result can be statistically significant and practically meaningless (0.1% absolute improvement on a 2% conversion rate with a sample of 2,000,000 users). Always evaluate: (a) Is the effect size above the MDE? (b) Is the confidence interval entirely above zero and above the practical significance threshold? (c) Are secondary and guardrail metrics directionally consistent? All three must be satisfied to ship.

10. **If the team is running more than one test simultaneously on the same surface or same downstream metric, enforce mutual exclusivity or use an interaction test design.** Two tests on the same onboarding page will have interaction effects. If a user sees Variant B from Test 1 and Variant B from Test 2, neither test can cleanly attribute effects. A mutual exclusivity layer routes each user into at most one experiment per surface. If mutual exclusivity is not technically feasible, document the overlap and adjust expected power accordingly.

11. **Distinguish between "no statistically significant effect" and "no effect."** An underpowered test that finds p=0.12 does not mean the change is neutral -- it means the test was not large enough to detect an effect at the specified MDE. Report results with the confidence interval: "We could not detect a difference greater than [MDE] with 80% power. Effects smaller than [MDE] remain possible." Do not ship based on this reasoning, but do not incorrectly characterize the result as proof of neutrality either.

12. **Never set up a test without a pre-specified "kill switch" rule.** Define in advance the condition under which the test will be stopped early due to harm: "If the checkout error rate exceeds 3% (versus baseline 0.5%), or if revenue per user drops more than 15% relative in a rolling 24-hour window, pause the test immediately and revert." This rule should be automated via monitoring alerts where possible.

---

## Edge Cases

### Very Low Traffic (Fewer Than 1,000 Daily Eligible Users)

When daily eligible traffic is below 1,000 users, standard frequentist A/B testing requires test durations that are impractical (often 3-6 months).

- **Option 1: Increase the MDE.** Commit to detecting only large effects (15-25% relative improvement). This is only appropriate if a large effect is the minimum threshold for shipping -- don't set an artificially high MDE just to make the math work if a 5% lift would have genuine business value.
- **Option 2: Move the metric higher in the funnel.** Test a metric that has more daily occurrences. If you are testing a checkout conversion change with 50 purchases/day, test "cart page CTR" with 800 events/day as the primary metric instead. Note explicitly that the funnel proxy may not translate 1:1 to revenue impact.
- **Option 3: Bayesian A/B testing.** Bayesian methods allow continuous monitoring without inflating Type I error rates and can reach actionable conclusions with smaller samples by incorporating prior information. Use a Beta-Binomial conjugate model for proportion metrics. Specify an informative prior based on historical experiment results (e.g., "previous CTA tests have produced lifts ranging from -5% to +15%, centered near +3%"). Report the posterior probability that variant B is better than control, and the expected loss of choosing the wrong variant. The decision threshold is typically: ship if P(B > A) >= 0.95 and expected loss < 0.5% absolute.
- **Option 4: Sequential holdout / phased rollout with pre-post analysis.** Ship the change to 100% of users, take careful pre-post measurements with regression adjustment for time trends. This is not a true experiment (no randomization, susceptible to external confounds), but it is a practical alternative when sample sizes make experimentation infeasible. Document the limitations prominently.

### Revenue or High-Variance Continuous Metric as Primary

Revenue per user, order value, and lifetime value metrics have highly skewed distributions (a small number of high-value users drive disproportionate variance). This has major implications.

- **Standard t-test assumptions are often violated.** Use a Mann-Whitney U test (rank-based, non-parametric) or apply log-transformation to the revenue metric before analysis.
- **Sample size requirements are 3-10x higher than for conversion rate tests.** Calculate the required sample using: n = 2 * (z_alpha/2 + z_beta)^2 * sigma^2 / d^2, where sigma is the empirical standard deviation of revenue per user from historical data. If sigma is large relative to the mean, the required N will be very large.
- **Apply CUPED.** If pre-experiment revenue data exists for each user, CUPED can reduce the variance term (sigma^2) by using the pre-experiment revenue as a covariate. CUPED variance reduction formula: sigma^2_cuped = sigma^2 * (1 - rho^2), where rho is the correlation between pre- and post-experiment revenue. For products with persistent revenue behavior, rho often ranges from 0.4 to 0.7, reducing required sample size by 16-49%.
- **Consider a conversion-then-revenue analysis.** Split the analysis: (1) Test conversion rate as primary (adequate power). (2) Among converters only, test average order value as a secondary metric with the caveat that this sub-population may be selected (average order value among converters is biased if conversion rate changes).

### Tests Involving Network Effects (Social Products, Marketplace Products)

Standard A/B testing assumes the Stable Unit Treatment Value Assumption (SUTVA): a user's outcome is not affected by the variant assignment of other users. This assumption is violated in social networks, two-sided marketplaces, and communication tools.

- **Symptom:** A feature that makes variant users more active also creates more content/supply/messages that control users interact with, biasing the control group upward and diluting the measured effect.
- **Solution: Cluster-based randomization.** Assign clusters of users (geographic regions, social graph communities, marketplace supply-demand pairs) to variants as a unit rather than individual users. This respects network boundaries.
- **Alternative: Ego network isolation.** Assign a user and all their first-degree connections to the same variant. This reduces spillover but reduces the effective sample size (clusters are the unit of analysis, not individuals).
- **Alternative: Time-based switchback tests.** For marketplace products (ride-sharing, food delivery), alternate between variants on a time slice basis (hour-by-hour or day-by-day). This controls for network effects but requires careful modeling of time-as-covariate.

### Tests Interrupted by External Events

Seasonality, competitor announcements, major news events, or product outages that occur during the test window can contaminate results.

- **If the event affected both groups equally:** The test remains valid, but note the external event in the results write-up and verify that neither group shows unusual metric spikes correlated with the event timing.
- **If the event affected one group disproportionately:** (e.g., an outage that only affected users in the variant group due to the new code) -- the test is contaminated. Stop the test, fix the issue, and restart with a clean population (exclude users who were exposed during the contaminated period).
- **Seasonality rule:** Do not run tests that span Black Friday, Cyber Monday, major holidays, or annual pricing change windows unless the test is specifically designed to measure behavior during those events. The baseline conversion rate during those periods is not representative of the steady-state.
- **Pre-planned interruption policy:** Write in the test design: "If a product incident (error rate > X% or latency > Y ms) occurs for more than 30 continuous minutes, pause the test, investigate impact by variant, and determine whether to restart with a clean population."

### Multi-Platform Experiments (Web + iOS + Android)

Many product experiments need to run across multiple platforms simultaneously, but baseline conversion rates, user behavior, and population composition differ by platform.

- **Option 1: Single unified test.** Run the test across all platforms with platform as a pre-registered segment analysis. This is appropriate when the change is identical across platforms and the primary metric is consistent (e.g., account activation rate regardless of platform).
- **Option 2: Platform-stratified test.** Run separate tests per platform with separate sample size calculations. This avoids platform composition effects contaminating the overall result but requires sufficient traffic on each platform individually.
- **Option 3: Stratified randomization.** Randomize within each platform stratum at the 50/50 rate. This ensures balanced representation in each variant. At analysis, combine with platform as a stratification variable or analyze separately.
- **Critical: Never count a user on both platforms in both groups.** A user who uses both the web app and the iOS app should be assigned to the same variant on both. This requires a user-level assignment based on authenticated user ID, not device or session.

### Novelty Effects and Learning Effects

Some changes produce short-term behavioral changes that do not reflect the long-run steady-state effect.

- **Novelty effect:** Users interact more with a new feature or UI element simply because it is new. This inflates variant performance in week 1 and decays. To detect: compare variant primary metric in week 1 vs. week 2+. A declining trend in the variant (not in control) indicates novelty effect.
- **Learning effect:** Some changes require users to adapt before capturing the full benefit. A new navigation structure may reduce short-term task completion while users learn it, but produce long-term efficiency gains. To detect: compare variant metric in week 1 vs. week 2+. An improving trend in the variant indicates learning effect.
- **Handling:** In both cases, extend the test to reach steady state (typically 3-4 weeks). Report the steady-state result (week 2+ or week 3+) as the primary result. Report the week 1 result as a context data point with explicit labeling. Pre-register this analysis approach before launch.

### Experiment Holdback for Long-Term Effect Measurement

For features that are shipped and expected to have compounding long-term effects (onboarding changes, habit-forming features, pricing tier changes), a single A/B test measuring 2-4 weeks of behavior may not capture the full effect.

- **Holdback design:** After shipping the feature to 100%, retain a random holdback group (typically 5-10%) in the "old" experience for an additional observation period (30-90 days). This holdback group serves as the ongoing control.
- **Holdback duration:** Set in advance based on the metric observation window. For 30-day retention, observe for at least 30 additional days after holdback assignment. For 90-day LTV, observe 90 additional days.
- **Holdback constraints:** Holding back users from an improvement you believe is positive has an ethical and business cost. Use holdbacks selectively for high-stakes changes where long-term effects are genuinely uncertain. Set a maximum holdback duration and communicate it to the team.

---

## Example

**Input:** "We redesigned the onboarding empty state for our project management app. Right now, new users see a blank dashboard with just a 'Create your first project' button. We want to test showing a template gallery (3 featured project templates with preview cards) instead. We think it'll improve activation. We have about 800 new user signups per day, and our current 'first project created within 7 days' rate is 22%. We're targeting B2B teams."

---

**Output:**

## A/B Test Design: Onboarding Empty State -- Template Gallery vs. Blank CTA

---

### Test Overview

| Field                  | Value                                                           |
|------------------------|----------------------------------------------------------------|
| Test name              | Onboarding Empty State -- Template Gallery vs. Blank CTA       |
| Experiment ID          | EXP-2024-047                                                    |
| Owner                  | Product Manager, Onboarding Squad                              |
| Status                 | Draft                                                          |
| Target launch date     | [Date TBD pending engineering verification]                    |
| Results read date      | Launch date + 28 days                                          |
| Estimated duration     | 4 weeks                                                        |
| Platform               | Web (logged-in new users, first session post-signup)           |
| Eligible audience      | New registered users (account age <= 24 hours) on first dashboard visit |

---

### Business Context

New user activation is the primary growth lever for the product: users who create their first project within 7 days have a 3.4x higher 30-day retention rate than those who do not (per cohort analysis). The current blank empty state provides no scaffolding for users who do not know where to start. The hypothesis is that a template gallery reduces the "blank page problem" -- the cognitive friction of starting from zero -- and increases the proportion of users who activate. The team will use this result to determine whether to invest further in a full template library or to focus activation efforts elsewhere.

---

### Hypothesis

**If** new users see a template gallery (3 featured project templates with preview cards) on their first dashboard visit instead of a blank dashboard with a single CTA button,
**then** the 7-day first-project-creation activation rate will increase by at least 15% relative (from 22.0% to 25.3%),
**because** the template gallery reduces the cognitive overhead of starting from a blank state by providing concrete examples, lowers the perceived effort of setup, and activates a "completion" motivation when users see a partially-defined project structure they can adopt.

**Hypothesis type:** Optimization
**Test directionality:** Two-tailed (the template gallery could plausibly distract users or create choice paralysis, producing a negative result)

---

### Variants

| Variant        | Description                                                                                                          | Implementation Notes                                           |
|----------------|----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| Control (A)    | Current empty state: blank dashboard area with single "Create your first project" button (primary button, center-aligned, blue) | No changes required. Production state as of [date].           |
| Variant (B)    | Template gallery empty state: header text "Start with a template or build from scratch," 3 template preview cards (Marketing Campaign, Product Roadmap, Sprint Planning), each card shows template name, 3-line description, and "Use this template" button. Below the gallery: "Or start from scratch" text link. | New component: `<TemplateGallery />`. Cards link to pre-populated project creation flow. "Start from scratch" link replicates current CTA behavior. |

**Single variable changed:** The empty state component on the new user dashboard (first visit only).

**What is explicitly NOT changed:** Navigation bar, top header, sidebar, account setup checklist (if present), onboarding tooltip sequence, email sequence, project creation flow after the user clicks any CTA, button color scheme, or any other dashboard element.

---

### Metrics

| Type        | Metric Name                                | Measurement Method                                                           | Baseline Value | Target / Threshold                       |
|-------------|-------------------------------------------|-----------------------------------------------------------------------------|----------------|------------------------------------------|
| PRIMARY     | 7-day first-project-creation rate         | % of new users (cohorted by signup date) who create >= 1 project within 7 days of first login | 22.0%          | >= 25.3% (+15% relative / +3.3pp absolute) |
| Secondary   | 3-day first-project-creation rate         | % of cohort who create >= 1 project within 3 days                           | 14.5% (est.)   | Directional increase                     |
| Secondary   | Template adoption rate (Variant B only)   | % of Variant B users who click "Use this template" (vs. "start from scratch") | N/A            | Informational -- expected 40-60%         |
| Secondary   | Day-14 retention rate                     | % of cohort who log in at least once during days 8-14                        | 31.0% (est.)   | Directional increase                     |
| GUARDRAIL   | Time-to-first-project (among activators)  | Median minutes from first dashboard view to first project created            | 8.2 min        | Must not increase by more than 50% (threshold: 12.3 min) |
| GUARDRAIL   | Dashboard page error rate                 | HTTP 5xx errors on dashboard page route                                      | 0.3%           | Must not exceed 1.0%                     |
| GUARDRAIL   | 30-day trial-to-paid conversion rate      | % of new trial users who convert to paid by day 30                          | 11.5%          | Must not decrease by more than 2pp (threshold: 9.5%) |

---

### Sample Size and Duration Calculation

| Parameter                          | Value                                                      |
|-----------------------------------|------------------------------------------------------------|
| Baseline conversion rate           | 22.0% (0.220)                                             |
| Minimum detectable effect          | 15% relative = 3.3 percentage points absolute             |
| Expected variant rate              | 25.3% (0.253)                                             |
| Significance level (alpha)         | 0.05 (two-tailed)                                         |
| Statistical power                  | 0.80                                                      |
| z_alpha/2                          | 1.96                                                      |
| z_beta                             | 0.842                                                      |
| Required sample per variant        | n = (1.96 + 0.842)^2 * (0.220*0.780 + 0.253*0.747) / (0.033)^2 = **~1,620 users** |
| Total required sample              | ~3,240 users                                              |
| Daily eligible traffic             | 800 new signups/day                                       |
| Traffic allocation per variant     | 50% = 400 new users/day per variant                       |
| Raw duration                       | 1,620 / 400 = 4.05 days (minimum sample) + 7-day metric window = 11 days minimum |
| **Adjusted duration**              | **28 days (4 full weeks)** -- extended to capture 4 full business cycles and the full 7-day metric observation window for the final cohort |
| Test start date                    | [Date]                                                    |
| First valid analysis date          | Start date + 28 days                                      |

**Important duration note:** Although the minimum sample size is reached in approximately 4 days of exposure, the primary metric (7-day first-project-creation rate) requires a 7-day observation window after each user's first visit. Users who are assigned on day 21 of the test will not have their 7-day window complete until day 28. Therefore, the minimum valid analysis date is day 28 regardless of when the sample target is reached.

**Sample size calculation method:** Two-proportion z-test (exact formula above).
**Variance reduction:** CUPED not applicable (new users have no pre-experiment behavioral data).

---

### Traffic Allocation

| Setting                  | Value                                                                |
|--------------------------|----------------------------------------------------------------------|
| Allocation method         | User ID hash: `variant = SHA256(user_id + "EXP-2024-047") % 100 < 50` → Control; else Variant |
| Traffic split             | 50% Control (A) / 50% Variant (B)                                   |
| Sticky assignment         | Yes -- assignment computed deterministically from user ID, stable across sessions |
| Ramp-up plan              | Ramp: 10% variant (vs. 90% control) for first 48 hours post-launch while monitoring dashboard error rate and guardrail metrics. If error rate < 1% and no guardrail violations at 48h, ramp to 50/50. Data from ramp period (first 48h) excluded from final analysis. |
| Exclusions                | Internal employees (email domain @[company].com), QA automation accounts (tagged in user table), users who signed up via SSO enterprise provisioning flow (different activation path), bot accounts (session duration < 5 seconds on first visit) |
| Mutual
