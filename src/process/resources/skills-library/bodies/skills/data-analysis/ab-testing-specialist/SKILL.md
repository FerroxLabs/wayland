---
name: ab-testing-specialist
description: |
  End-to-end guide for designing, running, and analyzing A/B tests including experiment design, statistical significance, sample size calculation, common pitfalls, and advanced testing patterns.
  Use when the user asks about ab testing specialist, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of ab testing specialist or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics checklist template quick-reference python testing analysis"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# A/B Testing Specialist

You are an expert in online experimentation and A/B testing who designs rigorous experiments, avoids common statistical traps, and translates test results into confident product decisions.


## When to Use

**Use this skill when:**
- User asks about ab testing specialist techniques or best practices
- User needs guidance on ab testing specialist concepts
- User wants to implement or improve their approach to ab testing specialist

**Do NOT use when:**
- The request falls outside the scope of ab testing specialist
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Experiment Design Framework

### Pre-Experiment Checklist

1. **Define the hypothesis** - "Changing X will improve Y by Z%"
2. **Select primary metric** - One clear success metric
3. **Define guard-rail metrics** - Metrics that must not degrade
4. **Calculate sample size** - Based on MDE, power, and significance level
5. **Determine test duration** - Account for weekly cycles (minimum 1-2 weeks)
6. **Define segments** - Mobile/desktop, new/returning, geography
7. **Document exclusion criteria** - Bots, internal users, edge cases
8. **Get stakeholder alignment** - Agree on decision criteria before launching

### Hypothesis Template

```
Population:  [Who are we testing?]
Treatment:   [What change are we making?]
Metric:      [What are we measuring?]
Direction:   [Do we expect increase or decrease?]
Magnitude:   [What is the minimum detectable effect?]
Timeline:    [How long will we run the test?]

Example:
Population:  All logged-in users on the checkout page
Treatment:   Single-page checkout vs. current multi-step checkout
Metric:      Checkout completion rate (primary), revenue per visitor (secondary)
Direction:   Increase
Magnitude:   2 percentage points (from 35% to 37%)
Timeline:    14 days minimum
```

## Sample Size Calculation

### For Conversion Rate Tests

```python
from statsmodels.stats.power import NormalIndPower
import numpy as np

def calculate_sample_size(
    baseline_rate: float,
    minimum_detectable_effect: float,  # Absolute difference
    alpha: float = 0.05,
    power: float = 0.80,
    two_sided: bool = True,
):
    """Calculate required sample size per group for a proportion test."""
    effect_size = minimum_detectable_effect / np.sqrt(
        baseline_rate * (1 - baseline_rate)
    )
    analysis = NormalIndPower()
    n = analysis.solve_power(
        effect_size=effect_size,
        alpha=alpha,
        power=power,
        alternative='two-sided' if two_sided else 'larger',
    )
    return int(np.ceil(n))

# Example: Detect 2pp lift from 10% baseline
n = calculate_sample_size(baseline_rate=0.10, minimum_detectable_effect=0.02)
print(f"Sample size per group: {n:,}")
# With 100k visitors/day, test duration = 2 * n / 100_000
```

### For Revenue / Continuous Metrics

```python
from statsmodels.stats.power import TTestIndPower

def sample_size_continuous(
    baseline_mean: float,
    baseline_std: float,
    minimum_detectable_effect: float,  # Absolute difference in means
    alpha: float = 0.05,
    power: float = 0.80,
):
    """Sample size for continuous metric (e.g., revenue per user)."""
    cohens_d = minimum_detectable_effect / baseline_std
    analysis = TTestIndPower()
    n = analysis.solve_power(effect_size=cohens_d, alpha=alpha, power=power)
    return int(np.ceil(n))

# Detect $2 lift in average order value (mean=$50, std=$30)
n = sample_size_continuous(50, 30, 2.0)
print(f"Sample size per group: {n:,}")
```

### Sample Size Quick Reference

| Baseline Rate | MDE | Required n (per group) | Power |
|---|---|---|---|
| 5% | 0.5pp | 30,424 | 80% |
| 5% | 1.0pp | 7,724 | 80% |
| 10% | 1.0pp | 14,314 | 80% |
| 10% | 2.0pp | 3,623 | 80% |
| 20% | 2.0pp | 6,280 | 80% |
| 20% | 5.0pp | 1,030 | 80% |
| 50% | 5.0pp | 1,571 | 80% |

## Running the Analysis

### Frequentist Approach

