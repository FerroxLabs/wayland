---
name: python-data-scientist
description: |
  Guide for applied machine learning with scikit-learn covering feature engineering, model selection, pipeline construction, evaluation, hyperparameter tuning, and production-ready model patterns.
  Use when the user asks about python data scientist, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of python data scientist or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics guide python testing performing-arts"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Python Data Scientist

You are an expert applied data scientist who builds robust machine learning pipelines with scikit-learn, engineering features methodically, selecting models systematically, and evaluating results rigorously.


## When to Use

**Use this skill when:**
- User asks about python data scientist techniques or best practices
- User needs guidance on python data scientist concepts
- User wants to implement or improve their approach to python data scientist

**Do NOT use when:**
- The request falls outside the scope of python data scientist
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Project Structure

```
ml-project/
├── data/
│   ├── raw/               # Immutable original data
│   ├── processed/          # Cleaned, feature-engineered data
│   └── external/           # Third-party reference data
├── src/
│   ├── data/
│   │   ├── ingestion.py    # Data loading
│   │   └── validation.py   # Schema checks
│   ├── features/
│   │   ├── engineering.py  # Feature transforms
│   │   └── selection.py    # Feature selection
│   ├── models/
│   │   ├── train.py        # Training pipeline
│   │   ├── evaluate.py     # Metrics and reports
│   │   └── predict.py      # Inference
│   └── utils/
│       └── config.py       # Hyperparameters, paths
├── notebooks/
│   ├── 01-exploration.ipynb
│   └── 02-modeling.ipynb
├── models/                 # Serialized model artifacts
├── tests/
└── pyproject.toml
```

## Feature Engineering

### Numeric Features

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler,
    PowerTransformer, QuantileTransformer
)
from sklearn.impute import SimpleImputer
import numpy as np

numeric_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', RobustScaler()),  # Robust to outliers
])

# When to use each scaler:
# StandardScaler    - Normal-ish data, linear models, SVMs
# MinMaxScaler      - Neural networks, bounded features
# RobustScaler      - Data with outliers
# PowerTransformer  - Skewed distributions (Box-Cox, Yeo-Johnson)
# QuantileTransformer - Force uniform or normal distribution
```

### Categorical Features

```python
from sklearn.preprocessing import (
    OneHotEncoder, OrdinalEncoder, TargetEncoder
)

# One-hot: low cardinality (<15 categories)
ohe = OneHotEncoder(
    drop='if_binary',           # Drop redundant column for binary
    handle_unknown='ignore',     # Handle unseen categories at predict time
    sparse_output=True,          # Memory efficient for high-dim
    min_frequency=0.01,          # Group rare categories
)

# Ordinal: ordered categories
ordinal = OrdinalEncoder(
    categories=[['low', 'medium', 'high', 'critical']],
    handle_unknown='use_encoded_value',
    unknown_value=-1,
)

# Target encoding: high cardinality (cities, zip codes)
target_enc = TargetEncoder(
    smooth='auto',               # Regularization
    target_type='continuous',
)
```

### Date/Time Features

```python
def extract_datetime_features(df, col):
    """Extract useful features from a datetime column."""
    df = df.copy()
    dt = df[col]

    df[f'{col}_year'] = dt.dt.year
    df[f'{col}_month'] = dt.dt.month
    df[f'{col}_day_of_week'] = dt.dt.dayofweek
    df[f'{col}_hour'] = dt.dt.hour
    df[f'{col}_is_weekend'] = dt.dt.dayofweek.isin([5, 6]).astype(int)
    df[f'{col}_quarter'] = dt.dt.quarter
    df[f'{col}_day_of_year'] = dt.dt.dayofyear

    # Cyclical encoding for periodic features
    df[f'{col}_month_sin'] = np.sin(2 * np.pi * dt.dt.month / 12)
    df[f'{col}_month_cos'] = np.cos(2 * np.pi * dt.dt.month / 12)
    df[f'{col}_hour_sin'] = np.sin(2 * np.pi * dt.dt.hour / 24)
    df[f'{col}_hour_cos'] = np.cos(2 * np.pi * dt.dt.hour / 24)

    return df
```

### Custom Transformer

```python
from sklearn.base import BaseEstimator, TransformerMixin

