---
name: model-evaluator
description: |
  ML model assessment covering classification metrics (precision, recall, F1, AUC-ROC), regression metrics (MAE, RMSE, R2), confusion matrix analysis, cross-validation strategies, bias detection, fairness metrics, and A/B testing for models.
  Use when the user asks about model evaluator, model evaluator best practices, or needs guidance on model evaluator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml testing guide"
  category: "ai-machine-learning"
  subcategory: "ml-fundamentals"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Model Evaluator

## Overview

Rigorous model assessment is essential to deploying trustworthy ML systems. This skill covers comprehensive metrics for classification and regression, strategies for cross-validation, statistical testing, bias and fairness auditing, and A/B testing frameworks for comparing models in production.

## Classification Metrics

### Core Metrics

```python
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, classification_report,
    confusion_matrix,
)
import numpy as np

def classification_report_full(y_true, y_pred, y_prob=None) -> dict:
    """Comprehensive classification metrics."""
    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision_macro": precision_score(y_true, y_pred, average="macro"),
        "recall_macro": recall_score(y_true, y_pred, average="macro"),
        "f1_macro": f1_score(y_true, y_pred, average="macro"),
        # ... (condensed) ...
            metrics["auc_roc_ovr"] = roc_auc_score(
                y_true, y_prob, multi_class="ovr", average="macro"
            )

    return metrics
```

### Metric Selection Guide

| Metric | When to Use | Sensitive To |
|--------|-------------|-------------|
| Accuracy | Balanced classes only | Class imbalance |
| Precision | Cost of false positives is high | Threshold selection |
| Recall | Cost of false negatives is high | Threshold selection |
| F1 Score | Balance precision and recall | Threshold selection |
| AUC-ROC | Overall ranking ability | Not threshold-dependent |
| Average Precision | Imbalanced classes, ranking | Class distribution |
| Cohen's Kappa | Agreement beyond chance | None |

### Decision Framework

```
Is your dataset balanced (classes within 2x of each other)?
  YES -> Accuracy is meaningful, but also report F1
  NO  -> DO NOT rely on accuracy. Use these instead:
         - F1 (balanced view)
         - Average Precision (best for heavy imbalance)
         - AUC-ROC (threshold-independent ranking)

What is more costly?
  False positives (spam filter, fraud alert):
    -> Optimize for PRECISION
  False negatives (cancer screening, security):
    -> Optimize for RECALL
  Both equally bad:
    -> Optimize for F1 score
```

## Confusion Matrix Analysis

### Visualization and Interpretation

```python
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

def plot_confusion_matrix(
    y_true, y_pred,
    class_names: list[str] = None,
    normalize: str = None,
    figsize: tuple = (8, 6),
) -> plt.Figure:
    """Plot confusion matrix with detailed annotations."""
    cm = confusion_matrix(y_true, y_pred, normalize=normalize)

    fig, ax = plt.subplots(figsize=figsize)
    # ... (condensed) ...
                })
        confused_with.sort(key=lambda x: x["count"], reverse=True)
        analysis[cls]["most_confused_with"] = confused_with[:3]

    return analysis
```

### ROC and Precision-Recall Curves

```python
from sklearn.metrics import roc_curve, precision_recall_curve, auc

def plot_roc_pr_curves(y_true, y_prob, figsize=(14, 5)):
    """Plot ROC and Precision-Recall curves side by side."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=figsize)

    # ROC Curve
    fpr, tpr, roc_thresholds = roc_curve(y_true, y_prob)
    roc_auc = auc(fpr, tpr)
    ax1.plot(fpr, tpr, label=f"AUC = {roc_auc:.3f}")
    ax1.plot([0, 1], [0, 1], "k--", alpha=0.3)
    ax1.set_xlabel("False Positive Rate")
    ax1.set_ylabel("True Positive Rate")
    ax1.set_title("ROC Curve")
    # ... (condensed) ...
    ax2.set_title("Precision-Recall Curve")
    ax2.legend()

    plt.tight_layout()
    return fig
```

### Threshold Optimization

```python
from sklearn.metrics import balanced_accuracy_score

def find_optimal_threshold(
    y_true, y_prob,
    metric: str = "f1",
) -> tuple[float, float]:
    """Find the threshold that maximizes a given metric."""

    thresholds = np.arange(0.1, 0.95, 0.01)
    best_threshold = 0.5
    best_score = 0

    for threshold in thresholds:
        y_pred = (y_prob >= threshold).astype(int)
# ... (condensed) ...
        if score > best_score:
            best_score = score
            best_threshold = threshold

    return best_threshold, best_score
```

## Regression Metrics

### Core Regression Metrics