```python
from scipy import stats
import numpy as np

def analyze_ab_test(
    control_visitors: int,
    control_conversions: int,
    treatment_visitors: int,
    treatment_conversions: int,
    alpha: float = 0.05,
):
    """Complete frequentist analysis of an A/B test."""
    # Conversion rates
    p_control = control_conversions / control_visitors
    p_treatment = treatment_conversions / treatment_visitors
    lift = (p_treatment - p_control) / p_control

    # Pooled proportion for z-test
    p_pool = (control_conversions + treatment_conversions) / (
        control_visitors + treatment_visitors
    )
    se = np.sqrt(p_pool * (1 - p_pool) * (1/control_visitors + 1/treatment_visitors))
    z_stat = (p_treatment - p_control) / se
    p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))

    # Confidence interval for the difference
    se_diff = np.sqrt(
        p_control * (1 - p_control) / control_visitors +
        p_treatment * (1 - p_treatment) / treatment_visitors
    )
    z_crit = stats.norm.ppf(1 - alpha / 2)
    ci_low = (p_treatment - p_control) - z_crit * se_diff
    ci_high = (p_treatment - p_control) + z_crit * se_diff

    return {
        'control_rate': p_control,
        'treatment_rate': p_treatment,
        'absolute_lift': p_treatment - p_control,
        'relative_lift': lift,
        'z_statistic': z_stat,
        'p_value': p_value,
        'significant': p_value < alpha,
        'ci_low': ci_low,
        'ci_high': ci_high,
    }

results = analyze_ab_test(
    control_visitors=50000,
    control_conversions=5000,
    treatment_visitors=50000,
    treatment_conversions=5400,
)
```

### Bayesian Approach

```python
from scipy import stats
import numpy as np

def bayesian_ab_test(
    control_conversions: int,
    control_visitors: int,
    treatment_conversions: int,
    treatment_visitors: int,
    n_simulations: int = 100_000,
    prior_alpha: float = 1,
    prior_beta: float = 1,
):
    """Bayesian analysis using Beta-Binomial model."""
    # Posterior distributions (Beta)
    control_posterior = stats.beta(
        prior_alpha + control_conversions,
        prior_beta + control_visitors - control_conversions,
    )
    treatment_posterior = stats.beta(
        prior_alpha + treatment_conversions,
        prior_beta + treatment_visitors - treatment_conversions,
    )

    # Monte Carlo simulation
    control_samples = control_posterior.rvs(n_simulations)
    treatment_samples = treatment_posterior.rvs(n_simulations)

    # Probability that treatment is better
    prob_treatment_better = np.mean(treatment_samples > control_samples)

    # Expected lift distribution
    lift_samples = (treatment_samples - control_samples) / control_samples
    expected_lift = np.mean(lift_samples)
    lift_ci = np.percentile(lift_samples, [2.5, 97.5])

    # Expected loss (risk of choosing treatment if it is worse)
    loss_if_treatment = np.mean(np.maximum(control_samples - treatment_samples, 0))
    loss_if_control = np.mean(np.maximum(treatment_samples - control_samples, 0))

    return {
        'prob_treatment_better': prob_treatment_better,
        'expected_lift': expected_lift,
        'lift_ci_95': lift_ci,
        'expected_loss_treatment': loss_if_treatment,
        'expected_loss_control': loss_if_control,
    }
```

## Sequential Testing

### Avoiding Peeking Problems

```python
def sequential_test_boundary(n_looks: int, alpha: float = 0.05):
    """Calculate adjusted significance thresholds for sequential testing."""
    # O'Brien-Fleming spending function
    from scipy.stats import norm
    import numpy as np

    info_fractions = np.linspace(1/n_looks, 1.0, n_looks)
    boundaries = []

    for t in info_fractions:
        # O'Brien-Fleming boundary
        z_boundary = norm.ppf(1 - alpha / 2) / np.sqrt(t)
        p_boundary = 2 * (1 - norm.cdf(z_boundary))
        boundaries.append({
            'look': int(t * n_looks),
            'info_fraction': t,
            'z_boundary': z_boundary,
            'p_threshold': p_boundary,
        })

    return pd.DataFrame(boundaries)

# Plan 5 interim analyses
boundaries = sequential_test_boundary(n_looks=5)
print(boundaries)
# Early looks require very strong evidence; final look is near alpha=0.05
```

## Common Pitfalls

### 1. Peeking Problem

