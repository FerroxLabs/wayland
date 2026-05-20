---
name: hypothesis-testing
description: |
  Walks through hypothesis testing for a specific business question. Defines null and alternative hypotheses, selects the specific test (t-test, chi-square, ANOVA, Mann-Whitney), specifies the decision rule, and interprets the result in plain language.
  Use when the user wants to determine if a difference, trend, or relationship in their data is statistically meaningful or likely due to chance.
  Do NOT use for exploratory data profiling (use eda-framework), correlation without causation testing (use correlation-analysis), or building predictive models (use regression-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "statistics analysis data-science"
  category: "data-analysis"
  subcategory: "exploratory-data-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Hypothesis Testing

## When to Use

**Use this skill when:**
- The user asks whether a difference between two groups is "real," "statistically significant," or "due to chance" -- including A/B test results, before/after comparisons, and control vs. treatment outcomes
- The user has already collected data and needs to determine whether an observed pattern (higher revenue, lower churn, different click-through rates) reflects a genuine effect or random noise
- The user provides a p-value, test statistic, or confidence interval and needs help interpreting it in the context of their business decision
- The user wants to compare more than two groups simultaneously -- e.g., "Do customers from three different acquisition channels have different lifetime values?"
- The user has categorical outcome data and wants to know if group membership is associated with an outcome -- e.g., "Do users who saw the new banner convert at a different rate?"
- The user asks specifically about p-values, Type I errors, Type II errors, power, effect size, or confidence intervals in the context of a specific claim
- The user ran a survey, experiment, or audit and wants to know whether their findings are generalizable or could have happened by chance in a sample of this size

**Do NOT use when:**
- The user wants to explore an unfamiliar dataset without a specific question to answer -- use `eda-framework` instead to profile, summarize, and surface patterns before formulating a testable claim
- The user wants to quantify the strength or direction of a linear relationship between two continuous variables -- use `correlation-analysis`, which covers Pearson r, Spearman rho, and scatterplot interpretation
- The user wants to build a model that predicts an outcome from one or more predictors -- use `regression-guide`, even if the user uses the word "test" informally
- The user wants to design an experiment from scratch -- sample size calculation, randomization strategy, control group construction, and power analysis belong in `ab-test-design`
- The user is working with time-series data and wants to test whether a metric changed after an intervention over time -- use `causal-impact-analysis` (e.g., interrupted time series, Bayesian structural time series)
- The user wants to determine whether a dataset follows a particular distribution -- use `distribution-fitting` for goodness-of-fit testing against theoretical distributions in a modeling context

---

## Process

### Step 1: Understand the Business Question and Data Structure

Before selecting any statistical test, extract the exact claim the user wants to test and understand the shape of their data.

- Ask: **What specific comparison or claim is the user making?** Reformulate the question in the form "Is [metric] different/higher/lower in [Group A] vs. [Group B]?" This forces precision -- vague questions like "did performance improve?" need to become "did average weekly sales per store increase from Q1 to Q2?"
- Identify the **unit of observation**: Is one row one customer, one session, one transaction, one day? Misidentifying the unit inflates or deflates sample sizes and can invalidate the test entirely.
- Ask: **Are the two groups independent or paired?** Independent means different people/units in each group. Paired means the same people/units measured under two conditions or at two time points. Applying an independent test to paired data loses statistical power -- the within-subject variance that a paired test removes gets treated as noise.
- Establish **what is being measured**: Is the outcome a continuous number (revenue, time on page, weight), a binary outcome (converted/did not convert, churned/did not churn), an ordinal score (satisfaction rating 1--5), or a count (number of support tickets)?
- Record the **sample size in each group**, the **observed means or proportions**, and the **spread** (standard deviation if available). This information drives every subsequent decision.
- Flag immediately if the user is testing more than one comparison on the same dataset -- this is the multiple comparisons problem and must be addressed before any test is run, not after results are reported.

---

### Step 2: Formulate the Null and Alternative Hypotheses

This is the most intellectually critical step. Sloppy hypothesis formulation leads to testing the wrong thing and drawing invalid conclusions.

- Write the **null hypothesis (H0)** as the statement of no effect, no difference, or no relationship. H0 is the default position that requires evidence to overturn. Examples: "The mean session duration is the same for users who saw Version A and users who saw Version B." "Conversion rate is independent of which landing page variant the user was shown."
- Write the **alternative hypothesis (H1 or Ha)** as the specific claim the user wants to support with evidence. This is NOT "H0 is wrong" -- it is a precise, testable statement of the expected direction or existence of an effect. Examples: "Users who saw Version B have a higher mean session duration than users who saw Version A." "Conversion rate differs between landing page variants."
- Determine **directionality**:
  - **One-tailed (directional):** The user has a specific directional prediction before looking at the data ("Version B will be better"). Use when the business decision only acts on one direction -- you would only implement B if it is higher, never if it is lower. One-tailed tests have more power to detect an effect in the predicted direction but cannot detect effects in the opposite direction.
  - **Two-tailed (non-directional):** The user wants to detect any difference regardless of direction. This is the correct default for most business hypothesis tests because an unexpected reversal (the new feature hurts users) is also a meaningful finding.
  - **Critical rule:** The direction must be decided BEFORE looking at the data. Switching from two-tailed to one-tailed after observing which direction the data leans is p-hacking and produces invalid results.
- Write both hypotheses in **plain language first**, then in formal notation. This prevents the mathematical notation from obscuring whether you are testing the right thing.

---

### Step 3: Select the Statistical Test

Use this decision framework systematically. Do not let the user's preferred test override the correct test for their data.

**Category 1 -- Comparing a continuous metric between two independent groups:**
- n ≥ 30 in both groups AND the metric is approximately normally distributed (or the distribution is roughly symmetric without extreme outliers): **Independent samples t-test (Welch's version)** -- Welch's t-test does not assume equal variances between groups and is preferred over Student's t-test in almost all business data applications. It adjusts the degrees of freedom automatically.
- n < 30 in either group OR the metric is heavily skewed (e.g., revenue, session length, support ticket resolution time, any metric with a long right tail): **Mann-Whitney U test** -- this is a rank-based non-parametric test that compares whether values from one group tend to be larger than values from the other. It does not require normality and is robust to outliers.
- Rule of thumb on skewness: if the mean is more than 2x the median in either group, the distribution is likely too skewed for a t-test with small samples.

**Category 2 -- Comparing a continuous metric before and after in the same subjects (paired data):**
- n ≥ 30 paired observations AND the differences (after minus before) are approximately normally distributed: **Paired t-test**
- n < 30 OR the differences are skewed: **Wilcoxon signed-rank test** -- ranks the absolute differences and tests whether positive differences dominate negative differences.

**Category 3 -- Comparing a continuous metric across three or more independent groups:**
- n ≥ 30 per group AND approximately normal or symmetric distributions: **One-way ANOVA (Analysis of Variance)** -- tests whether at least one group mean differs significantly from the others. If ANOVA rejects H0, follow with a post-hoc test: **Tukey's HSD** when all pairwise comparisons are needed, **Dunnett's test** when comparing multiple groups against a single control, **Bonferroni correction** when the number of comparisons is small and controlled in advance.
- n < 30 per group OR skewed distributions: **Kruskal-Wallis test** -- non-parametric generalization of ANOVA. Follow with **Dunn's test** with Bonferroni correction for pairwise comparisons.

**Category 4 -- Comparing proportions or rates between two groups:**
- Both groups have large samples (expected cell counts ≥ 5 for all cells): **Chi-square test of independence** or **two-proportion z-test** -- these are mathematically equivalent for 2x2 tables. The two-proportion z-test is easier to set up manually and gives a z-statistic that is more interpretable.
- Any expected cell count < 5: **Fisher's exact test** -- computationally exact for small samples, no large-sample approximation needed.
- One group vs. a known or claimed proportion (e.g., "is our 4.2% defect rate different from the industry standard of 3.0%?"): **One-sample proportion z-test**

**Category 5 -- Comparing proportions before and after in the same subjects (paired binary data):**
- Same users or units with a binary outcome measured at two time points: **McNemar's test** -- only uses the discordant pairs (people who changed their response), ignoring those who stayed the same.

**Category 6 -- Testing whether a continuous variable's mean equals a claimed value:**
- "Is our average delivery time of 4.3 days different from our SLA of 4 days?": **One-sample t-test** (n ≥ 30 or data normal) or **Wilcoxon signed-rank test against a known median** (n < 30 or skewed)

**Normality checking guidance:** For samples over 50, normality rarely matters due to the Central Limit Theorem -- the sampling distribution of the mean will be approximately normal regardless of the underlying data. For samples under 30, check normality with a Shapiro-Wilk test (use the non-parametric alternative if p < 0.05 on Shapiro-Wilk) or a Q-Q plot. For samples between 30 and 50, use judgment based on how severely skewed the data appears.

---

### Step 4: Verify Test Assumptions

Every test has assumptions. Checking them prevents invalid results.

- **Independence of observations:** Each data point must come from a different subject or unit, with no subject appearing in both groups (for independent tests). Violations occur when the same customer is counted in both control and treatment groups, when store-level data has multiple weeks per store without accounting for clustering, or when transactions from the same user are treated as independent observations.
- **Equal variance assumption (for Student's t-test):** Use Welch's t-test to avoid this assumption entirely. If the tool forces Student's t-test, run Levene's test for equality of variances -- if Levene's p < 0.05, variances are significantly unequal and Welch's must be used.
- **Minimum expected cell counts (for chi-square):** Compute expected counts as (row total × column total) / grand total for each cell. If any expected count is below 5, switch to Fisher's exact test.
- **Sufficient sample size for proportions tests:** For the two-proportion z-test, both np and n(1-p) must be ≥ 10 for each group, where p is the observed proportion.
- **Paired data alignment:** For paired tests, ensure the pairing is meaningful and complete -- every subject in the before group must have a corresponding after measurement. Missing pairs must be dropped from analysis (not imputed) unless missingness is explicitly handled.

---

### Step 5: Set the Significance Level, Power, and Decision Rule

- **Alpha (α) -- the significance level:** The probability of rejecting H0 when H0 is actually true (Type I error -- false positive). Standard default is α = 0.05. Use α = 0.01 when the cost of a false positive is high (medical, safety, regulatory decisions). Use α = 0.10 only in exploratory, low-stakes contexts where missing a real effect (Type II error) is more costly than acting on a false one.
- **Beta (β) -- Type II error rate:** The probability of failing to reject H0 when H1 is actually true (false negative). Statistical power = 1 -- β. The standard target is 80% power (β = 0.20), meaning you have an 80% chance of detecting a true effect of the specified size. Power below 70% means the test is likely underpowered -- a non-significant result does not rule out a real effect.
- **Decision rule:** State it explicitly before seeing results -- "Reject H0 if p-value < 0.05. Fail to reject H0 if p-value ≥ 0.05." This prevents moving the goalposts after seeing the data.
- **Confidence intervals as a complement:** A 95% confidence interval provides the range of plausible values for the true effect size. If the CI for the difference excludes 0, the result is significant at α = 0.05. Always report the CI alongside the p-value -- it communicates both significance and precision in one number.
- **Multiple comparisons:** If the user is running k simultaneous tests, use the **Bonferroni correction**: α_adjusted = 0.05 / k. For 5 tests, each individual test must achieve p < 0.010 to be considered significant. For 10 tests, p < 0.005. Alternatively, use the **Benjamini-Hochberg procedure** to control the false discovery rate (FDR) rather than the family-wise error rate -- this is less conservative and appropriate when testing many hypotheses simultaneously (e.g., genomics, multi-metric analysis).

---

### Step 6: Provide Exact Implementation Instructions

Give precise, tool-specific instructions based on what the user has available.

**Python (scipy.stats):**
- Independent t-test (Welch's): `scipy.stats.ttest_ind(group_a, group_b, equal_var=False)` -- returns the t-statistic and two-tailed p-value
- Mann-Whitney U: `scipy.stats.mannwhitneyu(group_a, group_b, alternative='two-sided')` -- use `alternative='greater'` or `'less'` for one-tailed
- Paired t-test: `scipy.stats.ttest_rel(before, after)`
- Wilcoxon signed-rank: `scipy.stats.wilcoxon(before, after)`
- One-way ANOVA: `scipy.stats.f_oneway(group1, group2, group3)`
- Chi-square: `scipy.stats.chi2_contingency(contingency_table)` -- returns chi2, p, degrees of freedom, expected frequencies
- Fisher's exact: `scipy.stats.fisher_exact([[a, b], [c, d]])` -- pass the 2x2 contingency table
- Two-proportion z-test: `statsmodels.stats.proportion.proportions_ztest([count1, count2], [nobs1, nobs2])`

**R:**
- Welch's t-test: `t.test(x, y, var.equal = FALSE)`
- Mann-Whitney: `wilcox.test(x, y, paired = FALSE)`
- Paired t-test: `t.test(before, after, paired = TRUE)`
- One-way ANOVA: `aov(value ~ group, data = df)` followed by `summary()` and `TukeyHSD()` for post-hoc
- Chi-square: `chisq.test(table(data$group, data$outcome))`
- Fisher's exact: `fisher.test(matrix(c(a, b, c, d), nrow = 2))`

**Excel:**
- Independent t-test: Data tab → Data Analysis → t-Test: Two-Sample Assuming Unequal Variances. Variable 1 Range = Group A column, Variable 2 Range = Group B column, Alpha = 0.05. Read "P(T<=t) two-tail" from the output.
- Paired t-test: Data Analysis → t-Test: Paired Two Sample for Means.
- One-way ANOVA: Data Analysis → Anova: Single Factor.
- Chi-square: Use CHISQ.TEST(actual_range, expected_range) where expected range is computed manually as (row_total × col_total) / grand_total.
- Two-proportion z-test: Must be computed manually using the formula structure provided in Step 7 below.

**Google Sheets:**
- Use `=T.TEST(range_a, range_b, tails, type)` where tails = 2 for two-tailed, type = 2 for independent equal variance, type = 3 for Welch's (unequal variance), type = 1 for paired.
- Chi-square: `=CHITEST(actual_range, expected_range)` returns the p-value directly.

---

### Step 7: Compute and Interpret the Results

When the user provides actual test output, interpret every relevant number.

- **The test statistic** (t, z, F, chi-square, U): Report it with context. A t-statistic of 2.45 means the observed difference is 2.45 standard errors away from zero. Larger absolute values indicate stronger evidence against H0.
- **Degrees of freedom (df):** Report alongside the test statistic in parenthetical notation: t(47.3) = 2.45. For ANOVA, report both the between-groups and within-groups df: F(2, 145) = 4.83.
- **The p-value:** Report to 3 decimal places (p = 0.023) unless it is very small, in which case report p < 0.001 rather than p = 0.000000. Never report p = 0.000 -- that implies mathematical impossibility.
- **Effect size:** Statistical significance tells you whether an effect exists. Effect size tells you how big it is. Always compute and report:
  - For two-group mean comparisons: **Cohen's d** = (mean_A -- mean_B) / pooled standard deviation. Benchmarks: d = 0.2 is small, d = 0.5 is medium, d = 0.8 is large (Cohen, 1988 conventions).
  - For ANOVA: **Eta-squared (η²)** = SS_between / SS_total. Values: 0.01 = small, 0.06 = medium, 0.14 = large.
  - For chi-square / proportions: **Risk difference** (p1 -- p2), **relative risk** (p1 / p2), or **odds ratio** ((p1/(1-p1)) / (p2/(1-p2))). In business contexts, relative risk and absolute risk difference are more interpretable than odds ratios.
  - For Mann-Whitney or Kruskal-Wallis: **rank-biserial correlation (r)** = 1 -- (2U / n1*n2). Values: r = 0.1 small, r = 0.3 medium, r = 0.5 large.
- **Confidence interval:** Report the 95% CI for the difference (or ratio). "The mean session duration for Group B was 12.4 seconds longer than Group A (95% CI: 3.1 to 21.7 seconds)."
- **Plain language conclusion:** Write a single sentence that any stakeholder could understand without statistical training, followed by the business implication.
- **Practical significance assessment:** Compare the effect size to the minimum meaningful difference for the business context. A statistically significant improvement of 0.2 seconds in page load time may not justify a six-week engineering sprint. A statistically significant 0.3 percentage point improvement in conversion rate may represent millions of dollars in revenue.

---

### Step 8: State Limitations and Recommend Next Steps

No test result exists in a vacuum.

- State what the test **does not prove**: Statistical significance does not establish causation. A significant result means the data is unlikely under H0, not that H1 is certainly true. If the data comes from an observational study (not a randomized experiment), confounding variables could explain the result.
- Flag **data quality issues** that affect validity: non-random sampling, selection bias, measurement error, or survivorship bias in the data. A significant test result from biased data is a confident wrong answer.
- Recommend **what to do if the result is not significant**: (a) check whether the test was adequately powered -- compute post-hoc power using the observed effect size and sample size; (b) consider whether the test ran long enough to accumulate sufficient data; (c) recommend collecting more data only if there is genuine uncertainty about whether a meaningful effect exists, not as a way to hunt for significance.
- For significant results: Recommend **replication** with a new data sample before making irreversible decisions. A single significant result at α = 0.05 still has a 5% false positive rate -- if 20 tests were run on the same dataset, approximately 1 will be significant by chance alone.

---

## Output Format

```
## Hypothesis Test Report

### Business Question
[State the question in the user's language, refined to be specific and testable]

### Data Summary
| Parameter              | Group A (Control)     | Group B (Treatment)   |
|------------------------|-----------------------|-----------------------|
| Sample size (n)        |                       |                       |
| Mean / Proportion      |                       |                       |
| Std. Dev. (if numeric) |                       |                       |
| Observed difference    | [B minus A, or ratio] |                       |

### Hypotheses
- **H0 (Null):** [Plain language statement of no effect]
  Formal: [μ_A = μ_B] or [p_A = p_B] or [appropriate notation]
- **H1 (Alternative):** [Plain language statement of the expected effect]
  Formal: [μ_B > μ_A] or [p_A ≠ p_B] or [appropriate notation]
- **Direction:** [One-tailed / Two-tailed] -- [reason for this choice]

### Assumptions Check
| Assumption             | Status          | Notes                          |
|------------------------|-----------------|--------------------------------|
| Independent observations | Met / Violated |                                |
| Sample size adequacy    | Met / Violated  |                                |
| Normality / Distribution | Met / N/A / Concern | [Shapiro-Wilk p or visual check] |
| Equal variance (if applicable) | Met / Not required |                      |
| Expected cell counts (if chi-square) | Met / Violated |                 |

### Test Selection
- **Test:** [Exact test name, e.g., "Two-proportion z-test (two-tailed)"]
- **Rationale:** [1--2 sentences citing data type, sample sizes, and distribution shape]
- **Alternative considered:** [Name the next-best alternative and why it was not selected]

### Implementation Instructions
[Tool-specific steps: code block for Python/R, cell references for Excel/Sheets]

### Decision Rule
- **Significance level (α):** 0.05 [note if adjusted for multiple comparisons]
- **Reject H0 if:** p-value < 0.05
- **Fail to reject H0 if:** p-value ≥ 0.05

### Results
| Metric                | Value        |
|-----------------------|--------------|
| Test statistic        | [t/z/F/χ² = ] |
| Degrees of freedom    |              |
| p-value               |              |
| 95% Confidence interval for difference | [ , ] |
| Effect size           | [Cohen's d / odds ratio / η² / r =] |
| Effect size benchmark | [Small / Medium / Large] |

### Statistical Interpretation
[One paragraph: test name, groups compared, test statistic with df, p-value, direction of effect,
confidence interval, and whether H0 is rejected or not rejected]

### Plain Language Conclusion
> [One to two sentences a non-statistician would understand, including the actual numbers
> and what they mean for the decision at hand]

### Practical Significance Assessment
- **Observed difference:** [absolute and relative]
- **Effect size classification:** [small / medium / large by domain standards]
- **Minimum meaningful difference for this context:** [user-defined or inferred]
- **Business verdict:** [Is the effect large enough to act on, independent of the p-value?]

### Caveats and Next Steps
- [Causation caveat if observational data]
- [Sample representativeness note if relevant]
- [Power note if result is non-significant]
- [Recommended action]
```

---

## Rules

1. **Never conflate statistical significance with practical significance.** A p-value of 0.0001 with a Cohen's d of 0.04 means the effect is real but tiny. Always compute and report effect size alongside the p-value. The business decision rests on whether the effect is large enough to matter, not just whether it exists.

2. **Never say "the null hypothesis is true" or "there is no difference."** When p ≥ 0.05, the correct statement is "we fail to reject the null hypothesis" -- this means the data does not provide sufficient evidence to conclude there is an effect, not that there definitely is no effect. Absence of evidence is not evidence of absence, particularly in underpowered studies.

3. **Always use Welch's t-test instead of Student's t-test for independent group comparisons.** Student's t-test assumes equal population variances, which is almost never verifiable and often violated. Welch's t-test performs equally well when variances are equal and is more reliable when they are not. Default to Welch's in all tools that offer both.

4. **Enforce the one-tailed vs. two-tailed decision before the data is examined.** If the user changes from two-tailed to one-tailed after seeing which direction the data leans, this halves the p-value without additional evidence and constitutes p-hacking. Flag this explicitly. Default to two-tailed unless there is a documented, pre-specified directional hypothesis.

5. **Apply the Bonferroni correction (α / k) whenever more than one hypothesis is tested on the same dataset.** Explain to the user that running 20 comparisons at α = 0.05 yields approximately 1 false positive on average even when no real effects exist. For large numbers of comparisons (k > 10), recommend the Benjamini-Hochberg FDR procedure instead of Bonferroni, since Bonferroni becomes overly conservative.

6. **Switch to a non-parametric test for samples under 30 unless normality is verified.** The Central Limit Theorem does not protect you at n < 30. Run a Shapiro-Wilk test (p < 0.05 indicates non-normality) and inspect a histogram or Q-Q plot. A t-test on n = 12 skewed observations is unreliable. State this clearly and recommend Mann-Whitney or Wilcoxon as appropriate.

7. **Identify and correct paired vs. independent data confusion before any test is run.** Before/after comparisons on the same subjects require paired tests, which remove within-subject variability and are substantially more powerful than independent tests on the same data. If a user presents a before/after dataset as two independent groups, correct this immediately and re-run as paired.

8. **For chi-square tests, always compute expected cell counts before running the test.** If any expected count is below 5, Fisher's exact test is required. The chi-square approximation breaks down at small expected counts and produces misleading p-values. This is a non-negotiable check, not an optional one.

9. **Report p-values to 3 decimal places and never as just p < 0.05.** Writing "p < 0.05" without the actual value discards information. The difference between p = 0.048 (barely significant) and p = 0.003 (strongly significant) is meaningful for interpreting the strength of evidence. Report p < 0.001 only when the value is genuinely that small -- never report p = 0.000.

10. **For ANOVA results that reject H0, always follow up with a post-hoc pairwise comparison test.** ANOVA only tells you that at least one group is different -- it does not identify which groups differ. Without a post-hoc test (Tukey's HSD for all-pairs, Dunnett's for control comparisons), the ANOVA result is incomplete and unactionable. State which pairs are significantly different and provide the adjusted p-values.

---

## Edge Cases

### Very Large Sample Sizes (n > 10,000 per group)
With sample sizes in the tens of thousands, even trivially small differences achieve statistical significance. A p-value of 0.000001 might correspond to a difference of 0.003 seconds in page load time or a 0.05 percentage point difference in conversion rate -- statistically robust, but commercially irrelevant. In this regime, **de-emphasize the p-value entirely** and center the analysis on effect size and the confidence interval. Ask the user: "What is the smallest difference that would change your business decision?" Then check whether the observed effect exceeds that threshold. Report Cohen's d or the absolute risk difference prominently. A useful heuristic: with n > 50,000, almost any non-zero difference will be significant -- the question is never "is it real?" but always "is it large enough to act on?"

### User Has Results but Does Not Know What Test Was Run
Ask for the test statistic name and value, the degrees of freedom if reported, the p-value, and the software that produced the output. Identify the test from the statistic symbol: t indicates a t-test or Welch's t-test, z indicates a z-test or proportions test, χ² (or X-squared) indicates chi-square, F indicates ANOVA or an F-test, U indicates Mann-Whitney, H indicates Kruskal-Wallis, W indicates Wilcoxon signed-rank. If the user only has a p-value with no other context, interpret it against α = 0.05 but explicitly state: "Without knowing the test that generated this p-value, I cannot verify that the correct test was used, that assumptions were met, or that the effect size is meaningful. I recommend obtaining the full output."

### Unequal and Severely Imbalanced Sample Sizes
When one group is 10x or more larger than the other (e.g., 50 in the treatment group vs. 5,000 in the control), standard tests remain mathematically valid but the interpretation requires care. Welch's t-test handles unequal n automatically. For chi-square and proportions tests, unequal sample sizes do not violate assumptions but they do affect the width of confidence intervals asymmetrically. Flag that the precision of the estimate for the smaller group dominates the precision of the overall comparison. Also check: with a very small treatment group (n < 30), power may be too low to detect effects of business-relevant magnitude even if the control group is enormous.

### Multiple Metrics Tested Simultaneously on the Same Experiment
This is extremely common in product analytics: a single A/B test has a primary metric (conversion rate) and 10 secondary metrics (bounce rate, session duration, pages per session, revenue per visitor, etc.). Testing all 11 metrics at α = 0.05 with no correction yields an expected 0.55 false positives under the global null -- roughly a 43% chance of at least one false positive. Prescribe: (1) designate one metric as the primary endpoint in advance; (2) report secondary metrics descriptively unless they are pre-specified; (3) apply Bonferroni or Benjamini-Hochberg correction if secondary metrics are also tested formally; (4) use the primary metric alone to make the go/no-go decision.

### Clustered or Hierarchical Data Treated as Independent
Business data is frequently clustered: users within stores, transactions within customers, students within classrooms, calls within agents. Treating clustered data as independent observations inflates the effective sample size and produces p-values that are systematically too small -- false positives are much more likely. Identify clustering when the user describes data where multiple rows belong to the same higher-level unit. Recommend: use the customer-level (or store-level) aggregate as the unit of analysis rather than the transaction-level row, or apply a mixed-effects model or a cluster-robust standard error correction. A t-test on 50,000 transactions from 500 customers has approximately the same statistical power as a t-test on 500 independent observations, not 50,000.

### The User Wants to Interpret a Non-Significant Result as Proof of Equivalence
A common business scenario: "We tested the new process and found no significant difference -- therefore it performs the same as the old one." This is a logical error unless the study was explicitly designed as an **equivalence test** or a **non-inferiority test**. Explain: a non-significant result could mean (a) there is no meaningful effect, (b) the study was underpowered, or (c) the true effect is small but real. To formally conclude equivalence, the user needs to pre-specify an equivalence margin (e.g., ±10% of the control mean), run a Two One-Sided Tests (TOST) procedure, and demonstrate that the 90% confidence interval for the difference lies entirely within the equivalence margin. Guide the user through TOST if this is the actual business question.

### Pre-Test Data Imbalance (Failing the Sanity Check)
Before interpreting a test result, verify that the randomization worked: run the same test comparing the control and treatment groups on a pre-treatment metric that should not be affected (e.g., prior-period revenue, demographics, tenure). If this sanity check yields p < 0.05, the groups were not comparable at baseline and the treatment effect estimate is confounded. This is called a **balance check** or **A/A test equivalent**. A failed balance check does not mean the experiment is worthless, but the analysis must shift to a difference-in-differences approach or regression adjustment to control for baseline differences before the treatment effect can be estimated.

### One-Sample Tests Against a Claimed Standard
The user asks: "Our defect rate is 2.8% this quarter. Our contractual SLA is below 3.0%. Are we compliant?" This requires a one-sample test, not a two-group comparison. For proportions: one-sample z-test where H0: p = 0.030 and H1: p < 0.030 (one-tailed). For means: one-sample t-test where H0: μ = 4.0 days. The key distinction is that the reference value (3.0%, 4.0 days) is a **known constant**, not an estimate from a second sample, so no standard error for the reference group is needed. The null value is treated as exact.

---

## Example

**Input:** "We rolled out a new email subject line for our monthly newsletter last month. The old subject line had a 22.1% open rate across 14,200 sends. The new subject line had a 24.7% open rate across 11,800 sends. Is this improvement statistically significant? We want to know if we should permanently switch to the new subject line."

---

## Hypothesis Test Report

### Business Question
Did the new email subject line produce a higher open rate than the old subject line, and is this improvement large enough and reliable enough to justify permanently switching?

### Data Summary
| Parameter              | Group A (Old subject line) | Group B (New subject line) |
|------------------------|---------------------------|---------------------------|
| Sample size (n)        | 14,200 sends              | 11,800 sends              |
| Observed open rate     | 22.1% (3,138 opens)       | 24.7% (2,915 opens)       |
| Observed difference    | +2.6 percentage points (new minus old) |                |
| Relative change        | +11.8% relative improvement |                          |

### Hypotheses
- **H0 (Null):** The open rate is the same for the old and new subject lines.
  Formal: p_old = p_new
- **H1 (Alternative):** The new subject line has a higher open rate than the old subject line.
  Formal: p_new > p_old
- **Direction:** One-tailed -- the business decision is whether to implement the new version. A lower open rate would not lead to switching; only an improvement is actionable. The directional hypothesis was specified before observing the data direction (new subject line was designed to improve opens).

### Assumptions Check
| Assumption              | Status | Notes                                                      |
|-------------------------|--------|------------------------------------------------------------|
| Independent observations | Met    | Different email recipients in each cohort; no recipient appears in both sends |
| Sample size adequacy    | Met    | np and n(1-p) both >> 10 for both groups (3,138 and 2,915 opens; 11,062 and 8,885 non-opens) |
| Large sample for z-test | Met    | n = 14,200 and 11,800 comfortably satisfy the large-sample approximation |
| Expected cell counts    | Met    | All expected counts > 5 (chi-square equivalent condition satisfied) |

### Test Selection
- **Test:** Two-proportion z-test (one-tailed, testing p_new > p_old)
- **Rationale:** The outcome is binary (opened / did not open), the two groups are independent (different recipients), and both sample sizes are large (14,200 and 11,800), satisfying the large-sample approximation for the normal distribution of the difference in proportions.
- **Alternative considered:** Chi-square test of independence would also be valid and gives an equivalent result for this 2x2 table, but the two-proportion z-test is preferred here because it directly produces a z-statistic and one-tailed p-value, and because we have a directional hypothesis.

### Implementation Instructions

**Python:**
```python
from statsmodels.stats.proportion import proportions_ztest
import numpy as np

# Data
opens = np.array([3138, 2915])          # old, new
sends = np.array([14200, 11800])        # old, new

# Two-proportion z-test, one-tailed: testing new > old
# Note: proportions_ztest tests prop[0] vs prop[1], so order matters
# We want to test new > old, so pass new as first group
z_stat, p_value = proportions_ztest(
    count=np.array([2915, 3138]),       # new first, old second
    nobs=np.array([11800, 14200]),
    alternative='larger'                # tests first > second
)
print(f"z = {z_stat:.4f}, p = {p_value:.4f}")

# Effect sizes
p_new = 2915 / 11800
p_old = 3138 / 14200
abs_diff = p_new - p_old
rel_diff = abs_diff / p_old
odds_new = p_new / (1 - p_new)
odds_old = p_old / (1 - p_old)
odds_ratio = odds_new / odds_old
print(f"Absolute difference: {abs_diff:.4f}")
print(f"Relative improvement: {rel_diff:.4f}")
print(f"Odds ratio: {odds_ratio:.4f}")
```

**Manual calculation (for Excel or verification):**

Step 1 -- Pooled proportion under H0:
p̂ = (3,138 + 2,915) / (14,200 + 11,800) = 6,053 / 26,000 = 0.23281

Step 2 -- Standard error of the difference under H0:
SE = √[p̂ × (1 -- p̂) × (1/n_old + 1/n_new)]
SE = √[0.23281 × 0.76719 × (1/14,200 + 1/11,800)]
SE = √[0.17864 × (0.00007042 + 0.00008475)]
SE = √[0.17864 × 0.00015517]
SE = √[0.0000027718]
SE = 0.001665

Step 3 -- z-statistic:
z = (p_new -- p_old) / SE = (0.24746 -- 0.22099) / 0.001665 = 0.02647 / 0.001665 = **15.90**

Step 4 -- One-tailed p-value:
p = P(Z > 15.90) ≈ **< 0.001** (this z-value is far beyond the 99.9th percentile of the standard normal distribution; the p-value is effectively zero)

**Excel:**
```
Cell A1: 3138    (old opens)
Cell B1: 14200   (old sends)
Cell C1: 2915    (new opens)
Cell D1: 11800   (new sends)

Pooled p: =(A1+C1)/(B1+D1)          [= 0.23281]
SE:       =SQRT(E1*(1-E1)*(1/B1+1/D1))   [= 0.001665]
p_old:    =A1/B1                     [= 0.22099]
p_new:    =C1/D1                     [= 0.24746]
z:        =(p_new - p_old) / SE      [= 15.90]
p-value:  =1-NORM.S.DIST(z, TRUE)    [≈ 0.000 -- report as < 0.001]
```

### Decision Rule
- **Significance level (α):** 0.05 (one-tailed)
- **Reject H0 if:** p-value < 0.05
- **Fail to reject H0 if:** p-value ≥ 0.05

### Results
| Metric                         | Value                              |
|--------------------------------|------------------------------------|
| Test statistic                 | z = 15.90                          |
| p-value                        | < 0.001                            |
| 95% CI for difference (p_new -- p_old) | +2.13 to +3.07 percentage points |
| Absolute risk difference       | +2.6 percentage points             |
| Relative improvement           | +11.8%                             |
| Odds ratio                     | 1.155                              |
| Effect size classification     | Small-to-medium by absolute difference standards; highly reliable |

**95% Confidence Interval computation:**
For reporting purposes, use the unpooled SE for the CI (not the pooled SE used for the hypothesis test):
SE_unpooled = √[(p_new(1-p_new)/n_new) + (p_old(1-p_old)/n_old)]
= √[(0.24746 × 0.75254 / 11800) + (0.22099 × 0.77901 / 14200)]
= √[0.00001580 + 0.00001213]
= √[0.00002793]
= 0.005285
95% CI = (p_new -- p_old) ± 1.96 × 0.005285 = 0.02647 ± 0.01036 = [+0.0161, +0.0368]
= **+1.61 to +3.68 percentage points**

### Statistical Interpretation
A two-proportion z-test (one-tailed) was conducted to determine whether the new email subject line produced a higher open rate than the old subject line. The new subject line achieved a 24.7% open rate (2,915 opens out of 11,800 sends) compared to 22.1% (3,138 opens out of 14,200 sends) for the old subject line. The test produced z = 15.90, p < 0.001. The 95% confidence interval for the true difference in open rates is +1.61 to +3.68 percentage points. The null hypothesis is rejected. The improvement is not attributable to random variation in email sends.

### Plain Language Conclusion

> The new subject line produced an open rate of 24.7%, compared to 22.1% for the old subject line -- a difference of 2.6 percentage points that is highly statistically significant (p < 0.001). You can be confident this improvement reflects a genuine difference in how recipients respond to the new subject line, not random chance. The true improvement is estimated to be between 1.6 and 3.7 percentage points with 95% confidence.

### Practical Significance Assessment
- **Absolute difference:** +2.6 percentage points (22.1% to 24.7%)
- **Relative improvement:** +11.8% more opens per send
- **Business impact estimate:** At 11,800 sends per month, the new subject line generates approximately 307 additional opens per month (2,915 vs. 2,608 at the old rate). At typical email-to-revenue conversion values for newsletters, this difference can be estimated against the cost of the switch (near zero, since this is a copy change).
- **Effect size classification:** In email marketing, a 2+ percentage point improvement in open rate is considered a commercially meaningful uplift, particularly for a high-volume send. Industry benchmarks for B2C email open rates cluster around 20--25%, making this improvement move the metric from slightly below to solidly above average.
- **Business verdict:** The result is both statistically significant and practically meaningful. The improvement is large, reliable (extremely low p-value, tight confidence interval), and the cost of switching is negligible. Recommendation: implement the new subject line permanently.

### Caveats and Next Steps
- **Causation vs. correlation:** This was not a randomized controlled experiment run simultaneously -- the two sends happened in different months. Factors like day of week, time of day, list freshness, and seasonal variation could partially explain the difference. If perfect certainty is required before switching, run a proper A/B test in which both subject lines are sent to randomly split subsets of the same list on the same day.
- **Novelty effect:** Email audiences sometimes respond positively to anything new. Monitor open rates for the new subject line over the next 2--3 months to confirm the improvement persists.
- **Segment analysis:** The aggregate improvement may mask heterogeneous effects -- some subscriber segments may have driven most of the lift while others showed no change. A follow-up analysis segmenting by acquisition source or engagement tier would increase confidence.
- **Sample representativeness:** The 11,800 sends in the new period vs. 14,200 in the old period may reflect different list sizes or purge cycles. Confirm the composition of both lists is comparable before treating this as a clean comparison.
