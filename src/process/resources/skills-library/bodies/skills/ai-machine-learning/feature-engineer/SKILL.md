---
name: feature-engineer
description: |
  Feature engineering covering numerical features (scaling, binning, log transforms), categorical encoding (one-hot, target, ordinal), text features (TF-IDF, embeddings), temporal features, feature selection, feature stores, and automated feature engineering.
  Use when the user asks about feature engineer, feature engineer best practices, or needs guidance on feature engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml data-science guide"
  category: "ai-machine-learning"
  subcategory: "ml-fundamentals"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Feature Engineer

## Overview

Feature engineering transforms raw data into informative representations that improve model performance. It is often the single most impactful step in the ML pipeline. This skill covers transformations for numerical, categorical, text, and temporal data, plus feature selection techniques and feature store patterns.

## Numerical Feature Transformations

### Scaling

```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler

# StandardScaler: zero mean, unit variance
# Best for: Normally distributed features, SVMs, logistic regression
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# MinMaxScaler: scale to [0, 1]
# Best for: Neural networks, features with bounded ranges
scaler = MinMaxScaler(feature_range=(0, 1))
X_scaled = scaler.fit_transform(X)

# RobustScaler: uses median and IQR (robust to outliers)
# Best for: Data with significant outliers
scaler = RobustScaler()
X_scaled = scaler.fit_transform(X)
```

### Scaling Decision Guide

```
Does your model require scaling?
  Tree-based models (XGBoost, RF, LightGBM): NO (not needed)
  Linear models, SVMs, KNN: YES
  Neural networks: YES

Has outliers?
  YES -> RobustScaler
  NO  -> Continue

Need bounded output?
  YES -> MinMaxScaler
  NO  -> StandardScaler (default)
```

### Log and Power Transforms

```python
import numpy as np
from sklearn.preprocessing import PowerTransformer

def handle_skewed_features(df, columns, threshold=1.0):
    """Apply log transform to highly skewed features."""
    transforms = {}

    for col in columns:
        skewness = df[col].skew()

        if abs(skewness) > threshold:
            if (df[col] > 0).all():
                # Log transform for positive values
                df[f"{col}_log"] = np.log1p(df[col])
                # ... (condensed) ...
    return df, transforms

# Box-Cox (requires strictly positive data)
pt = PowerTransformer(method="box-cox")
X_transformed = pt.fit_transform(X_positive)
```

### Binning / Discretization

```python
from sklearn.preprocessing import KBinsDiscretizer

# Equal-width binning
binner = KBinsDiscretizer(n_bins=10, encode="ordinal", strategy="uniform")
X_binned = binner.fit_transform(X)

# Equal-frequency (quantile) binning
binner = KBinsDiscretizer(n_bins=10, encode="ordinal", strategy="quantile")
X_binned = binner.fit_transform(X)

# Custom bins
def custom_bin_age(age: float) -> str:
    if age < 18: return "minor"
    elif age < 30: return "young_adult"
    elif age < 50: return "middle_age"
    elif age < 65: return "senior"
    else: return "elderly"

df["age_group"] = df["age"].apply(custom_bin_age)
```

### Interaction Features

```python
from sklearn.preprocessing import PolynomialFeatures

# Polynomial interactions
poly = PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)
X_interactions = poly.fit_transform(X[["feature_a", "feature_b", "feature_c"]])

# Manual domain-specific interactions
df["price_per_sqft"] = df["price"] / df["sqft"].clip(lower=1)
df["bmi"] = df["weight_kg"] / (df["height_m"] ** 2)
df["debt_to_income"] = df["total_debt"] / df["annual_income"].clip(lower=1)
```

## Categorical Feature Encoding

### Encoding Methods Comparison

| Method | Cardinality | Preserves Order | Handles Unknown | Linear Models | Tree Models |
|--------|------------|----------------|-----------------|---------------|-------------|
| One-Hot | Low (<20) | No | handle_unknown | Good | Wasteful |
| Ordinal | Any (ordered) | Yes | N/A | Good | Good |
| Target | High | No | Smoothing | Good | Good |
| Frequency | High | No | Default value | Good | Good |
| Binary | Medium | No | Fallback | Good | Good |
| Embedding | Very High | No | OOV token | Neural only | N/A |

### One-Hot Encoding

```python
from sklearn.preprocessing import OneHotEncoder
import pandas as pd

# Sklearn
encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore", drop="first")
X_encoded = encoder.fit_transform(df[["color", "size"]])

# Pandas (quick prototyping)
df_encoded = pd.get_dummies(df, columns=["color", "size"], drop_first=True)
```

### Target Encoding (Mean Encoding)

