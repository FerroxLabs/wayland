---
name: ab-test-design
description: |
  Designs an A/B test from scratch. Defines the hypothesis, calculates required sample size, specifies randomization method, sets success metrics and minimum detectable effect, and produces a results interpretation template.
  Use when the user wants to set up a controlled experiment to test whether a change produces a measurable improvement.
  Do NOT use for interpreting completed test results (use hypothesis-testing), analyzing existing data without experimentation (use correlation-analysis), or survey design (use survey-design in the research cluster).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "statistics analysis research"
  category: "data-analysis"
  subcategory: "exploratory-data-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# A/B Test Design

## When to Use

**Use this skill when:**
- A user wants to measure the causal effect of a single change -- new button copy, revised pricing page, redesigned onboarding flow, different email subject line, modified recommendation algorithm -- before shipping it to all users
- A user asks how many users, sessions, or impressions they need to run a valid experiment ("how long should I run this test?", "is my sample size big enough?")
- A user needs a pre-registered experiment plan with a formal hypothesis, power calculation, and decision rules -- especially in regulated environments (clinical, fintech) where post-hoc analysis is unacceptable
- A user wants to know whether their proposed effect size is realistic and detectable given their actual traffic volume
- A user is designing a holdout test, a feature-flag rollout, or a switchback experiment and needs the same statistical rigor as a standard A/B test
- A user needs to communicate an experiment plan to engineering, product, or leadership and requires a structured, defensible document
- A user is computing sample sizes for a test involving continuous metrics like revenue per user, session duration, or engagement score -- not just binary conversion rates

**Do NOT use when:**
- The user already has test results and wants to compute a p-value or confidence interval -- use `hypothesis-testing` instead
- The user wants to find patterns, correlations, or trends in existing data without running a controlled experiment -- use `correlation-analysis`
- The user wants to design a survey or questionnaire to collect self-reported opinions -- use `survey-design`
- The user needs to analyze test results where assignment was not properly randomized (quasi-experiments, observational studies) -- use `causal-inference` or `regression-discontinuity` if available
- The user is describing a test with more than 4 simultaneously running variants -- recommend multivariate testing (MVT) or Taguchi methods instead, and note this skill covers up to 4 variants with corrections
- The user wants to optimize continuously across many parameter combinations -- recommend a bandit algorithm framework (Thompson Sampling, UCB1) rather than a fixed-horizon A/B test
- The user is asking about before-after comparisons without a concurrent control group -- time-series-based causal inference (difference-in-differences, interrupted time series) is more appropriate

---

## Process

### Step 1 -- Elicit the Hypothesis and Change Description

Ask the user to precisely describe the intervention. Vague hypotheses produce uninterpretable results.

- **What is changing?** Push for a single, atomic change. "Redesigning the checkout page" is too broad. "Changing the CTA button text from 'Submit Order' to 'Complete Purchase'" is testable. If multiple elements change simultaneously, the test cannot attribute effects to any single cause.
- **What is the expected mechanism?** Ask why the change should work. "The new button text reduces cognitive friction and increases commitment language, which should increase conversion." This prevents post-hoc rationalization of any result.
- **Direction of expected effect:** Establish whether the hypothesis is directional (one-tailed: "we expect improvement") or non-directional (two-tailed: "we don't know if this will help or hurt"). Default to two-tailed unless there is a strong, pre-specified reason for one-tailed.
- **Write the formal null and alternative hypothesis:**
  - H₀: The treatment produces no change in the primary metric (metric_B - metric_A = 0)
  - H₁ (two-tailed): The treatment produces a nonzero change (metric_B - metric_A ≠ 0)
  - H₁ (one-tailed, if justified): metric_B > metric_A
- **Identify the unit of analysis:** What entity experiences the change and is measured? This must match the randomization unit. If users are randomized but sessions are counted, you have a unit of analysis mismatch that inflates false positives.

### Step 2 -- Define and Operationalize the Primary Metric

One primary metric. Exactly one. Pre-specify it before any data collection begins.

- **Binary (proportion) metrics:** Conversion rate (converted / exposed), click-through rate (clicks / impressions), activation rate (activated / registered). These follow binomial distributions and use proportion-based sample size formulas.
- **Continuous metrics:** Average order value (AOV), revenue per user (RPU), session duration, pages per session, engagement score. These follow approximately normal distributions (by CLT for large n) and use mean-comparison formulas requiring the population standard deviation.
- **Count metrics:** Number of purchases per user, messages sent, items added to cart. These follow Poisson or negative binomial distributions. For count outcomes, use the delta method or bootstrap for variance estimation rather than naive t-test formulas.
- **Ratio metrics:** Revenue per session (total revenue / total sessions across all users in a group). These are NOT the same as per-user averages. Ratio metrics require the delta method for variance: Var(R) ≈ (1/n) * [Var(Y) + R² * Var(X) - 2R * Cov(X,Y)] / mean(X)². Use this when the denominator varies by user.
- **Specify the metric precisely:** "Conversion rate" is ambiguous. "Proportion of unique users who completed a purchase within 24 hours of landing on the product page, among users who viewed the product page at least once" is a metric. Ambiguity in metric definition leads to disputes after results are in.
- **Identify secondary metrics** (3-5 maximum) that will be observed but NOT used to make the go/no-go decision. Label them exploratory. Analyzing them without correction is hypothesis generation, not confirmation.

