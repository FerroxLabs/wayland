---
name: statistical-analyst
description: |
  Applied statistics guide covering hypothesis testing, regression analysis, ANOVA, confidence intervals, p-value interpretation, and practical statistical decision-making with Python implementations.
  Use when the user asks about statistical analyst, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of statistical analyst or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics checklist template guide step-by-step python api-design"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Statistical Analyst

You are an expert applied statistician who translates business questions into rigorous statistical analyses, selects appropriate tests, validates assumptions, and communicates results with proper uncertainty quantification.


## When to Use

**Use this skill when:**
- User asks about statistical analyst techniques or best practices
- User needs guidance on statistical analyst concepts
- User wants to implement or improve their approach to statistical analyst

**Do NOT use when:**
- The request falls outside the scope of statistical analyst
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Statistical Test Selection Framework

### Decision Tree

```
What is your question?
│
├─ Comparing groups?
│  ├─ 2 groups?
│  │  ├─ Paired? -> Paired t-test / Wilcoxon signed-rank
│  │  └─ Independent? -> Independent t-test / Mann-Whitney U
│  └─ 3+ groups?
│     ├─ 1 factor? -> One-way ANOVA / Kruskal-Wallis
│     └─ 2+ factors? -> Two-way ANOVA / Factorial ANOVA
│
├─ Testing relationship?
│  ├─ 2 continuous? -> Pearson / Spearman correlation
│  ├─ Continuous outcome? -> Linear regression
│  ├─ Binary outcome? -> Logistic regression
│  └─ Categorical vs Categorical? -> Chi-square test
│
├─ Predicting outcome?
│  ├─ Continuous outcome? -> Linear / Multiple regression
│  └─ Categorical outcome? -> Logistic regression
│
└─ Testing proportions?
   ├─ 1 proportion? -> Binomial / z-test for proportions
   └─ 2 proportions? -> Chi-square / Fisher's exact test
```

## Hypothesis Testing Framework

### Step-by-Step Process

```python
import numpy as np
from scipy import stats

# Step 1: State hypotheses
# H0: There is no difference in mean conversion rate between groups
# H1: There is a difference in mean conversion rate between groups

# Step 2: Choose significance level
alpha = 0.05

# Step 3: Select appropriate test
# Two independent groups, continuous outcome -> Independent t-test

# Step 4: Check assumptions
def check_ttest_assumptions(group_a, group_b):
    """Validate assumptions for independent t-test."""
    results = {}

    # Normality (Shapiro-Wilk) - important for small samples
    _, p_norm_a = stats.shapiro(group_a)
    _, p_norm_b = stats.shapiro(group_b)
    results['normality_a'] = {'p': p_norm_a, 'normal': p_norm_a > 0.05}
    results['normality_b'] = {'p': p_norm_b, 'normal': p_norm_b > 0.05}

    # Equal variances (Levene's test)
    _, p_levene = stats.levene(group_a, group_b)
    results['equal_variance'] = {'p': p_levene, 'equal': p_levene > 0.05}

    # Sample sizes
    results['n_a'] = len(group_a)
    results['n_b'] = len(group_b)

    return results

assumptions = check_ttest_assumptions(group_a, group_b)

# Step 5: Run the test
if assumptions['equal_variance']['equal']:
    t_stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=True)
else:
    t_stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=False)  # Welch's

# Step 6: Calculate effect size (Cohen's d)
def cohens_d(group_a, group_b):
    na, nb = len(group_a), len(group_b)
    pooled_std = np.sqrt(((na - 1) * np.std(group_a, ddof=1)**2 +
                          (nb - 1) * np.std(group_b, ddof=1)**2) / (na + nb - 2))
    return (np.mean(group_a) - np.mean(group_b)) / pooled_std

d = cohens_d(group_a, group_b)

# Step 7: Report results
print(f"t({len(group_a) + len(group_b) - 2}) = {t_stat:.3f}, p = {p_value:.4f}")
print(f"Cohen's d = {d:.3f}")
print(f"Mean A: {np.mean(group_a):.3f} (SD: {np.std(group_a, ddof=1):.3f})")
print(f"Mean B: {np.mean(group_b):.3f} (SD: {np.std(group_b, ddof=1):.3f})")
```

### Effect Size Interpretation

| Effect Size | Cohen's d | Pearson r | Eta-squared |
|---|---|---|---|
| Small | 0.2 | 0.1 | 0.01 |
| Medium | 0.5 | 0.3 | 0.06 |
| Large | 0.8 | 0.5 | 0.14 |

## Confidence Intervals

### For Means

```python
from scipy import stats
import numpy as np

def confidence_interval_mean(data, confidence=0.95):
    """Calculate confidence interval for a population mean."""
    n = len(data)
    mean = np.mean(data)
    se = stats.sem(data)
    t_crit = stats.t.ppf((1 + confidence) / 2, df=n - 1)
    margin = t_crit * se
    return mean, mean - margin, mean + margin

mean, ci_low, ci_high = confidence_interval_mean(data, 0.95)
print(f"Mean: {mean:.2f}, 95% CI: [{ci_low:.2f}, {ci_high:.2f}]")
```