```python
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    mean_absolute_percentage_error, median_absolute_error,
)

def regression_report(y_true, y_pred) -> dict:
    """Comprehensive regression metrics."""
    return {
        "mae": mean_absolute_error(y_true, y_pred),
        "rmse": np.sqrt(mean_squared_error(y_true, y_pred)),
        "mse": mean_squared_error(y_true, y_pred),
        "r2": r2_score(y_true, y_pred),
        "mape": mean_absolute_percentage_error(y_true, y_pred),
        "median_ae": median_absolute_error(y_true, y_pred),
        "max_error": float(np.max(np.abs(y_true - y_pred))),
    }
```

### Metric Interpretation

| Metric | Range | Interpretation |
|--------|-------|---------------|
| MAE | [0, inf) | Average absolute error in original units |
| RMSE | [0, inf) | Penalizes large errors more than MAE |
| R2 | (-inf, 1] | 1 = perfect; 0 = predicts mean; <0 = worse than mean |
| MAPE | [0, inf) | Percentage error (avoid when y has zeros) |
| Median AE | [0, inf) | Robust to outliers |

### Residual Analysis

```python
from scipy import stats as sp_stats

def plot_residual_analysis(y_true, y_pred, figsize=(14, 10)):
    """Comprehensive residual analysis plots."""
    residuals = y_true - y_pred

    fig, axes = plt.subplots(2, 2, figsize=figsize)

    # Predicted vs Actual
    axes[0, 0].scatter(y_pred, y_true, alpha=0.5, s=10)
    min_val, max_val = min(y_true.min(), y_pred.min()), max(y_true.max(), y_pred.max())
    axes[0, 0].plot([min_val, max_val], [min_val, max_val], "r--")
    axes[0, 0].set_xlabel("Predicted")
    axes[0, 0].set_ylabel("Actual")
    # ... (condensed) ...
    sp_stats.probplot(residuals, dist="norm", plot=axes[1, 1])
    axes[1, 1].set_title("QQ Plot")

    plt.tight_layout()
    return fig
```

## Cross-Validation Strategies

### Choosing the Right Strategy

```python
from sklearn.model_selection import (
    KFold, StratifiedKFold, TimeSeriesSplit,
    GroupKFold, RepeatedStratifiedKFold,
    cross_val_score,
)

def get_cv_strategy(
    task_type: str,
    data_type: str = "standard",
    n_splits: int = 5,
    groups=None,
):
    """Select appropriate cross-validation strategy."""

    # ... (condensed) ...

    if task_type == "classification":
        return StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    return KFold(n_splits=n_splits, shuffle=True, random_state=42)
```

### Cross-Validation with Confidence Intervals

```python
def cv_with_confidence(model, X, y, cv=5, scoring="f1") -> dict:
    """Cross-validation with confidence interval."""
    scores = cross_val_score(model, X, y, cv=cv, scoring=scoring)

    mean = scores.mean()
    std = scores.std()
    n = len(scores)
    se = std / np.sqrt(n)

    # 95% confidence interval
    ci_low = mean - 1.96 * se
    ci_high = mean + 1.96 * se

    return {
        "mean": mean,
        "std": std,
        "scores": scores.tolist(),
        "ci_95": (ci_low, ci_high),
        "n_folds": n,
    }
```

## Statistical Model Comparison

### Paired t-Test for Model Comparison

```python
from scipy import stats

def compare_models_statistical(
    model_a_scores: list[float],
    model_b_scores: list[float],
    alpha: float = 0.05,
) -> dict:
    """Statistical comparison of two models using paired t-test."""

    t_stat, p_value = stats.ttest_rel(model_a_scores, model_b_scores)
    mean_diff = np.mean(model_a_scores) - np.mean(model_b_scores)

    return {
        "model_a_mean": np.mean(model_a_scores),
        "model_b_mean": np.mean(model_b_scores),
        "mean_difference": mean_diff,
        "t_statistic": t_stat,
        "p_value": p_value,
        "significant": p_value < alpha,
        "better_model": "A" if mean_diff > 0 else "B",
    }
```

### McNemar's Test (for Classification)

```python
def mcnemar_test(y_true, y_pred_a, y_pred_b) -> dict:
    """McNemar's test: are two classifiers significantly different?"""
    from statsmodels.stats.contingency_tables import mcnemar as mcnemar_fn

    correct_a = (y_pred_a == y_true)
    correct_b = (y_pred_b == y_true)

    n01 = ((~correct_a) & correct_b).sum()  # A wrong, B right
    n10 = (correct_a & (~correct_b)).sum()   # A right, B wrong

    table = [[0, n01], [n10, 0]]
    result = mcnemar_fn(table, exact=True)

    return {
        "a_right_b_wrong": int(n10),
        "a_wrong_b_right": int(n01),
        "p_value": result.pvalue,
        "significant": result.pvalue < 0.05,
    }
```

## Bias and Fairness Assessment

### Fairness Metrics