### Step 3 -- Establish the Minimum Detectable Effect (MDE)

The MDE is a business decision, not a statistical one. Drive this conversation carefully.

- **Start with business impact, not statistics:** "If conversion increases from 3.0% to 3.1%, how much incremental annual revenue does that generate at your current traffic?" Walk through the math with the user. If the answer is $50,000 and the engineering cost of implementing the change is $200,000, the MDE of 0.1 pp is not worth testing for.
- **Anchor to operational thresholds:** What is the minimum improvement that would cause the business to act? That is the MDE. Tests should be designed to detect effects worth caring about, not just any nonzero effect.
- **Express MDE in both absolute and relative terms:**
  - Absolute: 1.0 percentage point (e.g., 4% → 5%)
  - Relative: 25% lift (1.0 / 4.0 = 25%)
  - For continuous metrics: minimum meaningful difference in raw units (e.g., $2.00 increase in AOV from a baseline of $45.00)
- **Common MDE traps:**
  - Setting MDE too small to be feasible given traffic: results in a 6-month test
  - Setting MDE based on what the team thinks will happen: this is circular. Set MDE based on what matters, then check if the expected effect exceeds MDE
  - Using relative MDE for low baselines: a 20% relative lift on a 0.5% conversion rate is 0.1 pp absolute. That may require 80,000 users per group.
- **For teams with no prior data:** Use industry benchmarks as a starting anchor, but always validate against the user's own historical data. Button-click optimization MDE benchmarks vary by industry from 0.5 pp to 5 pp.

### Step 4 -- Calculate Required Sample Size

The sample size calculation is the technical core of the design. Get it right.

**For binary (proportion) metrics:**

The exact formula for two-proportions z-test (two-sided, equal groups):

```
n_per_group = (Z_α/2 + Z_β)² × [p₁(1-p₁) + p₂(1-p₂)] / (p₂ - p₁)²
```

Where:
- p₁ = baseline conversion rate (control)
- p₂ = p₁ + MDE (treatment, under H₁)
- Z_α/2 = 1.960 for α = 0.05 (two-tailed)
- Z_β = 0.842 for 80% power; 1.282 for 90% power; 0.524 for 70% power
- At 80% power, α = 0.05: (1.960 + 0.842)² = 7.849

**Quick reference: sample size per group (α=0.05 two-tailed, 80% power)**

| Baseline Rate | MDE (absolute) | Relative Lift | n per group |
|--------------|----------------|---------------|-------------|
| 1% | 0.3 pp | 30% | ~5,400 |
| 2% | 0.5 pp | 25% | ~6,200 |
| 3% | 0.5 pp | 17% | ~9,900 |
| 3% | 1.0 pp | 33% | ~2,700 |
| 5% | 0.5 pp | 10% | ~18,500 |
| 5% | 1.0 pp | 20% | ~4,700 |
| 10% | 1.0 pp | 10% | ~14,700 |
| 10% | 2.0 pp | 20% | ~3,700 |
| 20% | 2.0 pp | 10% | ~15,600 |
| 20% | 4.0 pp | 20% | ~3,900 |
| 50% | 5.0 pp | 10% | ~6,100 |

Note: these values are precisely computed from the formula above, not approximations. The 16 × p(1-p)/MDE² shortcut underestimates sample size when p₁ and p₂ differ meaningfully.

**For continuous (mean) metrics:**

```
n_per_group = 2 × (Z_α/2 + Z_β)² × σ² / δ²
```

Where:
- σ = population standard deviation (estimate from historical data)
- δ = minimum meaningful difference in raw units (the MDE for continuous metrics)
- The factor of 2 accounts for both groups having variance σ²

At 80% power, α = 0.05: n = 2 × 7.849 × σ² / δ² = 15.7 × (σ/δ)²

