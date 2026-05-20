---
name: correlation-analysis
description: |
  Produces a correlation analysis between specified variables. Computes and interprets correlation coefficients, explains the strength and direction of relationships, distinguishes correlation from causation, and identifies potential confounding variables.
  Use when the user wants to understand whether two or more variables move together and how strongly they are related.
  Do NOT use for predicting one variable from another (use regression-guide), testing whether a difference is significant (use hypothesis-testing), or building dashboards (use dashboard-design).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "statistics analysis data-science"
  category: "data-analysis"
  subcategory: "exploratory-data-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Correlation Analysis

## When to Use

**Use this skill when:**
- The user asks whether two or more numeric variables move together ("is customer satisfaction related to churn rate?", "does temperature affect sales?")
- The user wants to compute or interpret a Pearson r, Spearman rho, Kendall tau, or point-biserial coefficient
- The user needs a full correlation matrix to scan multiple variables simultaneously for potential relationships (e.g., feature selection before modeling)
- The user wants to quantify the strength and direction of an association they have already observed visually in a scatter plot
- The user wants to compare correlations across subgroups (e.g., "is the relationship between study hours and test scores different for students who also work part-time?")
- The user is conducting exploratory data analysis before building a regression model and needs to identify multicollinearity candidates
- The user wants to know whether correlations in their dataset are stable over time (rolling or windowed correlation)
- The user is computing a correlation matrix for portfolio risk analysis, psychometric scale validation, or epidemiological cohort studies

**Do NOT use when:**
- The user wants to predict the value of one variable from another -- even a strong correlation does not give a prediction equation (use `regression-guide` instead)
- The user wants to test whether a mean difference between two or more groups is statistically significant (use `hypothesis-testing` with t-test or ANOVA)
- The user wants to understand relationships between two purely categorical variables with 3+ levels (use chi-square test via `hypothesis-testing`)
- The user has already established correlation and now wants to determine causation -- correlation analysis cannot do this; direct them toward controlled experiments, difference-in-differences, or instrumental variable analysis
- The user wants to build a dashboard or visualize correlation trends interactively (use `dashboard-design`)
- The user wants to cluster variables by their correlation patterns into latent factors (use principal component analysis or factor analysis, which are separate skills)
- The user has a time-series dataset and wants to know whether one variable leads or lags another -- this requires cross-correlation functions (CCF) and is a distinct analysis from static correlation

---

## Process

### Step 1: Clarify the Question and Audit the Data

Before touching any numbers, establish the analytical foundation.

- Ask the user to name the specific variables, their units of measurement, and their data types (continuous ratio, continuous interval, ordinal ranked, binary dichotomous)
- Ask for the sample size (N). If N < 30, flag immediately -- see Edge Cases
- Ask whether the data represents individuals, groups (aggregates), or repeated measurements on the same subjects. Aggregated data triggers ecological fallacy risk; repeated measurements require intraclass correlation, not Pearson
- Confirm that the observations are independent. If the same person appears multiple times, or data is paired (pre/post measurements), the standard significance test for correlation is invalid
- Ask whether the user has already looked at a scatter plot. If not, instruct them to create one before computing any coefficient -- a scatter plot will reveal outliers, non-linear relationships, ceiling/floor effects, and bimodal distributions that can all make a single correlation coefficient misleading
- Ask whether the variables contain missing values and how they were handled (listwise deletion, pairwise deletion, imputation). Pairwise deletion can cause a correlation matrix to be non-positive-definite if missingness patterns are unequal across pairs

### Step 2: Select the Correct Correlation Method

The choice of method is a domain decision, not a default. Each method measures something different.

- **Pearson r:** Use when both variables are measured on a continuous interval or ratio scale, the relationship is expected to be linear, and the variables are approximately normally distributed. This is appropriate for most physical measurements, financial figures, and test scores. Pearson r measures the proportion of co-variation in standardized units -- it is the slope of the standardized regression line
- **Spearman rho (rs):** Use when either variable is ordinal (Likert ratings, customer satisfaction scores, class ranks), when the data contains extreme outliers that cannot be removed, or when a scatter plot reveals a monotonic but non-linear relationship. Spearman rho is computed as the Pearson r of the rank-transformed data. It asks: "Do the ranks of X agree with the ranks of Y?" not "Do the raw values of X agree with the raw values of Y?"
- **Kendall tau-b:** Prefer over Spearman when the sample is small (N < 30) or when there are many tied ranks. Kendall tau is more robust to perturbation in small samples because it is based on the probability of concordant vs. discordant pairs rather than rank differences. Tau-b adjusts for ties; tau-c is used when the number of distinct ranks differs between the two variables
- **Point-biserial rpb:** Use when one variable is continuous and the other is genuinely binary (passed/failed, treated/untreated, male/female). This is algebraically equivalent to Pearson r computed directly on 0/1 coding of the binary variable -- you do not need a special formula, but labeling it point-biserial makes the interpretation cleaner
- **Biserial rb:** Use when one variable is continuous and the other is an artificially dichotomized continuous variable (e.g., high/low blood pressure created by splitting a continuous measure at a threshold). The biserial coefficient estimates what the Pearson r would have been if both variables had been measured continuously. It always has a larger absolute value than rpb
- **Polychoric correlation:** Use when both variables are ordinal Likert-type responses assumed to reflect underlying continuous latent variables. This is the standard choice in structural equation modeling (SEM) and scale development. It is computationally intensive but far more accurate than applying Pearson r to 5-point scales