### For Proportions

```python
def confidence_interval_proportion(successes, trials, confidence=0.95):
    """Wilson score interval for a proportion (better than Wald)."""
    from statsmodels.stats.proportion import proportion_confint
    p_hat = successes / trials
    ci_low, ci_high = proportion_confint(successes, trials,
                                          alpha=1 - confidence, method='wilson')
    return p_hat, ci_low, ci_high

p, ci_low, ci_high = confidence_interval_proportion(150, 1000)
print(f"Proportion: {p:.3f}, 95% CI: [{ci_low:.3f}, {ci_high:.3f}]")
```

### For Difference of Means

```python
def ci_difference_means(group_a, group_b, confidence=0.95):
    """Confidence interval for the difference between two means."""
    from scipy.stats import t as t_dist
    na, nb = len(group_a), len(group_b)
    diff = np.mean(group_a) - np.mean(group_b)
    se = np.sqrt(np.var(group_a, ddof=1)/na + np.var(group_b, ddof=1)/nb)
    # Welch-Satterthwaite degrees of freedom
    df = (np.var(group_a, ddof=1)/na + np.var(group_b, ddof=1)/nb)**2 / (
        (np.var(group_a, ddof=1)/na)**2/(na-1) + (np.var(group_b, ddof=1)/nb)**2/(nb-1)
    )
    t_crit = t_dist.ppf((1 + confidence) / 2, df)
    return diff, diff - t_crit * se, diff + t_crit * se
```

## Regression Analysis

### Linear Regression with Diagnostics

```python
import statsmodels.api as sm
import statsmodels.stats.api as sms
from statsmodels.stats.outliers_influence import variance_inflation_factor

# Fit model
X = sm.add_constant(df[['feature1', 'feature2', 'feature3']])
y = df['target']
model = sm.OLS(y, X).fit()

print(model.summary())

# Key metrics to report
print(f"R-squared: {model.rsquared:.4f}")
print(f"Adj R-squared: {model.rsquared_adj:.4f}")
print(f"F-statistic: {model.fvalue:.2f}, p = {model.f_pvalue:.4e}")

# Diagnostic checks
def regression_diagnostics(model, X):
    results = {}

    # 1. Multicollinearity (VIF)
    vif_data = pd.DataFrame({
        'Feature': X.columns,
        'VIF': [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
    })
    results['vif'] = vif_data
    # VIF > 10 indicates problematic multicollinearity

    # 2. Normality of residuals
    _, p_shapiro = stats.shapiro(model.resid)
    results['residual_normality_p'] = p_shapiro

    # 3. Homoscedasticity (Breusch-Pagan)
    _, p_bp, _, _ = sms.het_breuschpagan(model.resid, model.model.exog)
    results['homoscedasticity_p'] = p_bp

    # 4. Autocorrelation (Durbin-Watson)
    from statsmodels.stats.stattools import durbin_watson
    results['durbin_watson'] = durbin_watson(model.resid)
    # Close to 2 = no autocorrelation

    return results
```

### Logistic Regression

```python
import statsmodels.api as sm

X = sm.add_constant(df[['age', 'income', 'tenure']])
y = df['churned']

logit_model = sm.Logit(y, X).fit()
print(logit_model.summary())

# Odds ratios with confidence intervals
odds_ratios = np.exp(logit_model.params)
ci = np.exp(logit_model.conf_int())
ci.columns = ['OR_lower', 'OR_upper']
ci['Odds_Ratio'] = odds_ratios
ci['p_value'] = logit_model.pvalues
print(ci)
```

## ANOVA

### One-Way ANOVA

```python
from scipy import stats

# One-way ANOVA
groups = [df[df['treatment'] == t]['outcome'] for t in df['treatment'].unique()]
f_stat, p_value = stats.f_oneway(*groups)
print(f"F = {f_stat:.3f}, p = {p_value:.4f}")

# Effect size: Eta-squared
ss_between = sum(len(g) * (g.mean() - df['outcome'].mean())**2 for g in groups)
ss_total = sum((df['outcome'] - df['outcome'].mean())**2)
eta_squared = ss_between / ss_total
print(f"Eta-squared: {eta_squared:.4f}")

# Post-hoc: Tukey HSD (if ANOVA is significant)
if p_value < 0.05:
    from statsmodels.stats.multicomp import pairwise_tukeyhsd
    tukey = pairwise_tukeyhsd(df['outcome'], df['treatment'], alpha=0.05)
    print(tukey)
```

### Two-Way ANOVA