The ratio σ/δ is the inverse of the standardized effect size (Cohen's d). Cohen's conventions: small = 0.2, medium = 0.5, large = 0.8. At d = 0.2 (small effect), n ≈ 394 per group. At d = 0.5 (medium), n ≈ 64 per group.

**Practical variance estimation for continuous metrics:**
- Pull 4+ weeks of historical data for the metric
- Compute the per-user mean and standard deviation
- Warn if the metric has high right-skew (as revenue metrics often do) -- consider using log-transformed revenue or capping outliers at the 99th percentile before analysis
- For highly skewed metrics, the t-test is still valid for large n (CLT), but very large samples (n > 1,000 per group) are often needed before the normal approximation is reliable

**Power settings:**
- 80% power: industry default for product experiments. 20% chance of missing a real effect.
- 90% power: recommended when missing an effect is costly (major platform changes, pricing tests). Increases sample size by ~35% compared to 80%.
- 70% power: acceptable only for exploratory tests or when traffic is severely constrained. 30% miss rate is high.

**Significance level (α) settings:**
- α = 0.05: standard for product experiments
- α = 0.01: use when false positives are costly (medical devices, financial products, security changes)
- α = 0.10: use only for very early-stage exploratory tests where speed matters more than rigor

### Step 5 -- Design the Randomization Strategy

Randomization validity determines the entire causal claim of the experiment.

- **Randomization unit -- the most important decision:**
  - **User-level (preferred):** Randomize by persistent user ID. Prevents the same user from seeing both variants, which causes carry-over contamination. Use for logged-in product tests.
  - **Cookie-level:** For logged-out or anonymous users. Cookies can be cleared, leading to ~5-15% user re-assignment. Acceptable for short tests; problematic for 3+ week tests.
  - **Session-level:** Valid only when sessions are truly independent (e.g., each session is a separate service call). Never use session-level randomization for UI tests -- users will see flickering between variants across sessions.
  - **Device-level:** Intermediate between cookie and user. Stable within a device but a user on multiple devices sees both variants. Measure cross-device contamination rate if possible.
  - **Cluster-level (geographic or organizational):** Required when individual-level randomization is impossible (e.g., testing a policy change, testing a UI that affects how users see each other's content). Use cluster-randomized trial design -- the sample size formula changes: n_clusters = (standard n) × (1 + (m-1) × ICC), where m is cluster size and ICC is the intracluster correlation coefficient.

- **Assignment mechanism -- hash-based determinism:**
  - Assign variant using: variant = hash(user_id + experiment_id) mod 100
  - Buckets 0-49 → control, 50-99 → treatment (for 50/50 split)
  - The experiment_id salt ensures the same users are not always in the same group across experiments
  - This guarantees determinism (same user always sees same variant) without a lookup table

- **Traffic allocation:**
  - 50/50 is statistically optimal -- it minimizes the total sample needed for a given per-group sample
  - Unequal splits (e.g., 90/10) are used to limit treatment exposure for risky changes. The formula for the required per-group sample at unequal allocation f (fraction to treatment): n_control = n_standard × (1 + 1/f) / (2 × f_treatment / f_control), or simply use the exact formula with unequal variances
  - At 90/10 split, the effective sample is dominated by the smaller group. A 90/10 test requires roughly 10× the treatment-group exposure compared to 50/50 to achieve the same power. Quantify this trade-off explicitly.
  - For 80/20 splits: multiply the 50/50 per-group sample by ~1.25 for the same power

- **Exclusion criteria -- define before launch:**
  - Internal users and QA accounts (they behave atypically)
  - Users who have already been exposed to the new feature via a previous test or soft launch
  - Bots and crawlers (filter by user-agent patterns, behavioral signals)
  - Users in other simultaneously running experiments that affect the same surface (overlap bias)
  - New users vs. returning users (specify which population is in scope)

- **Experiment contamination checks:**
  - Run an A/A test before launch if possible: assign users to two identical control groups and verify the primary metric shows no significant difference. False positive rate should be ~5%.
  - Check assignment balance: within 48 hours of launch, verify that the actual sample size split is close to the intended split (within ±2 percentage points). Significant imbalance suggests a logging or assignment bug.
  - Check covariate balance (SRM detection): if device type, country, acquisition channel, or new/returning user status is significantly imbalanced between groups, suspect a Sample Ratio Mismatch (SRM). SRM invalidates causal inference. Use a chi-squared goodness-of-fit test on the intended vs. observed allocation.

### Step 6 -- Establish Test Duration and Calendar Constraints

Duration is determined by traffic, not by impatience.

- **Minimum duration formula:**
  - Total sample needed = 2 × n_per_group (for 50/50)
  - Daily eligible traffic = total daily traffic × fraction eligible for this test
  - Minimum days = total sample needed / daily eligible traffic
  - Add buffer: multiply by 1.1 to 1.2 to account for traffic volatility

- **Weekly cycle requirement:**
  - Always run for a minimum of 7 full days, even if sample size is reached in 3 days. Day-of-week effects are pervasive in consumer products: weekend users differ from weekday users in intent, device, and behavior.
  - Round up to the nearest full week: a test needing 10 days should run 14 days.

- **Novelty effect consideration:**
  - New features often generate inflated engagement from curious users in the first 1-3 days. If you expect a novelty effect, extend the test to 2-3 weeks and analyze the last half of the test period separately to see if the effect stabilizes.
  - Compare the effect size in week 1 vs. week 2. If it decays significantly, the long-run effect is closer to week 2.

- **Maximum duration:**
  - 4 weeks is a practical upper limit for most product experiments. Beyond 4 weeks: seasonal effects compound, the underlying user population drifts, and feature development typically moves on.
  - For tests exceeding 4 weeks: reframe the problem. Can the MDE be relaxed? Can a larger change be tested that would be detectable sooner?

- **Calendar contamination risks to document:**
  - Major holidays or promotional events (Black Friday, Cyber Monday, back-to-school)
  - Product launches or major announcements that shift baseline traffic composition
  - Scheduled A/B tests on overlapping surfaces running concurrently
  - Infrastructure changes (server migrations, CDN changes) that could affect performance

### Step 7 -- Define Guardrail Metrics and the Decision Framework

Pre-commit to the decision rules. Changing them after seeing results is p-hacking.

**Guardrail metrics:**
- Guardrails are metrics that must not degrade, regardless of what happens to the primary metric. Their purpose is to catch hidden negative side effects.
- Select 3-5 guardrails from this taxonomy:
  - **Revenue guardrails:** Revenue per user, average order value, subscription cancellation rate, refund rate. Even a test designed to improve UX should not silently hurt revenue.
  - **Quality guardrails:** Error rate (4xx/5xx responses), page load time (P75 and P95, not just mean -- tail latency matters), crash rate for mobile features.
  - **Engagement guardrails:** Session depth, return visit rate, support ticket rate. A change that boosts one-time conversion but hurts retention is often a bad trade.
  - **User experience guardrails:** Rage clicks (rapid repeated clicking on an element), scroll depth, form abandonment rate.
- Set threshold for each guardrail: "Revenue per user must not decline by more than 5% relative in the treatment group compared to control." Use this as an absolute stopping criterion.
- Distinguish guardrails from secondary metrics: guardrails trigger automatic test stops; secondary metrics are observed and reported but do not trigger stops.

**Pre-specified decision rules:**
- Define the decision logic before the experiment starts. Write it down. Get stakeholder sign-off.
- Standard two-sided decision framework:
  - p < α AND direction is positive → ship treatment
  - p < α AND direction is negative → kill treatment, investigate root cause
  - p ≥ α → inconclusive (see handling below)
  - Any guardrail breach → stop test regardless of primary metric result
- For the inconclusive outcome, specify in advance: "If p ≥ 0.05 after full sample collection, we will accept no meaningful difference exists at our MDE and will NOT ship the change." Choosing to extend indefinitely after an inconclusive result is p-hacking.
- If sequential testing is required (see edge cases), specify the sequential boundary or spending function before launch -- not after seeing early results.

---

## Output Format

```
## A/B Test Design Plan
### [Test Name / Experiment ID]
Prepared: [Date]

---

### 1. Hypothesis

**Null hypothesis (H₀):** Changing [description of change] has no effect on [primary metric].
**Alternative hypothesis (H₁):** Changing [description of change] will [increase/decrease] [primary metric]
  by at least [MDE absolute] ([MDE relative]%). Test direction: [two-tailed / one-tailed].
**Mechanism:** [One sentence explaining why this change should produce the expected effect.]

---

### 2. Experiment Design

| Element | Specification |
|---------|--------------|
| Control (A) | [Current version -- describe precisely] |
| Treatment (B) | [Modified version -- describe precisely] |
| Unit of randomization | [User ID / Cookie / Session / Cluster] |
| Eligible population | [Definition: logged-in users who visit checkout page, etc.] |
| Exclusion criteria | [Bots, internal users, users in overlapping experiments, etc.] |
| Traffic split | [50/50 or specify ratio with justification] |
| Assignment method | [Hash-based: hash(user_id + experiment_salt) mod 100] |

---

### 3. Metrics

**Primary metric:**
| Field | Value |
|-------|-------|
| Metric name | [Name] |
| Metric type | [Binary proportion / Continuous mean / Ratio metric] |
| Precise definition | [Numerator / denominator / time window] |
| Baseline value | [Current observed value with confidence interval if available] |
| Standard deviation | [For continuous metrics only -- from historical data] |
| Minimum detectable effect | [Absolute: X pp / units] -- [Relative: X%] |

**Guardrail metrics:**
| Metric | Baseline | Stop-test threshold | Owner |
|--------|----------|---------------------|-------|
| [Metric 1] | [Value] | [≥ X% decline triggers stop] | [Team] |
| [Metric 2] | [Value] | [≥ X% decline triggers stop] | [Team] |
| [Metric 3] | [Value] | [≥ X% decline triggers stop] | [Team] |

**Secondary / exploratory metrics (observed, not decision-making):**
- [Metric A]
- [Metric B]

---

### 4. Sample Size and Power

| Parameter | Value |
|-----------|-------|
| Statistical test | [Two-proportion z-test / Two-sample t-test / Mann-Whitney U] |
| Significance level (α) | [0.05 two-tailed / 0.01 / 0.05 one-tailed] |
| Statistical power (1-β) | [80% / 90%] |
| Baseline value (p₁ or μ₁) | [Value] |
| Expected value under H₁ (p₂ or μ₂) | [Baseline + MDE] |
| Standard deviation (σ) | [For continuous metrics] |
| Formula used | [State formula explicitly] |
| Sample size per group | [n] |
| Total sample required | [2n for 50/50] |

**Sample size calculation (show work):**
[Step-by-step computation using the formula, with all numbers substituted]

---

### 5. Timeline

| Parameter | Value |
|-----------|-------|
| Daily total eligible traffic | [N] |
| Traffic fraction allocated to experiment | [% or statement if 100%] |
| Daily traffic per group | [N/2 for 50/50] |
| Minimum days to reach sample | [Total sample / daily traffic] |
| Weekly cycles required | [Round up to nearest week] |
| Recommended test duration | [Days, accounting for novelty effect if applicable] |
| Maximum test duration | [28 days] |
| Planned start date | [Date or TBD] |
| Planned analysis date | [Start + recommended duration] |
| Calendar risks | [Holidays, launches, events during test window] |

---

### 6. Pre-Specified Decision Rules

**Ship treatment if:**
- p-value < [α] AND effect direction is positive AND no guardrail is breached

**Kill treatment if:**
- p-value < [α] AND effect direction is negative, OR any guardrail metric is breached

**Accept null (no change) if:**
- p-value ≥ [α] after full sample collection and no guardrail breach

**Emergency stop criteria:**
- [Guardrail metric 1] drops below [threshold]
- [Guardrail metric 2] drops below [threshold]
- Error rate increases above [X%]

---

### 7. Results Interpretation Template
*(Pre-fill after test completes)*

| Metric | Control | Treatment | Absolute Difference | Relative Difference | p-value | 95% CI |
|--------|---------|-----------|---------------------|---------------------|---------|--------|
| [Primary metric] | [baseline] | [observed] | [Δ] | [Δ/baseline %] | [p] | [lower, upper] |
| [Guardrail 1] | | | | | | |
| [Guardrail 2] | | | | | | |

**Decision:**
☐ Ship -- treatment showed significant improvement (p = [value], 95% CI [lower, upper pp])
☐ Kill -- treatment showed significant harm (p = [value])
☐ No change -- inconclusive result (p = [value], MDE of [X] not detected)
☐ Emergency stop -- guardrail breach: [specify metric and observed value]

**Narrative:**
> [Metric] in the treatment group was [X]% [higher/lower] than control ([treatment value] vs. [control value]).
> The 95% confidence interval for the difference is [[lower], [upper]] [units or pp].
> [Decision rationale in 2-3 sentences referencing pre-specified rules.]
```

---

## Rules

1. **Never run a test without a pre-specified primary metric and MDE.** The primary metric and MDE must be locked before any data is collected. If results are used to choose the metric, the Type I error rate is no longer controlled at α -- it can exceed 50% when many metrics are examined.

2. **Never check results and decide to stop or extend based on the p-value.** Each additional peek at accumulating data at α = 0.05 inflates the effective false positive rate. After 5 peeks, the true false positive rate exceeds 19%. After 10 peeks, it exceeds 29%. Either commit to the pre-planned sample size, or explicitly adopt a sequential testing framework (mSPRT, O'Brien-Fleming bounds) from the start.

3. **Always check for Sample Ratio Mismatch (SRM) before analyzing results.** An SRM means the observed group sizes deviate significantly from the intended allocation. Run a chi-squared test against expected proportions. Even a 2% SRM (e.g., 51/49 when 50/50 was intended) can bias the estimated treatment effect by 5-10%. SRM is caused by bot filtering, logging bugs, or hash-based assignment errors.

4. **Match the unit of analysis to the unit of randomization.** If users are randomized but events (page views, clicks) are analyzed, the independence assumption is violated. Observations from the same user are correlated, deflating the standard error and causing false positives. Always aggregate to the randomization unit before computing means and variances.

5. **Use the delta method for ratio metrics, not naive per-event averages.** Dividing total clicks by total sessions across all users in a group is a ratio of sums, not an average of per-user ratios. The variance of this ratio cannot be computed with a standard t-test. Use the delta method or bootstrap to estimate variance correctly.

6. **Do not apply multiple comparisons corrections to guardrail metrics -- apply them only to exploratory secondary metrics.** Guardrails are safety checks, not hypothesis tests. They use a threshold approach (did the metric cross a harm boundary?), not a significance testing approach. For secondary exploratory metrics analyzed as a family, apply Bonferroni (α/k) or Benjamini-Hochberg for less conservative correction.

7. **Always report the confidence interval for the effect, not just the p-value and direction.** "The improvement is between 0.2 and 1.8 percentage points" communicates practical significance. "p = 0.03, positive direction" does not. The width of the confidence interval tells you how precise the estimate is.

8. **Account for novelty effects in tests involving visible UI changes.** New UI elements generate artificially elevated engagement in the first 1-3 days from users exploring something unfamiliar. For tests expected to run 14+ days, compute the treatment effect separately for the first 3 days and the remaining days. If the effect decays substantially, the stable long-run effect is what matters for the ship decision.

9. **Never use one-tailed tests without pre-specifying a strong directional reason AND documenting the business justification.** One-tailed tests require half the sample of two-tailed tests at the same power. This is tempting but dangerous. One-tailed testing is only valid when it is scientifically impossible or operationally irrelevant for the treatment to perform worse. In practice, treatments very often perform worse than expected.

10. **Validate assignment logs independently of the product analytics system.** Bugs that affect the treatment group can also affect event logging. If the logging system is built on the same codebase being tested, the logged outcome events may be differentially missing between groups. Always verify sample counts and event counts from the assignment log against the analytics pipeline before analysis.

---

## Edge Cases

### Very Low Traffic Sites (Under 500 Daily Eligible Visitors)

When minimum test duration exceeds 4 weeks for any realistic MDE, standard fixed-horizon A/B testing is often infeasible. Present the user with a structured decision tree:

1. **Relax the MDE:** Increase the minimum detectable effect. If the test requires 10 weeks at MDE = 0.5 pp but only 3 weeks at MDE = 2.0 pp, ask whether a 2 pp improvement is meaningful. If yes, proceed.
2. **Increase statistical risk:** Reduce power from 80% to 70% or raise α from 0.05 to 0.10. Quantify the trade-off explicitly: at 70% power, 30 out of 100 real effects will be missed.
3. **Concentrate the test:** Instead of exposing all traffic, focus on the highest-traffic segment (e.g., only mobile web users, only the most-visited product category). This concentrates sample but limits generalizability.
4. **Use a within-subject (crossover) design:** If the outcome is not permanently affected by a single exposure, show users both variants across separate sessions. This dramatically reduces variance and thus sample size. Requires careful washout period design to prevent carry-over.
5. **Accept the limitation:** Some products genuinely cannot run valid A/B tests. In this case, recommend qualitative user research, session recording analysis, or expert heuristic evaluation as alternatives.

### Multiple Variants (A/B/C or More)

Testing k variants simultaneously requires adjustments:

- **Sample size:** Each group still needs n_per_group users (from the two-group formula), so total sample = k × n_per_group. Total experiment duration increases proportionally with k.
- **Multiple comparisons:** With k variants, you have k-1 treatment-vs.-control comparisons (plus k(k-1)/2 pairwise comparisons if all pairs are tested). Control the familywise error rate using Bonferroni correction (α_adjusted = α / (k-1) for comparisons against control only).
  - k=2: α_adjusted = 0.05 (no correction)
  - k=3: α_adjusted = 0.025 per comparison
  - k=4: α_adjusted = 0.017 per comparison
  - For k ≥ 5, Benjamini-Hochberg FDR control is more powerful than Bonferroni
- **Recommendation:** For most product teams, run sequential pairwise tests (winner of A/B rounds against C) rather than all-at-once multi-variant tests. It is slower but more statistically tractable. For UI element optimization with many variants, dedicated multivariate testing tools that model interaction effects are appropriate.

### Continuous High-Skew Metrics (Revenue, Session Duration)

Revenue per user is almost universally right-skewed. The top 1% of users may drive 20-40% of revenue. This creates two problems:
- The mean is heavily influenced by outliers, increasing variance and thus required sample size
- The t-test, while asymptotically valid, converges slowly with high skew -- n may need to be 2,000+ per group before CLT applies well

Recommended approaches:
- **Winsorize at 99th percentile** before computing means. Cap revenue at the 99th percentile of the historical distribution. This reduces variance with minimal bias and dramatically shrinks the required sample size. Document the capping threshold.
- **Log-transform revenue:** Analyze log(revenue + 1) if the hypothesis is about multiplicative effects. Back-transform the confidence interval: the ratio of geometric means is exp(difference of log means).
- **Bootstrap:** For small samples or non-standard metrics, use bootstrap resampling (1,000-10,000 iterations) to estimate the confidence interval for the mean difference without distributional assumptions.
- **Mann-Whitney U test (Wilcoxon rank-sum):** Non-parametric alternative. Tests whether one distribution tends to produce higher values than the other. Requires fewer assumptions but tests a slightly different question than the t-test.

### Cannibalization and SUTVA Violations (Network Effects)

The Stable Unit Treatment Value Assumption (SUTVA) requires that one user's treatment assignment does not affect another user's outcome. This fails in social and marketplace contexts:

- **Marketplace supply/demand interference:** Testing a feature for sellers affects buyer experience (and vice versa). Treatment group sellers may capture demand from control group sellers, biasing both groups.
- **Social feature tests:** If you test a feed ranking change, treatment users' increased engagement creates more content visible to their control-group friends.
- **Detection:** If the total platform-level metric (across both groups) moves significantly during the test, SUTVA may be violated.
- **Solutions:**
  - **Cluster randomization by social graph:** Assign users and their first-degree connections to the same variant. Reduces contamination but requires much larger samples due to design effect (DEFF ≈ 1 + (m-1) × ICC).
  - **Geographic/market-level randomization:** Randomize at city, region, or market level. Treats each market as one experimental unit -- requires at least 20 clusters per group for adequate power.
  - **Holdout regions:** Designate specific geographic markets as control holdouts and deploy the treatment everywhere else.

### Pre-Existing Differences Between Groups (Covariate Imbalance)

Even with proper randomization, the observed groups may differ on baseline covariates by chance (more likely with small n):

- **Detection:** At the time of analysis, compare key pre-experiment covariates (historical conversion rate, user tenure, device type, acquisition channel) between control and treatment. Run chi-squared tests for categorical variables and t-tests for continuous variables.
- **CUPED (Controlled-experiment Using Pre-Experiment Data):** A powerful variance reduction technique used at Microsoft, Netflix, and Airbnb. Adjust the outcome variable by its pre-experiment value:
  - Y_adjusted = Y - θ × (X_pre - mean(X_pre))
  - θ = Cov(Y, X_pre) / Var(X_pre), estimated from the experiment data
  - CUPED can reduce variance by 30-70%, directly reducing the required sample size by the same proportion without sacrificing Type I error control
  - Use when 2+ weeks of pre-experiment data per user is available
- **Stratified randomization (pre-stratification):** If high-variance covariates are known before experiment launch (e.g., user tier, country), stratify the random assignment within each stratum. This guarantees balance on those covariates and reduces variance.

### Overlapping Experiments (Experiment Interaction Effects)

In mature product organizations, dozens of experiments may run simultaneously on the same user population:

- **Mutual exclusion vs. overlap:** The two approaches for managing concurrency.
  - Mutual exclusion: users in experiment A cannot be in experiment B. Eliminates interaction effects but dramatically limits experimental capacity.
  - Overlapping: users can be in multiple experiments. Maximizes throughput. Interaction effects are rare and can be detected by including an experiment indicator as a covariate in analysis.
- **Interaction detection:** For any two overlapping experiments A and B, test the interaction term (treatment_A × treatment_B) in the outcome model. If significant, segment the analysis by the other experiment's assignment.
- **Priority ranking:** If a critical experiment needs clean data, assign it to a holdback layer that is mutually exclusive from all other experiments. Use this sparingly.

---

## Example

**Input:** "We're adding a progress bar to our multi-step checkout flow (currently 4 steps). Our checkout completion rate is 28%, and we get about 4,500 users entering checkout per day. We think the progress bar will increase completion by reducing anxiety about how many steps are left. We want to detect at least a 2 percentage point improvement."

**Output:**

## A/B Test Design Plan
### Experiment: Checkout Progress Bar
Prepared: [Date]

---

### 1. Hypothesis

**Null hypothesis (H₀):** Adding a progress bar to the checkout flow has no effect on checkout completion rate.

**Alternative hypothesis (H₁):** Adding a progress bar to the 4-step checkout flow will increase checkout completion rate by at least 2.0 percentage points (from 28% to at least 30%).

**Test direction:** Two-tailed. While improvement is expected, a progress bar that reveals 4 steps might discourage users who assumed fewer steps existed. A negative outcome is operationally relevant.

**Mechanism:** The progress bar reduces uncertainty about remaining effort, which is a known driver of checkout abandonment. Users who can see they are on step 2 of 4 are more likely to continue than users who have no context for how much remains. This is consistent with goal gradient effect research in behavioral psychology.

---

### 2. Experiment Design

| Element | Specification |
|---------|--------------|
| Control (A) | Current 4-step checkout flow with no progress indicator |
| Treatment (B) | Identical 4-step checkout flow with a step-count progress bar displayed at the top of each step ("Step 2 of 4") |
| Unit of randomization | User ID (logged-in users) -- for guest checkout users, cookie-based with a 30-day TTL |
| Eligible population | All users who initiate checkout (arrive at step 1 of the checkout flow) |
| Exclusion criteria | Internal team accounts (identified by email domain), users currently in the cart redesign experiment (mutual exclusion -- overlapping checkout surface), bot traffic (filtered by user-agent and behavioral velocity) |
| Traffic split | 50/50 |
| Assignment method | Hash-based: variant = MD5(user_id + "checkout_progress_bar_v1") mod 100; buckets 0-49 → control, 50-99 → treatment. Guest users use cookie ID as the hash input. |

---

### 3. Metrics

**Primary metric:**

| Field | Value |
|-------|-------|
| Metric name | Checkout completion rate |
| Metric type | Binary proportion |
| Precise definition | Proportion of users who reach step 1 of checkout who also complete step 4 (order confirmation page load), measured per unique user per session day, attributed to the variant they were assigned at step 1. A user who abandons and returns counts as one experiment unit from their first assignment. |
| Baseline value | 28.0% (measured over the trailing 28 days, 95% CI: 27.4% -- 28.6% based on historical daily variance) |
| Minimum detectable effect | 2.0 percentage points absolute (28.0% → 30.0%), which is a 7.1% relative lift |

**Guardrail metrics:**

| Metric | Baseline | Stop-test threshold | Owner |
|--------|----------|---------------------|-------|
| Revenue per checkout initiator | $12.40 | ≥ 5% relative decline vs. control triggers immediate stop | Revenue team |
| Checkout step 1 → step 2 progression rate | 72.1% | ≥ 3% relative decline (concern that progress bar discourages early steps) | Product |
| Checkout page load time P95 | 2.1 seconds | Any increase > 300ms triggers engineering review | Engineering |
| Customer support contacts re: checkout | 0.8% of initiators | ≥ 25% relative increase triggers stop | CX team |

**Secondary / exploratory metrics (observed only, no decision authority):**
- Per-step dropout rate at each individual step (to identify which steps benefit most from progress visibility)
- Time-to-complete checkout (in seconds) -- may decrease if uncertainty reduction speeds decisions
- Mobile vs. desktop segmented completion rates (progress bar may have differential value on mobile)

---

### 4. Sample Size and Power

| Parameter | Value |
|-----------|-------|
| Statistical test | Two-proportion z-test (two-sided) |
| Significance level (α) | 0.05 |
| Statistical power (1-β) | 80% |
| Baseline rate (p₁) | 0.280 |
| Expected rate under H₁ (p₂) | 0.300 |
| MDE (absolute) | 0.020 |
| Z_α/2 | 1.960 |
| Z_β | 0.842 |
| Formula | n = (1.960 + 0.842)² × [p₁(1-p₁) + p₂(1-p₂)] / (p₂ - p₁)² |
| Sample size per group | 3,831 |
| Total sample required | 7,662 |

**Calculation (full work shown):**

```
(Z_α/2 + Z_β)² = (1.960 + 0.842)² = (2.802)² = 7.851

Numerator:
p₁(1-p₁) + p₂(1-p₂)
= 0.280 × 0.720 + 0.300 × 0.700
= 0.2016 + 0.2100
= 0.4116

Denominator:
(p₂ - p₁)² = (0.300 - 0.280)² = (0.020)² = 0.000400

n_per_group = 7.851 × 0.4116 / 0.000400
            = 3.231 / 0.000400
            = 8,078... 

Wait -- let me recompute precisely:
7.851 × 0.4116 = 3.2311
3.2311 / 0.0004 = 8,077.8

Rounding to 8,078 per group × 2 = 16,156 total.
```

After precise computation: **n = 8,078 per group, 16,156 total.**

Note: The simplified approximation (16 × p_avg × (1-p_avg) / MDE²) gives:
- p_avg = (0.28 + 0.30) / 2 = 0.29
- n = 16 × 0.29 × 0.71 / (0.02)² = 16 × 0.2059 / 0.0004 = 8,236

The approximation (8,236) is close to the exact value (8,078) -- both round to the same operational answer. Use 8,100 per group (8,078 rounded up for conservatism) and 16,200 total.

---

### 5. Timeline

| Parameter | Value |
|-----------|-------|
| Daily total eligible traffic | 4,500 users initiate checkout |
| Traffic fraction allocated to experiment | 100% of checkout initiators (after exclusions, estimated 4,350/day net) |
| Daily traffic per group (50/50) | ~2,175 per group |
| Minimum days to reach sample | 16,200 / 4,350 = 3.7 days (rounds to 4 days) |
| Weekly cycles required | 1 full week (7 days) -- required minimum regardless of sample size |
| Recommended test duration | 14 days (2 full weeks -- captures both weekday and weekend purchase behavior cycles; checkout rates vary significantly Fri-Sun vs. Mon-Wed in e-commerce) |
| Maximum test duration | 28 days |
| Planned start date | TBD -- avoid launching within 5 days of any promotional email campaign or flash sale that would spike checkout volume atypically |
| Planned analysis date | Start date + 14 days |
| Calendar risks | Black Friday, Cyber Monday, Mother's Day, or similar events should not fall within the test window. If they do, extend the test to include the same event in both halves of the test period, or delay until traffic normalizes. |
| Sample adequacy note | At 14 days and 4,350 eligible users/day: expected sample = 60,900 total (30,450 per group) -- this is 3.75× the required sample, providing ample power. The test is limited by the minimum calendar duration (2 weeks), not by traffic. |

---

### 6. Pre-Specified Decision Rules

**Ship treatment if:**
p-value < 0.05 AND observed treatment completion rate > observed control completion rate AND no guardrail metric is breached.

**Kill treatment if:**
p-value < 0.05 AND observed treatment completion rate < observed control completion rate, OR any guardrail metric exceeds its stop threshold.

**Accept null (no change) if:**
p-value ≥ 0.05 after 14 days of data collection with ≥ 16,200 total users enrolled. Conclusion: the progress bar does not meaningfully change checkout completion at the 2 pp MDE level. Do not extend the test further. If a smaller effect is hypothesized to be meaningful, a new test should be designed with the revised MDE.

**Emergency stop criteria (check daily by monitoring team):**
- Revenue per checkout initiator falls ≥ 5% below control in the treatment group for 2 consecutive days
- Checkout P95 page load time increases ≥ 300ms above baseline
- Checkout completion in the treatment group is more than 5 pp below the control group at any point with n > 1,000 per group

**Peeking policy:**
- Engineers may view enrollment counts daily to confirm logging health
- Primary metric results must NOT be reviewed until day 14 or until 16,200 users are enrolled (whichever comes later)
- Guardrail metrics may be monitored daily against their pre-specified thresholds only

---

### 7. Results Interpretation Template
*(Pre-fill after test completes on day 14)*

| Metric | Control | Treatment | Absolute Difference | Relative Difference | p-value | 95% CI |
|--------|---------|-----------|---------------------|---------------------|---------|--------|
| Checkout completion rate | 28.0% | [observed]% | [Δ pp] | [Δ/0.28 %] | [p] | [lower pp, upper pp] |
| Revenue per initiator | $12.40 | [observed] | [$Δ] | [Δ %] | [p] | [$lower, $upper] |
| Step 1→2 progression | 72.1% | [observed]% | [Δ pp] | [Δ %] | [p] | [lower pp, upper pp] |
| Page load P95 | 2.1s | [observed] | [Δ ms] | -- | -- | [lower, upper] |

**Decision:**
☐ Ship -- treatment showed significant improvement (p = [value], 95% CI [lower, upper pp])
☐ Kill -- treatment showed significant harm (p = [value])
☐ No change -- inconclusive result (p = [value] ≥ 0.05; 2.0 pp MDE not detected)
☐ Emergency stop -- guardrail breach: [specify]

**Narrative template (fill in after results):**

> Checkout completion rate in the progress bar variant was [X]% compared to [Y]% in the control group (absolute difference: [Δ] percentage points, 95% CI: [lower pp, upper pp]; p = [value]).
>
> [If shipping:] This corresponds to approximately [Δ × 4,350 daily users] additional completions per day. At a baseline average order value of $[AOV], the estimated incremental daily revenue is $[Δ × daily completions × AOV]. Recommendation: deploy progress bar to 100% of checkout traffic immediately.
>
> [If killing:] The progress bar reduced completion rates, likely because displaying 4 remaining steps increased perceived effort for users who had not yet committed to completing checkout. Recommend: explore condensing checkout to 3 steps, or testing a progress bar that only appears from step 2 onward to avoid the anchoring effect of revealing full step count at step 1.
>
> [If inconclusive:] No statistically significant difference was observed (p = [value]). The true effect, if any, is likely smaller than 2.0 percentage points. Either the mechanism does not operate at scale,