**Quick decision tree:**
- Both variables continuous and linear → Pearson
- At least one ordinal, or continuous + outliers, or monotonic non-linear → Spearman
- Small N with ties, or need probability-based interpretation → Kendall tau-b
- One binary + one continuous → Point-biserial
- Both ordinal with latent continuous assumption → Polychoric

### Step 3: Compute the Coefficient

Provide the exact computational approach based on the user's tool.

**Pearson r formula (manual):**
- r = [Σ((xi - x̄)(yi - ȳ))] / [(n-1) * sx * sy]
- Where sx and sy are the sample standard deviations of X and Y
- Equivalently: r = [n*ΣXY - ΣX*ΣY] / sqrt([n*ΣX² - (ΣX)²] * [n*ΣY² - (ΣY)²])

**In spreadsheets (Excel / Google Sheets):**
- Pearson: `=CORREL(A2:A201, B2:B201)` -- handles pairwise automatically
- Pearson (alternate): `=PEARSON(A2:A201, B2:B201)` -- identical result
- Spearman: Rank both columns first with `=RANK.AVG(A2, $A$2:$A$201, 1)` (use RANK.AVG to handle ties correctly by assigning the average rank to tied values), then apply `=CORREL()` to the ranked columns
- R-squared from correlation: `=CORREL(...)^2` -- this is the coefficient of determination
- p-value from r and n: t = r * SQRT((n-2) / (1-r^2)), then `=T.DIST.2T(t_value, n-2)` for two-tailed p-value

**In Python (pandas/scipy):**
- Pearson: `df['x'].corr(df['y'], method='pearson')` or `scipy.stats.pearsonr(x, y)` which returns (r, p_value) directly
- Spearman: `scipy.stats.spearmanr(x, y)` -- returns (rho, p_value)
- Kendall: `scipy.stats.kendalltau(x, y)` -- returns (tau, p_value)
- Full matrix: `df.corr(method='pearson')` -- produces a DataFrame of all pairwise correlations
- Correlation matrix with p-values requires a custom function or `pingouin` library: `pg.pairwise_corr(df, method='pearson')` returns r, n, p-unc, p-corr (corrected for multiple comparisons)

**In R:**
- Pearson: `cor(x, y, method = "pearson")` or `cor.test(x, y)` for coefficient + significance
- Spearman: `cor.test(x, y, method = "spearman")`
- Full matrix: `cor(df, method = "pearson")`
- Matrix with significance: `Hmisc::rcorr(as.matrix(df))` -- returns r matrix, n matrix, and p-value matrix simultaneously

**Numerical precision:** Always report r to 3 decimal places (r = 0.523, not r = 0.5 and not r = 0.5231847). R-squared should be reported as a percentage to one decimal place (27.4%, not 0.27 and not 27.4182%).

### Step 4: Assess Statistical Significance and Power

A correlation coefficient without a significance test is uninterpretable. A significance test without power analysis is incomplete.

**The t-test for Pearson r:**
- Test statistic: t = r * sqrt(n - 2) / sqrt(1 - r²)
- Degrees of freedom: df = n - 2
- This tests H₀: ρ = 0 (population correlation is zero) against H₁: ρ ≠ 0
- At n = 30, the minimum r needed for p < 0.05 (two-tailed) is approximately |r| = 0.361
- At n = 100, the minimum r for p < 0.05 is approximately |r| = 0.197
- At n = 500, the minimum r for p < 0.05 is approximately |r| = 0.088

**Critical insight -- statistical significance vs. practical significance:**
- With large samples (N > 200), even trivial correlations (r = 0.10) will be statistically significant. Statistical significance tells you the correlation is not zero; it does not tell you the correlation is large enough to matter
- Always pair statistical significance with an interpretation of practical effect size using the Cohen (1988) benchmarks: small = |r| 0.10--0.29, medium = |r| 0.30--0.49, large = |r| ≥ 0.50
- For sample sizes below 30, compute the 95% confidence interval using Fisher's Z transformation: z = 0.5 * ln((1+r)/(1-r)), SE(z) = 1/sqrt(n-3), CI_z = z ± 1.96 * SE(z), then back-transform to r scale. A wide CI indicates high uncertainty about the true population correlation

**Multiple comparisons correction:**
- If the user is computing a correlation matrix with k variables, there are k*(k-1)/2 unique pairs. With 10 variables, there are 45 pairs -- testing each at alpha = 0.05 means roughly 2-3 false positives by chance alone
- Apply Bonferroni correction: divide the significance threshold by the number of pairs (alpha_corrected = 0.05 / 45 = 0.0011 for a 10-variable matrix)
- Alternatively, use Benjamini-Hochberg FDR (false discovery rate) correction, which is less conservative than Bonferroni and preferred when there are many tests
- Flag this issue explicitly whenever N_variables > 5

**Minimum sample size recommendations:**
- For a reliable Pearson r estimate with ±0.1 precision at 95% confidence: N ≥ 85
- To detect a medium effect (r = 0.30) with 80% power at alpha = 0.05: N ≥ 84
- To detect a small effect (r = 0.10) with 80% power: N ≥ 782
- Rule of thumb for initial exploration: N ≥ 30 before drawing any conclusions