```
Problem: Checking results daily and stopping when significant
Impact:  Inflated false positive rate (up to 30% instead of 5%)
Fix:     Pre-commit to sample size, or use sequential testing methods
```

### 2. Multiple Testing

```
Problem: Testing 20 metrics and highlighting the one that is significant
Impact:  1 - (1 - 0.05)^20 = 64% chance of at least one false positive
Fix:     Designate one primary metric; apply Bonferroni or FDR correction
```

### 3. Simpson's Paradox

```
Problem: Overall result differs from every segment's result
Example: Treatment wins overall but loses in mobile AND desktop
         (because treatment got more high-converting desktop traffic)
Fix:     Check results across key segments; use stratified analysis
```

### 4. Novelty and Primacy Effects

```
Problem: New UI gets more clicks initially due to curiosity
Impact:  Overstated lift that decays over time
Fix:     Run test for 2+ weeks; analyze new-user cohort separately
         from those who switched mid-experiment
```

### 5. Network Effects and Interference

```
Problem: Control users are affected by treatment users (e.g., social features)
Impact:  Understated or biased treatment effect
Fix:     Cluster randomization (randomize by region, team, or network cluster)
```

### 6. Low Power

```
Problem: Test cannot detect realistic effect sizes
Impact:  Many "no result" tests that waste time
Fix:     Calculate sample size beforehand; accept larger MDE or run longer
```

## Segmentation Analysis

```python
def segment_analysis(df, metric_col, treatment_col, segment_col, alpha=0.05):
    """Analyze A/B test results across segments."""
    results = []

    for segment in df[segment_col].unique():
        seg_data = df[df[segment_col] == segment]
        control = seg_data[seg_data[treatment_col] == 'control'][metric_col]
        treatment = seg_data[seg_data[treatment_col] == 'treatment'][metric_col]

        t_stat, p_val = stats.ttest_ind(control, treatment)
        lift = treatment.mean() - control.mean()

        results.append({
            'segment': segment,
            'n_control': len(control),
            'n_treatment': len(treatment),
            'control_mean': control.mean(),
            'treatment_mean': treatment.mean(),
            'absolute_lift': lift,
            'relative_lift': lift / control.mean(),
            'p_value': p_val,
            'significant': p_val < alpha,
        })

    return pd.DataFrame(results).sort_values('relative_lift', ascending=False)
```

## Multi-Armed Bandit Alternative

```python
def thompson_sampling_step(arms_data):
    """One step of Thompson Sampling for multi-armed bandit."""
    samples = {}
    for arm_name, data in arms_data.items():
        alpha = 1 + data['successes']
        beta = 1 + data['failures']
        samples[arm_name] = np.random.beta(alpha, beta)

    chosen_arm = max(samples, key=samples.get)
    return chosen_arm, samples

# When to use Bandits vs. A/B Tests
# Bandits: Optimizing during the test (minimize regret)
# A/B:     Need clean causal measurement (maximize learning)
```

## Decision Framework

### After the Test

| Result | Powered? | Effect Meaningful? | Decision |
|--------|----------|--------------------|----------|
| Significant | Yes | Yes | Ship it |
| Significant | Yes | No | Consider cost to implement |
| Not significant | Yes | N/A | No meaningful effect exists |
| Not significant | No | N/A | Run longer or accept larger MDE |

### Reporting Template

```markdown
## Experiment: [Name]
**Hypothesis:** [What we expected]
**Duration:** [Start] to [End] ([X] days)
**Traffic:** [N control] / [N treatment]

### Primary Metric: [Metric Name]
| Group | Value | 95% CI |
|-------|-------|--------|
| Control | X.XX% | [X.XX%, X.XX%] |
| Treatment | X.XX% | [X.XX%, X.XX%] |
| **Lift** | **+X.XX%** | **[X.XX%, X.XX%]** |

**P-value:** X.XXXX | **Significant:** Yes/No
**Power:** XX% | **Effect size:** X.XX

### Guard-rail Metrics
| Metric | Control | Treatment | Change | Status |
|--------|---------|-----------|--------|--------|
| Revenue/user | $X.XX | $X.XX | +X.X% | OK |
| Page load | X.Xs | X.Xs | -X.X% | OK |

### Recommendation
[Ship / Iterate / Kill] - [Reasoning]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to ab testing specialist
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Ab Testing Specialist Analysis

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

**Input:** "Help me with ab testing specialist for my current situation"

**Output:**

Based on your situation, here is a structured approach to ab testing specialist:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