```python
from category_encoders import TargetEncoder
from sklearn.model_selection import KFold

def target_encode_with_smoothing(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    columns: list[str],
    target: str,
    smoothing: float = 10.0,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Target encoding with smoothing to prevent overfitting."""

    encoder = TargetEncoder(
        cols=columns,
        # ... (condensed) ...
        stats = train.groupby(col)[target].agg(["mean", "count"])
        smooth_mean = (stats["mean"] * stats["count"] + global_mean * smoothing) / (stats["count"] + smoothing)
        encoded.iloc[val_idx] = df.iloc[val_idx][col].map(smooth_mean).fillna(global_mean)

    return encoded
```

### Ordinal Encoding

```python
from sklearn.preprocessing import OrdinalEncoder

# When categories have natural order
size_order = ["XS", "S", "M", "L", "XL", "XXL"]
education_order = ["high_school", "bachelors", "masters", "phd"]

encoder = OrdinalEncoder(
    categories=[size_order, education_order],
    handle_unknown="use_encoded_value",
    unknown_value=-1,
)
X_encoded = encoder.fit_transform(df[["size", "education"]])
```

### Frequency Encoding

```python
def frequency_encode(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    """Encode categorical by frequency of occurrence."""
    for col in columns:
        freq = df[col].value_counts(normalize=True)
        df[f"{col}_freq"] = df[col].map(freq)
    return df
```

## Text Feature Engineering

### TF-IDF

```python
from sklearn.feature_extraction.text import TfidfVectorizer

# Basic TF-IDF
vectorizer = TfidfVectorizer(
    max_features=5000,
    min_df=2,
    max_df=0.95,
    ngram_range=(1, 2),
    sublinear_tf=True,
    stop_words="english",
)
X_tfidf = vectorizer.fit_transform(texts)
```

### Text Statistical Features

```python
import numpy as np

def extract_text_features(text: str) -> dict:
    """Extract statistical features from text."""
    words = text.split()
    sentences = text.split(".")

    return {
        "char_count": len(text),
        "word_count": len(words),
        "sentence_count": len(sentences),
        "avg_word_length": np.mean([len(w) for w in words]) if words else 0,
        "avg_sentence_length": np.mean([len(s.split()) for s in sentences if s.strip()]),
        "unique_word_ratio": len(set(words)) / len(words) if words else 0,
        "uppercase_ratio": sum(1 for c in text if c.isupper()) / len(text) if text else 0,
        "digit_ratio": sum(1 for c in text if c.isdigit()) / len(text) if text else 0,
        "punctuation_count": sum(1 for c in text if c in ".,;:!?"),
        "has_question_mark": int("?" in text),
        "has_exclamation": int("!" in text),
    }
```

### Embeddings as Features

```python
from sentence_transformers import SentenceTransformer
import numpy as np

def text_to_embedding_features(
    texts: list[str],
    model_name: str = "all-MiniLM-L6-v2",
) -> np.ndarray:
    """Convert text to dense embedding features."""
    model = SentenceTransformer(model_name)
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=64)
    return embeddings  # Shape: (n_texts, 384)
```

## Temporal Feature Engineering

### Datetime Features

```python
import pandas as pd

def extract_datetime_features(df: pd.DataFrame, date_col: str) -> pd.DataFrame:
    """Extract comprehensive temporal features."""
    dt = pd.to_datetime(df[date_col])

    df[f"{date_col}_year"] = dt.dt.year
    df[f"{date_col}_month"] = dt.dt.month
    df[f"{date_col}_day"] = dt.dt.day
    df[f"{date_col}_dayofweek"] = dt.dt.dayofweek
    df[f"{date_col}_hour"] = dt.dt.hour
    df[f"{date_col}_minute"] = dt.dt.minute
    df[f"{date_col}_quarter"] = dt.dt.quarter
    df[f"{date_col}_is_weekend"] = dt.dt.dayofweek.isin([5, 6]).astype(int)
    # ... (condensed) ...
    df[f"{date_col}_hour_cos"] = np.cos(2 * np.pi * dt.dt.hour / 24)
    df[f"{date_col}_dow_sin"] = np.sin(2 * np.pi * dt.dt.dayofweek / 7)
    df[f"{date_col}_dow_cos"] = np.cos(2 * np.pi * dt.dt.dayofweek / 7)

    return df
```

### Lag Features (Time Series)

```python
def create_lag_features(
    df: pd.DataFrame,
    target_col: str,
    lags: list[int] = [1, 7, 14, 28],
    rolling_windows: list[int] = [7, 14, 30],
) -> pd.DataFrame:
    """Create lag and rolling window features for time series."""

    # Lag features
    for lag in lags:
        df[f"{target_col}_lag_{lag}"] = df[target_col].shift(lag)

    # Rolling statistics
    for window in rolling_windows:
        # ... (condensed) ...
    # Differences
    df[f"{target_col}_diff_1"] = df[target_col].diff(1)
    df[f"{target_col}_pct_change"] = df[target_col].pct_change()

    return df
```