### Step 5: Check Assumptions and Diagnose Problems

Never report a Pearson r without checking these assumptions.

**Linearity:** The Pearson r specifically measures linear co-variation. A correlation near zero does not mean no relationship -- it means no linear relationship. The classic Anscombe's Quartet demonstrates four datasets all with r = 0.816 that have completely different shapes. Always recommend a scatter plot, particularly for variables that may have:
- U-shaped or inverted-U relationships (e.g., arousal and performance via Yerkes-Dodson curve)
- Threshold effects (e.g., temperature and productivity -- below a threshold, nothing; above it, a sharp drop)
- Ceiling or floor effects (e.g., test scores bunched near 100%)

**Bivariate normality:** Formally, the t-test for Pearson r assumes bivariate normal distributions. In practice, with N > 30, this assumption is robust due to the central limit theorem. For smaller samples, check each variable separately with a Shapiro-Wilk test; if either variable is strongly non-normal (skewness > |2| or kurtosis > |7|), switch to Spearman

**Homoscedasticity:** The spread of Y values should be roughly constant across all values of X (no funnel shape in the scatter plot). Heteroscedasticity does not bias the r value itself but does invalidate the standard significance test. If the scatter plot shows a fan shape, report this limitation

**Outliers:** A single outlier can change r by 0.3 or more in small samples. For every correlation, compute and report what r would be if the top 1-2 outliers (identified by z-score > |3| or by visual inspection of the scatter plot) were removed. If the conclusion changes, the result is outlier-sensitive and must be flagged

**Range restriction:** If the sample is drawn from a subset of the population with a restricted range on one or both variables (e.g., testing the correlation between SAT scores and GPA among students at a highly selective university -- all SAT scores are in the 1400-1600 range), the observed r will be artificially attenuated. The correction formula is: r_corrected = r_observed * (sd_unrestricted / sd_restricted) / sqrt(1 - r²_observed + r²_observed * (sd_unrestricted / sd_restricted)²)

### Step 6: Apply the Causation Framework

For every correlation result, apply a structured three-part causation analysis -- not just a boilerplate warning.

**Part A -- Direction of causation:**
- Could X cause Y? (describe the mechanism)
- Could Y cause X? (reverse causation -- describe the mechanism)
- Are both possible?

**Part B -- Confounding variables:**
- Identify at least two specific confounders relevant to this domain
- A confounder must be associated with BOTH X and Y independently
- Explain the specific pathway: "Z causes X to increase AND causes Y to increase, creating an apparent X-Y relationship that disappears when Z is held constant"

**Part C -- Ruling out correlation patterns:**
- Spurious correlation: Two completely unrelated variables that happen to co-vary in the dataset due to sample composition or time trends (e.g., per capita cheese consumption correlating with deaths by bedsheet tangling)
- Common cause: Both X and Y are driven by a third variable Z with no direct X-Y link
- Mediated relationship: X causes Z, and Z causes Y. The X-Y correlation is real but the mechanism runs through Z, not directly

**What would establish causation?**
- Randomized controlled experiment: Randomly assign subjects to different levels of X and measure Y
- Natural experiment / difference-in-differences: Exploit a policy change or external event that affected X for some but not others
- Instrumental variable analysis: Find a variable that affects X but has no direct path to Y
- Granger causality (time series only): Does knowing X's past values improve predictions of Y beyond Y's own past values? Note this tests predictive precedence, not true causation

### Step 7: Construct and Interpret the Correlation Matrix

For multi-variable analyses, the matrix requires its own interpretive framework.

**Visual representation:** A heatmap with a diverging color scale (e.g., dark blue at r = -1.0, white at r = 0, dark red at r = 1.0) communicates the matrix far more efficiently than a table of numbers. Recommend this to the user if they have visualization capability

**Multicollinearity detection:** When two predictor variables have |r| > 0.85 with each other, they are candidates for multicollinearity in a regression model. Flag all such pairs explicitly and recommend that only one variable from each highly correlated pair be included in a regression model. The Variance Inflation Factor (VIF) is the formal diagnostic, but correlation provides a useful first screen

**Dominant variable identification:** In a correlation matrix, compute the sum of absolute correlations for each variable (excluding its diagonal 1.0) -- the variable with the highest sum is the most "central" in the network of relationships. This is analogous to degree centrality in a network

**Clustering correlated variables:** If there are 8+ variables, identify clusters of mutually correlated variables visually. Variables in the same cluster likely reflect a shared underlying construct

**Structural patterns to report:**
- Strongest positive pair (r nearest +1.0)
- Strongest negative pair (r nearest -1.0)
- Variable with most associations (highest average |r| with all others)
- Variable that is independent of all others (all pairwise |r| < 0.15)
- Any pair with |r| > 0.85 (multicollinearity risk)

### Step 8: Deliver the Correlation Report

Assemble all findings into the structured output format with explicit sections for calculation method, results, interpretation, causation analysis, and recommendations.

