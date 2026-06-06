---
name: causal-inference-practitioner
description: |
  Causal inference expertise covering A/B testing limitations and extensions, instrumental variables, difference-in-differences estimation, regression discontinuity design, directed acyclic graphs (DAGs) for causal reasoning, propensity score matching, synthetic control methods, and practical applications for measuring treatment effects in observational data.
  Use when the user asks about causal inference practitioner, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of causal inference practitioner or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics guide python api-design testing analysis research"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Causal Inference Practitioner

You are an expert causal inference practitioner who helps teams move beyond correlation to measure true causal effects. You design experiments when possible and apply quasi-experimental methods when randomization is not feasible. You use DAGs to reason about confounding and guide teams through the assumptions underlying each causal method.


## When to Use

**Use this skill when:**
- User asks about causal inference practitioner techniques or best practices
- User needs guidance on causal inference practitioner concepts
- User wants to implement or improve their approach to causal inference practitioner

**Do NOT use when:**
- The request falls outside the scope of causal inference practitioner
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Research question:** What causal effect are you trying to estimate? (X causes Y?)
2. **Can you randomize?** Is an A/B test possible, or must you use observational data?
3. **Data available:** What variables do you have? Is there a natural experiment?
4. **Treatment assignment:** How were people/units assigned to treatment vs control?
5. **Sample size:** How many observations? (affects method feasibility)
6. **Time dimension:** Is this cross-sectional or panel data (repeated observations over time)?
7. **Stakes:** Will this inform a major decision? (determines rigor needed)

---

## The Causal Inference Ladder

```
Level 1: CORRELATION
  "X and Y move together"
  Tool: Regression, correlation
  Problem: Confounders, reverse causation, selection bias

Level 2: A/B TEST (Randomized Experiment)
  "Randomly assign X, measure Y"
  Tool: Controlled experiment
  Gold standard, but not always feasible

Level 3: QUASI-EXPERIMENTAL
  "Find a natural experiment or exploit data structure"
  Tools: Diff-in-Diff, Regression Discontinuity, IV
  Requires careful assumption checking

Level 4: OBSERVATIONAL WITH ADJUSTMENT
  "Control for confounders with data"
  Tools: Matching, propensity scores, DAG-guided regression
  Weakest causal claims, but sometimes the only option
```

---

## Directed Acyclic Graphs (DAGs)

### Reading and Drawing DAGs

```
A DAG shows assumed causal relationships:

  X -----> Y     X causes Y (direct effect)

  X -----> Y
  |               X causes Y directly AND through M
  +---> M ---> Y  M is a mediator

  Z -----> X
  |               Z causes both X and Y
  +-----> Y      Z is a confounder (must control for Z)

  X -----> C <----- Y
                  C is a collider (do NOT control for C)
                  Controlling for C creates spurious association
```

### DAG Rules for Variable Selection

```python
# Using the dagitty-inspired approach
# Install: install the package via pip dowhy

import dowhy
from dowhy import CausalModel

# Define causal graph
model = CausalModel(
    data=df,
    treatment='marketing_spend',
    outcome='sales',
    graph="""
    digraph {
        marketing_spend -> sales;
        season -> marketing_spend;
        season -> sales;
        competitor_price -> sales;
        brand_awareness -> marketing_spend;
        brand_awareness -> sales;
    }
    """
)

# Identify valid adjustment sets
identified = model.identify_effect()
print(identified)
# Output: Adjust for {season, brand_awareness} to estimate
# causal effect of marketing_spend on sales

# Estimate the effect
estimate = model.estimate_effect(
    identified,
    method_name="backdoor.linear_regression"
)
print(f"Causal effect: {estimate.value:.4f}")

# Refutation tests (sensitivity analysis)
refute = model.refute_estimate(
    identified, estimate,
    method_name="random_common_cause"
)
print(refute)
```

### Common DAG Patterns

```
1. Confounding (must adjust):
   Season -> Marketing    Need to control
   Season -> Sales        for Season

2. Mediation (adjust depends on question):
   Marketing -> Awareness -> Sales
   Total effect: Don't control for Awareness
   Direct effect: Control for Awareness

3. Collider (do NOT adjust):
   Talent -> Hired <-- Connections
   If you only look at hired people, talent and connections
   appear negatively correlated (collider bias)

4. M-Bias (a subtle trap):
   U1 -> A    U2 -> A
   U1 -> X    U2 -> Y
   X -> Y
   Controlling for A (a collider) opens a non-causal path
```

---

## A/B Testing and Its Limitations

### When A/B Tests Fail

```
Limitation 1: INTERFERENCE (Spillover)
  Problem: Treatment of user A affects outcome of user B
  Example: Ride-sharing pricing -- lower prices for treated group
           increases demand, affecting wait times for control group
  Solution: Cluster randomization, switchback design

Limitation 2: NOVELTY/HABITUATION EFFECTS
  Problem: Short-term response differs from long-term
  Example: New UI layout -- users initially confused (novelty)
           but eventually prefer it (habituation)
  Solution: Run tests longer, or use holdout groups

Limitation 3: SELECTION BIAS IN ENROLLMENT
  Problem: Who opts in to the experiment is non-random
  Example: Testing a feature only users who clicked a prompt see
  Solution: Intent-to-treat analysis, instrument for compliance

Limitation 4: MULTIPLE TESTING
  Problem: Testing many metrics inflates false positive rate
  5 metrics at alpha=0.05 => ~23% chance of at least one false positive
  Solution: Bonferroni correction, sequential testing, pre-registration
```

---

## Difference-in-Differences (DiD)

### Core Idea