## Feature Selection

### Filter Methods

```python
from sklearn.feature_selection import (
    SelectKBest, f_classif, mutual_info_classif,
    f_regression, mutual_info_regression,
)

def filter_features(
    X, y,
    task: str = "classification",
    k: int = 20,
    method: str = "mutual_info",
) -> list[str]:
    """Select top-k features using filter methods."""

    if task == "classification":
        # ... (condensed) ...
        "score": selector.scores_,
    }).sort_values("score", ascending=False)

    selected = scores.head(k)["feature"].tolist()
    return selected
```

### Recursive Feature Elimination

```python
from sklearn.feature_selection import RFECV
from sklearn.ensemble import RandomForestClassifier

def recursive_feature_selection(X, y, min_features: int = 5) -> list[str]:
    """Recursive feature elimination with cross-validation."""
    model = RandomForestClassifier(n_estimators=100, random_state=42)

    rfecv = RFECV(
        estimator=model,
        step=1,
        cv=5,
        scoring="f1",
        min_features_to_select=min_features,
        n_jobs=-1,
    )
    rfecv.fit(X, y)

    selected = X.columns[rfecv.support_].tolist()
    print(f"Optimal features: {rfecv.n_features_}")
    return selected
```

### Feature Importance from Models

```python
def get_feature_importance(model, feature_names: list[str], X_test=None, y_test=None) -> pd.DataFrame:
    """Extract feature importance from trained models."""

    # Native importance (tree-based models)
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif X_test is not None and y_test is not None:
        # Permutation importance (model-agnostic)
        from sklearn.inspection import permutation_importance
        result = permutation_importance(model, X_test, y_test, n_repeats=10)
        importances = result.importances_mean
    else:
        raise ValueError("Model has no feature_importances_ and no test data provided")

    # ... (condensed) ...
        "feature": X.columns,
        "mean_abs_shap": np.abs(shap_values).mean(axis=0),
    }).sort_values("mean_abs_shap", ascending=False)

    return importance
```

## Feature Stores

### Feast (Open Source Feature Store)

```python
from feast import FeatureStore, Entity, Feature, FeatureView, FileSource
from feast.types import Float32, Int64
from datetime import timedelta

# Define data source
driver_stats_source = FileSource(
    path="data/driver_stats.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created",
)

# Define entity
driver = Entity(
    name="driver_id",
    # ... (condensed) ...
# Get online features for inference
features = store.get_online_features(
    features=["driver_stats:conv_rate", "driver_stats:acc_rate"],
    entity_rows=[{"driver_id": 1001}],
).to_dict()
```

## Automated Feature Engineering

### Featuretools

```python
import featuretools as ft

def auto_feature_engineer(
    df: pd.DataFrame,
    entity_id: str,
    max_depth: int = 2,
) -> pd.DataFrame:
    """Automated feature engineering with Featuretools."""

    es = ft.EntitySet(id="dataset")
    es = es.add_dataframe(
        dataframe_name="main",
        dataframe=df,
        index=entity_id,
    # ... (condensed) ...
        trans_primitives=["day", "month", "year", "weekday", "is_weekend"],
    )

    print(f"Generated {len(feature_defs)} features")
    return feature_matrix
```

## Feature Engineering Pipeline

### Complete Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.impute import SimpleImputer

def build_feature_pipeline(config: dict) -> Pipeline:
    """Build production feature engineering pipeline."""

    numeric_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    categorical_low_card = Pipeline([
        # ... (condensed) ...

    return Pipeline([
        ("preprocessor", preprocessor),
        ("model", config["model"]),
    ])
```

## Checklist

- [ ] Analyze feature distributions before choosing transformations
- [ ] Apply appropriate scaling (or skip for tree-based models)
- [ ] Handle skewed features with log/power transforms
- [ ] Choose categorical encoding based on cardinality and model type
- [ ] Use target encoding with cross-validation to prevent leakage
- [ ] Extract cyclical features (sin/cos) for periodic temporal data
- [ ] Create domain-specific interaction features
- [ ] Apply feature selection to reduce dimensionality
- [ ] Use SHAP for interpretable feature importance
- [ ] Wrap everything in sklearn Pipeline for reproducibility
- [ ] Consider a feature store for team-wide feature sharing
- [ ] Validate that all transformations work on unseen data

## When to Use

**Use this skill when:**
- Designing or implementing feature engineer solutions
- Reviewing or improving existing feature engineer approaches
- Making architectural or implementation decisions about feature engineer
- Learning feature engineer patterns and best practices
- Troubleshooting feature engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Feature Engineer Analysis

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

**Input:** "Help me implement feature engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended feature engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When feature engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