- Lead with the key finding in plain English before presenting any numbers
- Present the numbers in the standard table format
- Follow immediately with the practical interpretation
- Always include the causation section, even if brief
- End with specific, actionable next steps -- "run a regression controlling for Z" or "collect 50 more observations to reduce the confidence interval width" are specific; "do further analysis" is not

---

## Output Format

```
## Correlation Analysis Report

### Key Finding
[One to two sentences stating the main result in plain language before any numbers.
Example: "Weekly call volume and monthly revenue are moderately and positively correlated.
Reps who make more calls tend to generate more revenue, though call volume explains
less than a third of revenue variation."]

---

### Variables Analyzed

| Variable | Role | Data Type | N Observations | Range | Mean | Std Dev |
|----------|------|-----------|----------------|-------|------|---------|
| [Variable X] | Predictor (X) | [Continuous/Ordinal/Binary] | [N] | [min–max] | [mean] | [sd] |
| [Variable Y] | Outcome (Y) | [Continuous/Ordinal/Binary] | [N] | [min–max] | [mean] | [sd] |

**Missing values:** [None / X cases removed listwise / describe handling]
**Independence check:** [Observations are independent / Note if repeated measures or clustered]

---

### Method Selection

**Correlation method chosen:** [Pearson r / Spearman rho / Kendall tau-b / Point-biserial / Polychoric]

**Reason:** [One sentence explaining why this method was appropriate given the data types,
distribution, and presence of outliers]

**Assumption checks:**
- Linearity: [Pass -- scatter plot shows linear trend / Caution -- [describe issue]]
- Normality: [Pass -- both variables approximately normal / Caution -- [describe issue]]
- Outliers: [None detected / [N] outliers detected at z > |3|; sensitivity analysis below]
- Sample size adequacy: [Adequate (N = [N]) / Warning -- underpowered (see below)]

---

### Correlation Result

| Metric | Value |
|--------|-------|
| Correlation method | [Pearson r / Spearman rho / Kendall tau-b / Point-biserial] |
| Correlation coefficient | r = [value to 3 decimal places] |
| Direction | [Positive / Negative / None] |
| Practical effect size | [Small (|r| 0.10–0.29) / Medium (|r| 0.30–0.49) / Large (|r| ≥ 0.50)] |
| R-squared (r²) | [value] -- [pct]% of variation in Y associated with X |
| Unexplained variation | [100 - pct]% of Y variation not explained by X |
| t-statistic | t([df]) = [value] |
| p-value | p [= or < or >] [value] |
| Statistical significance | [Significant / Not significant] at alpha = 0.05 |
| 95% Confidence Interval | r = [lower] to [upper] (via Fisher Z transformation) |
| Sample size | N = [N] |
| Minimum r for significance at this N | |r| > [value] |

---

### How to Calculate

**In Excel or Google Sheets:**
```excel
=CORREL([X_range], [Y_range])
```
For Spearman, first compute ranks in two helper columns:
```excel
=RANK.AVG(A2, $A$2:$A$[N+1], 1)   [in a helper column for X]
=RANK.AVG(B2, $B$2:$B$[N+1], 1)   [in a helper column for Y]
=CORREL([rank_X_range], [rank_Y_range])
```

For the p-value given r and n:
```excel
=T.DIST.2T( r*SQRT((n-2)/(1-r^2)), n-2 )
```

**In Python:**
```python
from scipy import stats
r, p_value = stats.pearsonr(df['x_column'], df['y_column'])
print(f"r = {r:.3f}, p = {p_value:.4f}")
```

**In R:**
```r
result <- cor.test(x, y, method = "pearson")
result$estimate       # r value
result$p.value        # p-value
result$conf.int       # 95% CI
```

---

### Plain-Language Interpretation

"[Variable X] and [Variable Y] have a [practical effect size: small/medium/large]
[direction: positive/negative] correlation (r = [value], p [comparison] [value],
N = [N]).

This means that as [X] [increases/decreases], [Y] tends to [increase/decrease]
[strongly/moderately/slightly]. Specifically, [X] accounts for [r²%] of the
variation in [Y] across observations. The remaining [100 - r²%] of [Y]'s
variation is attributable to other factors.

The 95% confidence interval for the true population correlation ranges from
r = [lower] to r = [upper], indicating [high certainty / moderate uncertainty /
substantial uncertainty] about the true strength of this relationship."

---

### Outlier Sensitivity (if outliers detected)

| Analysis | r | p | Interpretation |
|----------|---|---|----------------|
| Full dataset (N = [N]) | [r] | [p] | [interp] |
| Outliers removed (N = [N-k]) | [r] | [p] | [interp] |

**Conclusion:** [Result is robust to outlier removal / Result is sensitive -- interpret with caution]

---

### Causation Analysis

**⚠ This correlation does NOT establish causation.**

**Direction of effect:**
- Could [X] cause [Y]? [Yes/Possible/Unlikely] -- [specific mechanism or why not]
- Could [Y] cause [X]? [Yes/Possible/Unlikely] -- [specific reverse-causation mechanism]

**Confounding variables:**

| Confound | How it relates to X | How it relates to Y | Type of confound |
|----------|---------------------|---------------------|------------------|
| [Confounder 1] | [relationship to X] | [relationship to Y] | [Common cause / Mediator / Collider] |
| [Confounder 2] | [relationship to X] | [relationship to Y] | [Common cause / Mediator / Collider] |
| [Confounder 3] | [relationship to X] | [relationship to Y] | [Common cause / Mediator / Collider] |

**To investigate causation:**
1. [Specific causal inference method appropriate for this domain and whether intervention is feasible]
2. [Specific control variable to add in a regression, or natural experiment to exploit]

---

### Correlation Matrix (multi-variable analyses only)

|          | [Var 1] | [Var 2] | [Var 3] | [Var 4] | [Var 5] |
|----------|---------|---------|---------|---------|---------|
| [Var 1]  | 1.000   | [r]     | [r]     | [r]     | [r]     |
| [Var 2]  | [r]     | 1.000   | [r]     | [r]     | [r]     |
| [Var 3]  | [r]     | [r]     | 1.000   | [r]     | [r]     |
| [Var 4]  | [r]     | [r]     | [r]     | 1.000   | [r]     |
| [Var 5]  | [r]     | [r]     | [r]     | [r]     | 1.000   |

*Values in bold indicate |r| > 0.50. Values marked * are significant at p < 0.05.
Values marked ** are significant at p < 0.05 after Bonferroni correction.*

**Matrix summary:**
- Strongest positive pair: [Var A] and [Var B], r = [value]
- Strongest negative pair: [Var C] and [Var D], r = [value]
- Most central variable (highest mean |r|): [Var X]
- Multicollinearity risk pairs (|r| > 0.85): [list or "none identified"]
- Independent variable (mean |r| < 0.15 with all others): [Var X or "none"]
- Number of significant pairs after Bonferroni correction: [k] of [total pairs]

---

### Recommendations and Next Steps

1. **Immediate:** [Specific action to take based on the correlation result -- e.g., "Include call volume as a predictor in a multiple regression model alongside rep tenure and territory tier to estimate its independent contribution to revenue"]
2. **If causation matters:** [Specific causal investigation -- e.g., "Design a randomized test where a treatment group of 50 reps increases weekly calls by 20% and compare 60-day revenue outcomes against a matched control group"]
3. **Data quality:** [Any data collection or cleaning recommendation -- e.g., "Collect 80 more observations to reduce the 95% CI width from ±0.14 to ±0.08"]
4. **Related analysis:** [What to do next -- e.g., "Run regression-guide to estimate the slope: for each additional call per week, how many additional dollars in revenue are expected?"]
```