```
Compare the CHANGE in outcomes between treated and control groups:

Causal Effect = (Treated_After - Treated_Before) - (Control_After - Control_Before)

Key Assumption: PARALLEL TRENDS
  Without treatment, treated and control groups would have followed
  the same trend over time.

Visual test:
  Before treatment, do both groups trend similarly?
  If yes, the divergence after treatment is plausibly causal.
```

### Implementation

```python
import statsmodels.api as sm

# Standard DiD regression
# Y = b0 + b1*Treated + b2*Post + b3*(Treated*Post) + e
# b3 is the DiD estimate (causal effect)

df['treated_x_post'] = df['treated'] * df['post']

model = sm.OLS.from_formula(
    'outcome ~ treated + post + treated_x_post + controls',
    data=df
).fit(cov_type='cluster', cov_kwds={'groups': df['unit_id']})

print(model.summary())
# Coefficient on treated_x_post = causal effect
# Clustered standard errors account for within-unit correlation

# Two-Way Fixed Effects (more robust)
model_fe = sm.OLS.from_formula(
    'outcome ~ treated_x_post + C(unit_id) + C(time_period)',
    data=df
).fit(cov_type='cluster', cov_kwds={'groups': df['unit_id']})
```

### Parallel Trends Test

```python
# Event study: Estimate treatment effect for each time period
# Coefficients before treatment should be near zero (parallel trends)

# Create relative time indicators
df['rel_time'] = df['time'] - df['treatment_time']

# Exclude period -1 as reference
time_dummies = pd.get_dummies(df['rel_time'], prefix='t')
time_dummies = time_dummies.drop('t_-1', axis=1)  # reference period

# Interact with treatment indicator
for col in time_dummies.columns:
    df[col] = time_dummies[col] * df['treated']

# Plot coefficients -- pre-treatment should be flat near zero
```

---

## Instrumental Variables (IV)

### When to Use IV

```
Use IV when:
  - You cannot randomize treatment
  - There are unmeasured confounders
  - You have an "instrument" that:
    1. Affects treatment (relevance)
    2. Only affects outcome THROUGH treatment (exclusion restriction)
    3. Is not associated with confounders (independence)

Classic examples:
  - Distance to college as instrument for education on earnings
  - Draft lottery number as instrument for military service
  - Rainfall as instrument for crop yield on economic outcomes
```

### Implementation

```python
from linearmodels.iv import IV2SLS

# Two-Stage Least Squares
# Stage 1: Treatment = a + b*Instrument + e  (first stage)
# Stage 2: Outcome = c + d*Predicted_Treatment + e  (second stage)

iv_model = IV2SLS.from_formula(
    'earnings ~ 1 + experience + [education ~ distance_to_college]',
    data=df
).fit(cov_type='robust')

print(iv_model.summary)

# Check first-stage F-statistic (should be > 10)
# Weak instruments bias IV toward OLS estimates
first_stage = sm.OLS.from_formula(
    'education ~ distance_to_college + experience',
    data=df
).fit()
print(f"First-stage F: {first_stage.fvalue:.1f}")
```

---

## Other Methods

### Regression Discontinuity (RD)

```python
# Exploit a threshold/cutoff in treatment assignment
# Example: Students scoring above 70 get a scholarship
# Compare outcomes just above and just below the cutoff

from rdrobust import rdrobust

# Sharp RD: treatment perfectly determined by cutoff
result = rdrobust(y=df['earnings'], x=df['test_score'], c=70)
print(result)
# Estimates local average treatment effect at the cutoff

# Visualize
import matplotlib.pyplot as plt
plt.scatter(df['test_score'], df['earnings'], alpha=0.3, s=5)
plt.axvline(x=70, color='red', linestyle='--', label='Cutoff')
plt.xlabel('Test Score')
plt.ylabel('Earnings')
plt.show()
```

### Propensity Score Matching

```python
from sklearn.linear_model import LogisticRegression
from scipy.spatial.distance import cdist

# Step 1: Estimate propensity scores
ps_model = LogisticRegression()
ps_model.fit(df[covariates], df['treated'])
df['propensity'] = ps_model.predict_proba(df[covariates])[:, 1]

# Step 2: Match treated to control by propensity score
treated = df[df['treated'] == 1]
control = df[df['treated'] == 0]

# Nearest neighbor matching
from sklearn.neighbors import NearestNeighbors
nn = NearestNeighbors(n_neighbors=1)
nn.fit(control[['propensity']])
distances, indices = nn.kneighbors(treated[['propensity']])

matched_control = control.iloc[indices.flatten()]

# Step 3: Estimate treatment effect on matched sample
ate = treated['outcome'].mean() - matched_control['outcome'].mean()
print(f"Average Treatment Effect: {ate:.4f}")

# Step 4: Check covariate balance after matching
for cov in covariates:
    diff = treated[cov].mean() - matched_control[cov].mean()
    print(f"{cov}: Standardized diff = {diff / df[cov].std():.3f}")
    # Should be < 0.1 for good balance
```

---

## Method Selection Guide

| Scenario | Method | Key Assumption |
|----------|--------|---------------|
| Can randomize | A/B test | Random assignment |
| Policy change at a point in time | Difference-in-Differences | Parallel trends |
| Threshold/cutoff determines treatment | Regression Discontinuity | Continuity at cutoff |
| External factor affects treatment only | Instrumental Variables | Exclusion restriction |
| Rich covariate data, no experiment | Propensity Score Matching | No unmeasured confounders |
| One treated unit, many controls | Synthetic Control | Pre-treatment fit |
| Multiple treatments over time | Staggered DiD | Heterogeneity-robust estimator |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to causal inference practitioner
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Causal Inference Practitioner Analysis

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

**Input:** "Help me with causal inference practitioner for my current situation"

**Output:**

Based on your situation, here is a structured approach to causal inference practitioner:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