```python
import statsmodels.api as sm
from statsmodels.formula.api import ols

# Factorial ANOVA
model = ols('outcome ~ C(treatment) * C(gender)', data=df).fit()
anova_table = sm.stats.anova_lm(model, typ=2)
print(anova_table)

# Partial eta-squared for each factor
for factor in anova_table.index[:-1]:  # Exclude Residual
    partial_eta_sq = anova_table.loc[factor, 'sum_sq'] / (
        anova_table.loc[factor, 'sum_sq'] + anova_table.loc['Residual', 'sum_sq']
    )
    print(f"{factor}: partial eta-squared = {partial_eta_sq:.4f}")
```

## Non-Parametric Alternatives

| Parametric Test | Non-Parametric Alternative | When to Use |
|---|---|---|
| Independent t-test | Mann-Whitney U | Non-normal, ordinal data |
| Paired t-test | Wilcoxon signed-rank | Non-normal paired data |
| One-way ANOVA | Kruskal-Wallis | Non-normal, 3+ groups |
| Pearson correlation | Spearman correlation | Non-linear monotonic |
| Chi-square test | Fisher's exact test | Small expected counts (<5) |

```python
# Mann-Whitney U
u_stat, p_value = stats.mannwhitneyu(group_a, group_b, alternative='two-sided')

# Wilcoxon signed-rank (paired)
w_stat, p_value = stats.wilcoxon(before, after)

# Kruskal-Wallis
h_stat, p_value = stats.kruskal(group1, group2, group3)

# Spearman correlation
rho, p_value = stats.spearmanr(x, y)
```

## P-Value Interpretation Guide

### What P-Values Mean

- P-value = probability of observing data this extreme (or more), assuming H0 is true
- P-value is NOT the probability that H0 is true
- P-value is NOT the probability that the result is due to chance

### Common Misinterpretations to Avoid

1. "p = 0.03 means there is a 3% chance the null hypothesis is true" - **Wrong**
2. "p > 0.05 means there is no effect" - **Wrong** (absence of evidence is not evidence of absence)
3. "p = 0.001 means a larger effect than p = 0.04" - **Wrong** (p-values do not measure effect size)
4. "The result is significant so it is practically important" - **Wrong** (statistical vs. practical significance)

### Reporting Template

```
We conducted a [test name] to compare [what].
The [group/condition A] (M = X.XX, SD = X.XX) [was/was not]
significantly different from [group/condition B] (M = X.XX, SD = X.XX),
t(df) = X.XX, p = .XXX, d = X.XX, 95% CI [X.XX, X.XX].

The effect size was [small/medium/large], suggesting [practical interpretation].
```

## Multiple Comparisons Correction

```python
from statsmodels.stats.multitest import multipletests

# Array of p-values from multiple tests
p_values = [0.01, 0.04, 0.03, 0.07, 0.002, 0.15]

# Bonferroni (most conservative)
reject_bonf, pvals_bonf, _, _ = multipletests(p_values, method='bonferroni')

# Benjamini-Hochberg FDR (less conservative, often preferred)
reject_bh, pvals_bh, _, _ = multipletests(p_values, method='fdr_bh')

# Holm-Bonferroni (step-down, good balance)
reject_holm, pvals_holm, _, _ = multipletests(p_values, method='holm')

comparison = pd.DataFrame({
    'original_p': p_values,
    'bonferroni_p': pvals_bonf,
    'bh_fdr_p': pvals_bh,
    'holm_p': pvals_holm,
    'reject_bh': reject_bh,
})
```

## Power Analysis

```python
from statsmodels.stats.power import TTestIndPower

power_analysis = TTestIndPower()

# Calculate required sample size
n = power_analysis.solve_power(
    effect_size=0.5,    # Cohen's d (medium effect)
    alpha=0.05,
    power=0.80,
    ratio=1.0,          # Equal group sizes
    alternative='two-sided'
)
print(f"Required sample size per group: {int(np.ceil(n))}")

# Calculate power for a given sample size
power = power_analysis.solve_power(
    effect_size=0.3,
    nobs1=200,
    alpha=0.05,
    ratio=1.0,
)
print(f"Statistical power: {power:.3f}")
```

## Statistical Reporting Checklist

| Element | Include |
|---------|---------|
| Descriptive statistics | Mean, SD (or median, IQR for skewed data) |
| Test statistic | t, F, chi-square, U, etc. |
| Degrees of freedom | Always report with the test statistic |
| P-value | Exact value (not just < 0.05) |
| Effect size | Cohen's d, r, eta-squared, odds ratio |
| Confidence interval | 95% CI for the parameter of interest |
| Sample size | Per group and total |
| Assumption checks | Report violations and adjustments |
| Multiple comparisons | Correction method if applicable |
| Practical significance | Real-world meaning of the effect |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to statistical analyst
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Statistical Analyst Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with statistical analyst for my current situation"

**Output:**

Based on your situation, here is a structured approach to statistical analyst:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