---

## Rules

1. **Never report r without p.** A correlation of r = 0.85 from N = 6 has a 95% confidence interval of approximately (-0.20, 0.99) and is not statistically significant (p ≈ 0.03 with df = 4, but this is borderline -- with N = 5 it is clearly non-significant). Always report both the coefficient and its p-value, and always compute the Fisher Z confidence interval when N < 50

2. **Always include the causation analysis with specific confounders, not boilerplate.** Writing "correlation does not imply causation" and nothing more is insufficient. Name at least two specific, domain-relevant confounders and explain the specific pathway by which each could produce the observed correlation without a direct causal link between X and Y

3. **Report r to 3 decimal places and r² as a percentage.** Write r = 0.523 and r² = 27.4%, never "r = 0.5" or "r = 0.52315." The percentage framing of r² is consistently more intuitive for non-statisticians: "call volume explains 27.4% of revenue variation" communicates magnitude in a way that "r = 0.523" does not

4. **Distinguish statistical significance from practical significance.** With N > 300, correlations as small as r = 0.11 will be statistically significant at p < 0.05. This does not mean they are meaningful. Always apply Cohen's (1988) benchmarks (small ≥ 0.10, medium ≥ 0.30, large ≥ 0.50) and comment on whether the effect size is practically meaningful for the user's decision context

5. **Never use Pearson on Likert-scale ordinal data without flagging the limitation.** Applying Pearson r to 5-point or 7-point scales treats the intervals between response categories as equal (e.g., the difference between "strongly disagree" and "disagree" equals the difference between "agree" and "strongly agree"), which is a strong and often unjustified assumption. Recommend Spearman rho as a minimum; recommend polychoric correlation if the user is doing scale development or SEM

6. **When there are 6 or more variables in a correlation matrix, apply and report a multiple-comparisons correction.** With k variables, there are k*(k-1)/2 pairs. Never leave uncorrected p-values in a matrix table without an explicit warning that some will be false positives by chance alone. Apply Bonferroni correction (alpha / number of pairs) as a conservative option, or Benjamini-Hochberg FDR as a less conservative option

7. **Always check for and report on outlier sensitivity.** A single outlier with z-score > |3| on either variable can shift r by 0.20 or more in small-to-medium samples. For every correlation analysis, report whether the result is robust (removing outliers does not change the strength or direction conclusion) or sensitive (removing outliers changes the conclusion). Never omit outliers silently -- remove them only if there is a documented data quality reason and report both the full-data and cleaned-data results

8. **Warn about range restriction whenever the sample is a filtered or selected subset.** If someone computes the correlation between SAT scores and first-year GPA among students admitted to a selective university, the range of SAT scores is truncated to the top tier. The observed r will be substantially lower than the true population r. Range restriction attenuation is one of the most common causes of underestimating a real relationship. The disattenuation formula should be applied when the user knows the unrestricted standard deviation