class InteractionFeatures(BaseEstimator, TransformerMixin):
    """Create interaction features between specified column pairs."""

    def __init__(self, interaction_pairs):
        self.interaction_pairs = interaction_pairs

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        for col_a, col_b in self.interaction_pairs:
            X[f'{col_a}_x_{col_b}'] = X[col_a] * X[col_b]
            X[f'{col_a}_div_{col_b}'] = X[col_a] / X[col_b].replace(0, np.nan)
        return X

    def get_feature_names_out(self, input_features=None):
        names = list(input_features) if input_features else []
        for col_a, col_b in self.interaction_pairs:
            names.extend([f'{col_a}_x_{col_b}', f'{col_a}_div_{col_b}'])
        return names
```

## Pipeline Construction

### Full ML Pipeline

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier

# Define column groups
numeric_features = ['age', 'income', 'tenure_months', 'num_products']
categorical_features = ['region', 'plan_type', 'channel']

# Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        ('num', Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
        ]), numeric_features),
        ('cat', Pipeline([
            ('imputer', SimpleImputer(strategy='constant', fill_value='unknown')),
            ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
        ]), categorical_features),
    ],
    remainder='drop',
    verbose_feature_names_out=False,
)

# Full pipeline
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', GradientBoostingClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        random_state=42,
    )),
])

# Fit
pipeline.fit(X_train, y_train)

# Predict
y_pred = pipeline.predict(X_test)
y_proba = pipeline.predict_proba(X_test)[:, 1]
```

## Model Selection Guide

### By Problem Type

| Problem | Start With | Then Try | When to Use |
|---------|-----------|----------|-------------|
| **Binary classification** | Logistic Regression | GBM, Random Forest | Churn, fraud, click |
| **Multi-class** | Random Forest | GBM, SVM | Category prediction |
| **Regression** | Ridge/Lasso | GBM, Random Forest | Revenue, pricing |
| **Ranking** | LambdaMART (LightGBM) | XGBoost ranker | Search, recommendations |
| **Anomaly detection** | Isolation Forest | One-class SVM, LOF | Fraud, outliers |
| **Clustering** | K-Means | DBSCAN, HDBSCAN | Segmentation |
| **Time series** | ARIMA/Prophet | LSTM, LightGBM | Forecasting |

### Model Comparison

```python
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier
)

models = {
    'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=200, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=200, random_state=42),
}

results = {}
for name, model in models.items():
    pipe = Pipeline([
        ('preprocessor', preprocessor),
        ('model', model),
    ])
    scores = cross_val_score(pipe, X_train, y_train, cv=5, scoring='roc_auc')
    results[name] = {
        'mean_auc': scores.mean(),
        'std_auc': scores.std(),
        'scores': scores,
    }
    print(f"{name}: AUC = {scores.mean():.4f} (+/- {scores.std():.4f})")
```

## Model Evaluation

### Classification Metrics

```python
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, average_precision_score,
    roc_curve, precision_recall_curve
)

def evaluate_classifier(y_true, y_pred, y_proba, model_name='Model'):
    """Comprehensive classification evaluation."""
    print(f"=== {model_name} Evaluation ===\n")

    # Classification report
    print(classification_report(y_true, y_pred, digits=3))

    # AUC metrics
    roc_auc = roc_auc_score(y_true, y_proba)
    avg_precision = average_precision_score(y_true, y_proba)
    print(f"ROC AUC:            {roc_auc:.4f}")
    print(f"Average Precision:  {avg_precision:.4f}")

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    print(f"\nConfusion Matrix:")
    print(f"  TN={cm[0,0]:5d}  FP={cm[0,1]:5d}")
    print(f"  FN={cm[1,0]:5d}  TP={cm[1,1]:5d}")

    return {'roc_auc': roc_auc, 'avg_precision': avg_precision}
```

### Regression Metrics

```python
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error,
    r2_score, mean_absolute_percentage_error
)

def evaluate_regressor(y_true, y_pred, model_name='Model'):
    """Comprehensive regression evaluation."""
    mae = mean_absolute_error(y_true, y_pred)
    rmse = mean_squared_error(y_true, y_pred, squared=False)
    r2 = r2_score(y_true, y_pred)
    mape = mean_absolute_percentage_error(y_true, y_pred)

    print(f"=== {model_name} Evaluation ===")
    print(f"MAE:   {mae:.4f}")
    print(f"RMSE:  {rmse:.4f}")
    print(f"R2:    {r2:.4f}")
    print(f"MAPE:  {mape:.2%}")

    return {'mae': mae, 'rmse': rmse, 'r2': r2, 'mape': mape}
```

## Hyperparameter Tuning

### Randomized Search

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform

param_distributions = {
    'classifier__n_estimators': randint(100, 500),
    'classifier__max_depth': randint(3, 10),
    'classifier__learning_rate': uniform(0.01, 0.3),
    'classifier__subsample': uniform(0.6, 0.4),
    'classifier__min_samples_leaf': randint(5, 50),
}

search = RandomizedSearchCV(
    pipeline,
    param_distributions,
    n_iter=50,
    cv=5,
    scoring='roc_auc',
    random_state=42,
    n_jobs=-1,
    verbose=1,
)

search.fit(X_train, y_train)

print(f"Best AUC: {search.best_score_:.4f}")
print(f"Best params: {search.best_params_}")
best_model = search.best_estimator_
```

### Optuna Integration

```python
import optuna
from sklearn.model_selection import cross_val_score

def objective(trial):
    params = {
        'classifier__n_estimators': trial.suggest_int('n_estimators', 100, 500),
        'classifier__max_depth': trial.suggest_int('max_depth', 3, 10),
        'classifier__learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'classifier__subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'classifier__min_samples_leaf': trial.suggest_int('min_samples_leaf', 5, 50),
    }

    pipe = pipeline.set_params(**params)
    scores = cross_val_score(pipe, X_train, y_train, cv=5, scoring='roc_auc')
    return scores.mean()

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100)

print(f"Best AUC: {study.best_value:.4f}")
print(f"Best params: {study.best_params}")
```

## Feature Selection

```python
from sklearn.feature_selection import (
    SelectKBest, f_classif, mutual_info_classif
)
from sklearn.inspection import permutation_importance

# Method 1: Statistical tests
selector = SelectKBest(score_func=f_classif, k=20)
X_selected = selector.fit_transform(X_train_processed, y_train)

# Method 2: Model-based importance
model.fit(X_train_processed, y_train)
importances = pd.DataFrame({
    'feature': feature_names,
    'importance': model.feature_importances_,
}).sort_values('importance', ascending=False)

# Method 3: Permutation importance (model-agnostic)
perm_importance = permutation_importance(
    model, X_test_processed, y_test,
    n_repeats=10, random_state=42, scoring='roc_auc'
)

perm_df = pd.DataFrame({
    'feature': feature_names,
    'importance_mean': perm_importance.importances_mean,
    'importance_std': perm_importance.importances_std,
}).sort_values('importance_mean', ascending=False)
```

## Cross-Validation Strategies

```python
from sklearn.model_selection import (
    StratifiedKFold, TimeSeriesSplit, GroupKFold,
    RepeatedStratifiedKFold
)

# Imbalanced classification
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Time series (no data leakage)
cv = TimeSeriesSplit(n_splits=5, gap=7)  # 7-day gap between train/test

# Grouped data (e.g., same user in train and test)
cv = GroupKFold(n_splits=5)
scores = cross_val_score(pipeline, X, y, cv=cv, groups=user_ids)

# More robust estimate
cv = RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=42)
```

## Model Serialization

```python
import joblib
from pathlib import Path
from datetime import datetime

def save_model(pipeline, metrics, model_dir='models'):
    """Save model with metadata."""
    model_dir = Path(model_dir)
    model_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    model_path = model_dir / f'model_{timestamp}.joblib'
    meta_path = model_dir / f'model_{timestamp}_meta.json'

    # Save model
    joblib.dump(pipeline, model_path)

    # Save metadata
    import json
    metadata = {
        'timestamp': timestamp,
        'metrics': metrics,
        'features': list(pipeline.named_steps['preprocessor'].get_feature_names_out()),
        'model_type': type(pipeline.named_steps['classifier']).__name__,
        'model_path': str(model_path),
    }
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2, default=str)

    print(f"Model saved to {model_path}")
    return model_path
```

## Common Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Data leakage | Unrealistically high test performance | Fit preprocessing only on train data |
| Target leakage | Feature contains future information | Audit feature timestamps |
| Class imbalance | High accuracy, low recall | Use stratified CV, SMOTE, class weights |
| Overfitting | Train >> test performance | Regularization, simpler model, more data |
| Feature scale issues | Linear model ignores some features | Scale all numeric features |
| Missing value patterns | Model fails on new data | Handle unknowns in encoders |
| Train/serve skew | Good offline, bad online | Use same pipeline for train and predict |
| Temporal leakage | Random CV on time series | Use TimeSeriesSplit |


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to python data scientist
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Python Data Scientist Analysis

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

**Input:** "Help me with python data scientist for my current situation"

**Output:**

Based on your situation, here is a structured approach to python data scientist:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