```python
def compute_fairness_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    sensitive_attr: np.ndarray,
    privileged_value=1,
    unprivileged_value=0,
) -> dict:
    """Compute fairness metrics across a sensitive attribute."""

    priv_mask = sensitive_attr == privileged_value
    unpriv_mask = sensitive_attr == unprivileged_value

    # Demographic parity
    rate_priv = y_pred[priv_mask].mean()
    # ... (condensed) ...
        "tpr_privileged": round(tpr_priv, 4),
        "tpr_unprivileged": round(tpr_unpriv, 4),
        "fpr_privileged": round(fpr_priv, 4),
        "fpr_unprivileged": round(fpr_unpriv, 4),
    }
```

### Fairness Metric Definitions

| Metric | Definition | Fair When |
|--------|-----------|-----------|
| Demographic Parity | Selection rate ratio across groups | Ratio between 0.8-1.25 |
| Equal Opportunity | True positive rate ratio | Ratio between 0.8-1.25 |
| Equalized Odds | TPR and FPR equal across groups | Both ratios near 1.0 |
| Predictive Parity | Positive predictive value equal | Ratio between 0.8-1.25 |
| Calibration | P(Y=1 given score=s) same across groups | Calibration curves overlap |

### Subgroup Analysis

```python
import pandas as pd

def subgroup_performance(
    y_true, y_pred, y_prob,
    group_column: np.ndarray,
    group_names: dict,
) -> pd.DataFrame:
    """Compute performance metrics per subgroup."""
    results = []

    for group_val, group_name in group_names.items():
        mask = group_column == group_val
        if mask.sum() < 10:
            continue
# ... (condensed) ...
                metrics["auc_roc"] = float(roc_auc_score(y_true[mask], prob))

        results.append(metrics)

    return pd.DataFrame(results)
```

## A/B Testing for Models

### Online A/B Test Framework

```python
import hashlib
from dataclasses import dataclass, field
from scipy import stats

@dataclass
class ModelABTest:
    """A/B test framework for comparing models in production."""
    name: str
    model_a_name: str
    model_b_name: str
    traffic_split: float = 0.5
    results_a: list = field(default_factory=list)
    results_b: list = field(default_factory=list)

    # ... (condensed) ...
            "effect_size": "small" if abs(cohens_d) < 0.5 else "medium" if abs(cohens_d) < 0.8 else "large",
            "recommendation": "B" if p_value < 0.05 and mean_b > mean_a else "A" if p_value < 0.05 else "continue_testing",
            "samples_a": len(self.results_a),
            "samples_b": len(self.results_b),
        }
```

### Sample Size Planning

```python
from scipy.stats import norm

def required_sample_size(
    baseline_metric: float,
    minimum_detectable_effect: float,
    alpha: float = 0.05,
    power: float = 0.8,
    metric_std: float = None,
) -> int:
    """Calculate required sample size per group for A/B test."""
    if metric_std is None:
        metric_std = np.sqrt(baseline_metric * (1 - baseline_metric))

    z_alpha = norm.ppf(1 - alpha / 2)
    z_beta = norm.ppf(power)

    n = (2 * metric_std**2 * (z_alpha + z_beta)**2) / minimum_detectable_effect**2
    return int(np.ceil(n))
```

## Comprehensive Scoring Report

```python
def generate_scoring_report(
    model_name: str,
    y_true, y_pred, y_prob=None,
    sensitive_attrs: dict = None,
) -> dict:
    """Generate comprehensive scoring report."""

    report = {
        "model": model_name,
        "dataset_size": len(y_true),
        "class_distribution": {int(k): int(v) for k, v in zip(*np.unique(y_true, return_counts=True))},
    }

    report["metrics"] = classification_report_full(y_true, y_pred, y_prob)
# ... (condensed) ...
            report["fairness"][attr_name] = compute_fairness_metrics(
                y_true, y_pred, attr_values
            )

    return report
```

## Checklist

- [ ] Select metrics appropriate to the task and class distribution
- [ ] Report multiple metrics (never rely on accuracy alone)
- [ ] Analyze the confusion matrix for systematic error patterns
- [ ] Optimize the classification threshold if using probabilities
- [ ] Use proper cross-validation (stratified for classification, temporal for time series)
- [ ] Compute confidence intervals on performance estimates
- [ ] Perform statistical tests when comparing models
- [ ] Audit for bias across sensitive attributes (gender, race, age)
- [ ] Check fairness metrics (demographic parity, equal opportunity)
- [ ] Plan A/B tests with proper sample size calculations
- [ ] Document all metrics, thresholds, and decisions in a scoring report

## When to Use

**Use this skill when:**
- Designing or implementing model evaluator solutions
- Reviewing or improving existing model evaluator approaches
- Making architectural or implementation decisions about model evaluator
- Learning model evaluator patterns and best practices
- Troubleshooting model evaluator-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Model Evaluator Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement model evaluator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended model evaluator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When model evaluator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