9. **Never use Pearson r for aggregated (ecological) data without warning about the ecological fallacy.** A correlation computed on country-level means, department-level averages, or zip-code-level statistics can be dramatically different from the individual-level correlation. The correlation between average national income and average national education does not mean the individual-level r between income and education is the same. Individual-level analyses require individual-level data

10. **When the user is computing correlations for feature selection before regression, explicitly warn about multicollinearity.** Pairs with |r| > 0.85 between two predictor variables should not both be included in the same regression model without further investigation. The VIF diagnostic is the definitive test, but the correlation matrix provides the initial screen. Flag all such pairs explicitly and recommend using only one variable from each highly correlated pair, or using dimensionality reduction

---

## Edge Cases

### Very Small Samples (N < 30)
Compute the correlation but display a prominent warning before the result: "With only N = [N] observations, this correlation estimate is highly unstable. The 95% confidence interval for the true population correlation spans approximately ±[1/sqrt(N-3) * 1.96] on the Fisher Z scale, which translates to a very wide range on the r scale. Adding or removing a single data point can shift r by 0.15 or more." Compute and show the full Fisher Z confidence interval explicitly. Recommend collecting at least 30 observations before treating the estimate as reliable, and 85+ for ±0.1 precision. For Pearson specifically, note that with N = 10 and r = 0.50, the p-value is 0.14 -- not significant, and the CI spans roughly r = -0.13 to r = 0.86

### Near-Zero Correlation When a Relationship Is Expected
A Pearson r near zero rules out only a linear relationship. The variables may have a strong non-linear association that Pearson cannot detect. Specifically:
- A U-shaped relationship (e.g., between stress and performance) will produce r ≈ 0 even if it is perfectly curved
- A threshold relationship (e.g., a drug has no effect below a minimum dose and then a strong effect) will produce r ≈ 0 in the below-threshold range
- Heterogeneous subgroups can cancel each other out: if the relationship is positive in subgroup A and negative in subgroup B, the overall r can be near zero (Simpson's paradox variant)

Recommend: create a scatter plot, compute the Spearman rho (which detects monotonic non-linear relationships), try segmenting the data by subgroup, or fit a quadratic regression to test for a curved relationship

### Perfect or Near-Perfect Correlation (|r| > 0.95)
Investigate before celebrating. Near-perfect correlations between conceptually distinct variables usually indicate one of these problems:
- **Mathematical redundancy:** Total revenue = units sold × price per unit will always produce r near 1.0 between total revenue and either component. This is definitional, not informative
- **Duplicate variables:** Two columns representing the same variable in different units (temperature in Celsius and Fahrenheit, distance in miles and kilometers)
- **Measurement of the same construct twice:** Two question items on a survey that ask the same thing in slightly different words
- **Data leakage in a modeling context:** A predictor variable that was derived from the outcome variable, creating an artificially high correlation that will not generalize

In all these cases, report the near-perfect correlation but label it a tautological or redundant relationship rather than a genuine empirical finding. Recommend removing one variable from the analysis

### Correlating a Continuous Variable with a Categorical Variable
If the categorical variable is binary (0/1, yes/no, treated/control), use point-biserial correlation -- which is simply Pearson r applied to the 0/1 coding. The resulting coefficient is valid and interpretable: positive r means the "1" group has higher values on the continuous variable on average. However, the coefficient magnitude is limited by the unequal split: when the binary variable is extremely imbalanced (95% "1" and 5% "0"), the maximum possible rpb is substantially less than 1.0 regardless of the true relationship. Compute and report the maximum possible rpb given the base rate and compare the observed rpb to this maximum.

If the categorical variable has 3 or more unordered levels (e.g., product category, geographic region), a single correlation coefficient cannot capture the relationship. The correct approach is one-way ANOVA (testing whether group means on the continuous variable differ significantly) -- redirect to `hypothesis-testing`

If the categorical variable has 3+ ordered levels (ordinal, such as Low/Medium/High severity), Spearman rho with integer coding (1/2/3) is the appropriate choice

### Time-Series Data Presented as a Simple Correlation
If the user is correlating two variables that are both measured over time (monthly sales and monthly marketing spend across 36 months), a simple Pearson correlation computed on the raw time series is likely spurious. Both variables may simply be trending upward over time, creating an apparent positive correlation that would appear between any two upward-trending series -- including completely unrelated ones. This is called spurious correlation due to shared trend (non-stationarity). The correct approach is to detrend both series first (compute first differences: xt = xt - x(t-1)) and correlate the differenced series. If the user is interested in whether one series leads or lags another, use a cross-correlation function (CCF), not a static correlation. Flag this issue whenever the user describes time-indexed data

### Correlation with Extreme Skewness or Non-Normality
Pearson r is not biased by non-normality in large samples, but the significance test (t-distribution) becomes unreliable. When either variable has skewness > |2| or is clearly non-normal (income distributions, transaction amounts, page views, social media follower counts):
- Apply a log transformation to reduce skewness: log(x+1) for variables that include zeros
- Compute Pearson r on the transformed variables and note the transformation in the report
- Alternatively, compute Spearman rho on the untransformed data -- Spearman is robust to skewness because it operates on ranks
- Report both the transformed-Pearson and Spearman results and note whether they agree

### Simpson's Paradox
When a correlation is computed on a pooled dataset that contains meaningful subgroups, the overall correlation can have the opposite sign from the within-subgroup correlations. Classic example: a negative correlation between hospital quality and survival rate (because better hospitals accept sicker patients). Within each patient severity level, the better hospitals have higher survival -- but across the entire pooled dataset, better hospitals appear to have lower survival because they disproportionately treat severe cases. Always ask the user whether the data contains natural subgroups (geographic regions, product lines, customer segments, time periods) that could create this problem. If subgroups exist, compute correlations within each subgroup and compare to the overall correlation before reporting

---

## Example

**Input:** "I have survey data from 312 employees at a manufacturing company. I want to know if there's a relationship between employee engagement scores (measured on a 1-10 scale, average of 8 items) and self-reported productivity scores (also 1-10, average of 5 items). I also want to understand whether this might be related to manager quality, which I've also measured on a 1-10 scale."

---

## Correlation Analysis Report

### Key Finding
Employee engagement and self-reported productivity are strongly and positively correlated among these 312 employees. Higher engagement scores are associated with higher productivity self-ratings. However, manager quality is correlated with both variables, and all three measures are self-reported by the same employees -- a factor that may inflate all correlations through common method bias.

---

### Variables Analyzed

| Variable | Role | Data Type | N | Range | Mean | Std Dev |
|----------|------|-----------|---|-------|------|---------|
| Engagement score (avg of 8 items) | Predictor (X) | Ordinal (treated as continuous) | 312 | 1.0 -- 10.0 | 6.82 | 1.74 |
| Productivity score (avg of 5 items) | Outcome (Y) | Ordinal (treated as continuous) | 312 | 1.0 -- 10.0 | 6.45 | 1.61 |
| Manager quality score | Third variable | Ordinal (treated as continuous) | 312 | 1.0 -- 10.0 | 6.91 | 1.58 |

**Missing values:** 4 employees had incomplete surveys and were removed listwise (N = 316 originally, 312 analyzed)
**Independence check:** Observations are individual employees. Note that employees are nested within work teams and managers -- this clustering may mean observations are not fully independent; a mixed-effects model would handle this more rigorously

---

### Method Selection

**Correlation method chosen:** Spearman rho (primary), Pearson r (secondary comparison)

**Reason:** Engagement and productivity are averages of Likert-scale items. While averaging multiple items does make the scale more continuous, the underlying items are ordinal (1--10 integer responses), the data likely has a slight ceiling effect near 10, and Spearman is more robust to the mild non-normality expected in employee survey data. Both methods are reported to confirm agreement.

**Assumption checks:**
- Linearity: Scatter plot inspection shows a broadly linear positive trend with mild heteroscedasticity (wider spread at middle scores) -- Pearson is reasonable but Spearman is preferred
- Normality: Engagement scores show slight left skew (skewness = -0.42); productivity shows mild left skew (skewness = -0.31). Both are within acceptable range for Pearson at N = 312, but Spearman is the primary method
- Outliers: 3 employees have engagement z-scores below -2.5 (very disengaged); sensitivity analysis performed
- Sample size adequacy: N = 312 is well above the 84-observation minimum for detecting a medium effect with 80% power. The minimum |r| for significance at this sample size is approximately 0.111

---

### Correlation Result

| Metric | Value |
|--------|-------|
| Correlation method (primary) | Spearman rho |
| Spearman rho (rs) | rs = 0.641 |
| Pearson r (comparison) | r = 0.627 |
| Both methods agree? | Yes -- conclusions identical |
| Direction | Positive |
| Practical effect size (Cohen 1988) | Large (|r| ≥ 0.50) |
| R-squared (from Pearson r) | 0.393 -- 39.3% of productivity variation associated with engagement |
| Unexplained variation | 60.7% of productivity variation not explained by engagement alone |
| t-statistic (for Pearson r) | t(310) = 14.08 |
| p-value | p < 0.001 |
| Statistical significance | Significant at alpha = 0.05 (and at alpha = 0.001) |
| 95% Confidence Interval | r = 0.559 to 0.688 (Fisher Z transformation) |
| Sample size | N = 312 |
| Minimum r for significance at N = 312 | |r| > 0.111 |

---

### How to Calculate

**In Excel or Google Sheets (Spearman rho):**
First, create rank columns for each variable:
```excel
=RANK.AVG(B2, $B$2:$B$313, 1)   [helper column: rank of engagement score]
=RANK.AVG(C2, $C$2:$C$313, 1)   [helper column: rank of productivity score]
=CORREL(D2:D313, E2:E313)        [Spearman rho from ranked columns]
```

For the p-value:
```excel
=T.DIST.2T( 0.641*SQRT((312-2)/(1-0.641^2)), 312-2 )
```
Result: p < 0.0001

**In Python:**
```python
from scipy import stats
rs, p_spearman = stats.spearmanr(df['engagement'], df['productivity'])
r, p_pearson = stats.pearsonr(df['engagement'], df['productivity'])
print(f"Spearman rho = {rs:.3f}, p = {p_spearman:.4f}")
print(f"Pearson r = {r:.3f}, p = {p_pearson:.4f}")
```

**In R:**
```r
cor.test(engagement, productivity, method = "spearman")
cor.test(engagement, productivity, method = "pearson")
```

---

### Plain-Language Interpretation

"Employee engagement scores and self-reported productivity scores have a large positive correlation (Spearman rs = 0.641, p < 0.001, N = 312). This means that employees who rate themselves as more engaged also tend to rate themselves as more productive. The Pearson r of 0.627 indicates that engagement accounts for approximately 39.3% of the variance in productivity self-ratings across employees. The remaining 60.7% of productivity variation is attributable to other factors not captured by engagement alone.

The 95% confidence interval for the true population Pearson correlation ranges from r = 0.559 to r = 0.688, indicating high confidence that the true relationship is at least moderate-to-large in the population from which this sample was drawn. The agreement between Spearman (0.641) and Pearson (0.627) confirms the relationship is approximately linear and is not being driven by ordinal-scale distortions."

---

### Outlier Sensitivity

| Analysis | Spearman rs | Pearson r | p | Interpretation |
|----------|-------------|-----------|---|----------------|
| Full dataset (N = 312) | 0.641 | 0.627 | < 0.001 | Large positive correlation |
| 3 outliers removed (N = 309) | 0.638 | 0.624 | < 0.001 | Large positive correlation |

**Conclusion:** The result is robust to outlier removal. Removing the 3 very low-engagement employees changes rs by only 0.003. The finding is not driven by outliers.

---

### Causation Analysis

**⚠ This correlation does NOT establish that increasing engagement will increase productivity.**

**Direction of effect:**
- Could engagement cause higher productivity? Possible -- engaged employees may invest more effort, persist through challenges, and focus more, leading to genuinely higher output
- Could higher productivity cause higher engagement? Also possible -- employees who feel productive may experience higher satisfaction and perceive themselves as more engaged (reverse causation is plausible here)
- Could both be true simultaneously? Yes -- a reinforcing feedback loop between engagement and perceived productivity is plausible

**Confounding variables:**

| Confound | How it relates to engagement | How it relates to productivity | Type of confound |
|----------|------------------------------|-------------------------------|------------------|
| Manager quality | High-quality managers create conditions that increase engagement | High-quality managers also coach employees toward higher performance | Common cause |
| Common method bias | All three scores are self-reported by the same employee at the same time | The same positive or negative response style inflates correlations among all self-rated variables | Measurement artifact |
| Job fit / role clarity | Employees who feel their skills match their role report higher engagement | The same role fit predicts higher performance | Common cause |
| Personality (positive affect) | Employees with higher dispositional positive affect rate all work experiences more positively | Same employees rate their own productivity higher regardless of actual output | Common cause |

**Critical note -- common method bias:** Because engagement, productivity, and manager quality are all self-rated by the same respondents in the same survey, all three correlations are likely inflated by common method variance. Employees with a tendency to respond positively (or negatively) will rate all three items high (or low), artificially elevating every pairwise correlation. The true correlations between engagement and objective productivity measures (units produced, error rates, sales closed) would likely be lower than r = 0.627.

**To investigate causation:**
1. Replace self-reported productivity with an objective performance measure (units produced per hour, quality defect rate, sales revenue, manager performance ratings independent of the survey) and recompute the correlation. If the correlation drops substantially, common method bias was inflating the original result
2. Design a longitudinal study: measure engagement at Time 1, measure productivity 3--6 months later at Time 2, and correlate T1 engagement with T2 productivity while controlling for T1 productivity. This lagged design tests whether engagement predicts later productivity changes, providing stronger (though still not definitive) evidence for the engagement → productivity direction
3. Run a regression analysis (`regression-guide`) controlling for manager quality simultaneously to estimate the partial correlation between engagement and productivity after removing manager quality's influence

---

### Correlation Matrix (Three Variables)

|                     | Engagement | Productivity | Manager Quality |
|---------------------|------------|--------------|-----------------|
| **Engagement**      | 1.000      | **0.641**\*\* | **0.589**\*\*   |
| **Productivity**    | **0.641**\*\* | 1.000      | **0.512**\*\*   |
| **Manager Quality** | **0.589**\*\* | **0.512**\*\* | 1.000         |

*All correlations significant at p < 0.001. With 3 pairs tested, Bonferroni-corrected alpha = 0.017 -- all three pairs remain significant after correction.*

**Matrix summary:**
- Strongest positive pair: Engagement and Productivity, rs = 0.641
- All three pairs are strongly and positively correlated -- the three variables form a tight cluster
- Multicollinearity risk: Engagement and manager quality (rs = 0.589) and productivity and manager quality (rs = 0.512) are sufficiently correlated that including all three in the same regression model without checking VIF is not recommended
- Most central variable (highest mean |r|): Engagement (mean |r| with other two variables = 0.615)

---

### Recommendations and Next Steps

1. **Address common method bias:** Before acting on this correlation, re-run the analysis using an objective productivity measure (output records, quality metrics, or independent supervisor ratings) rather than self-reported productivity. If the correlation drops below r = 0.30, the original result was largely measurement artifact

2. **Partial out manager quality:** Run a multiple regression (`regression-guide`) with productivity as the outcome and both engagement and manager quality as predictors. The partial coefficient on engagement will show how much of the engagement-productivity relationship survives after removing the confound of manager quality. If
