---
name: ml-pipeline
description: |
  ML pipeline design covering feature engineering, model training workflows, hyperparameter tuning, cross-validation, experiment tracking (MLflow, W&B), model versioning, data versioning (DVC), reproducibility, and pipeline orchestration.
  Use when the user asks about ml pipeline, ml pipeline best practices, or needs guidance on ml pipeline implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml automation guide"
  category: "ai-machine-learning"
  subcategory: "ml-fundamentals"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# ML Pipeline

## Overview

A production ML pipeline transforms raw data into deployed predictions through a series of reproducible, automated stages. This skill covers end-to-end pipeline design from data ingestion through model training, scoring, versioning, and orchestration, with emphasis on reproducibility and experiment tracking.

## Pipeline Architecture

```
+----------+    +-----------+    +----------+    +----------+    +---------+
|  Data    | -> | Feature   | -> | Model    | -> | Model    | -> | Model   |
| Ingest   |    | Engineer  |    | Training |    | Scoring  |    | Registry|
+----------+    +-----------+    +----------+    +----------+    +---------+
     |               |               |               |               |
     v               v               v               v               v
  [DVC]         [Feature        [Experiment     [Metrics        [MLflow
   Data          Store]          Tracker]        Store]         Registry]
  Version
```

## Data Versioning with DVC

### Setup

```shell
# Initialize DVC in your project
install via pip: dvc dvc-s3  # or dvc-gs, dvc-azure
cd your-ml-project
dvc init

# Configure remote storage
dvc remote add -d myremote s3://my-bucket/dvc-store
dvc remote modify myremote access_key_id $AWS_ACCESS_KEY
dvc remote modify myremote secret_access_key $AWS_SECRET_KEY

# Track a dataset
dvc add data/training_data.csv
git add data/training_data.csv.dvc data/.gitignore
git commit -m "Add training dataset v1"

# Push data to remote
dvc push
```

### Data Pipeline with DVC

```yaml
# dvc.yaml
stages:
  preprocess:
    cmd: python src/preprocess.py
    deps:
      - src/preprocess.py
      - data/raw/
    params:
      - preprocess.min_samples
      - preprocess.test_split
    outs:
      # ... (condensed) ...
    plots:
      - metrics/confusion_matrix.csv:
          x: predicted
          y: actual
```

```yaml
# params.yaml
preprocess:
  min_samples: 100
  test_split: 0.2

train:
  learning_rate: 0.1
  n_estimators: 200
  max_depth: 6
```

```shell
# Run the full pipeline
dvc repro

# Compare metrics across experiments
dvc metrics diff

# Switch to a different data version
git checkout v2-data
dvc checkout
```

## Feature Engineering Pipeline

### Scikit-learn Pipeline Pattern

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif

def build_feature_pipeline(
    numeric_features: list[str],
    categorical_features: list[str],
    text_features: list[str] = None,
) -> ColumnTransformer:
    # ... (condensed) ...
                (f"text_{feat}", TfidfVectorizer(max_features=1000), feat)
            )

    return ColumnTransformer(transformers=transformers)
```

### Full Training Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier

def build_training_pipeline(config: dict) -> Pipeline:
    """Complete pipeline from raw features to predictions."""

    feature_pipeline = build_feature_pipeline(
        numeric_features=config["numeric_features"],
        categorical_features=config["categorical_features"],
    )

    # ... (condensed) ...
        )),
    ])

    return pipeline
```

## Hyperparameter Tuning

### Optuna (Recommended)

```python
import optuna
from sklearn.model_selection import cross_val_score
import xgboost as xgb

def objective(trial, X_train, y_train):
    """Optuna objective function for XGBoost tuning."""
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 100, 1000),
        "max_depth": trial.suggest_int("max_depth", 3, 12),
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
        "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
        # ... (condensed) ...
)

print(f"Best score: {study.best_value:.4f}")
print(f"Best params: {study.best_params}")
```

### Tuning Strategy Decision Tree

```
Dataset size < 10K samples?
  YES -> Grid search (exhaustive, fast enough)
  NO  -> Continue

Budget > 100 trials?
  YES -> Bayesian optimization (Optuna)
  NO  -> Continue

Need distributed tuning?
  YES -> Ray Tune or Optuna with distributed backend
  NO  -> Optuna single-node or RandomizedSearchCV
```

## Cross-Validation Strategies

### Strategy Selection

| Strategy | When to Use | Pitfall |
|----------|------------|---------|
| K-Fold (k=5) | Default choice | Data leakage with time series |
| Stratified K-Fold | Imbalanced classes | Still random splits |
| Time Series Split | Temporal data | Cannot use future data |
| Group K-Fold | Grouped observations | Groups must not leak |
| Leave-One-Out | Very small datasets | Computationally expensive |
| Nested CV | Hyperparameter tuning + scoring | Slow but unbiased |

### Nested Cross-Validation

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold, RandomizedSearchCV

def nested_cross_validation(X, y, model_fn, param_distributions, n_outer=5, n_inner=3):
    """Unbiased performance estimate with hyperparameter tuning."""
    outer_cv = StratifiedKFold(n_splits=n_outer, shuffle=True, random_state=42)
    outer_scores = []

    for train_idx, test_idx in outer_cv.split(X, y):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        # ... (condensed) ...
        "mean": np.mean(outer_scores),
        "std": np.std(outer_scores),
        "scores": outer_scores,
    }
```

## Experiment Tracking

### MLflow

```python
import mlflow
import mlflow.sklearn

# Configure tracking server
mlflow.set_tracking_uri("[reference URL]")
mlflow.set_experiment("customer-churn-prediction")

def train_with_tracking(config: dict, X_train, y_train, X_test, y_test):
    """Train model with full MLflow tracking."""

    with mlflow.start_run(run_name=f"xgb-{config['max_depth']}d"):
        # ... (condensed) ...
            "feature_importance.json"
        )

        return metrics
```

### Weights & Biases

```python
import wandb

def train_with_wandb(config: dict, X_train, y_train, X_test, y_test):
    """Train with W&B tracking and sweeps."""

    run = wandb.init(
        project="customer-churn",
        config=config,
        tags=["xgboost", "v2"],
    )

    # ... (condensed) ...
        "roc_curve": wandb.plot.roc_curve(y_test, model.predict_proba(X_test)),
    })

    run.finish()
```

### W&B Sweeps for Hyperparameter Tuning

```yaml
# sweep_config.yaml
method: bayes
metric:
  name: f1
  goal: maximize
parameters:
  learning_rate:
    distribution: log_uniform_values
    min: 0.001
    max: 0.3
  max_depth:
    # ... (condensed) ...
    max: 1.0
early_terminate:
  type: hyperband
  min_iter: 10
```

```python
sweep_id = wandb.sweep(sweep_config, project="customer-churn")
wandb.agent(sweep_id, function=train_with_wandb, count=50)
```

## Model Versioning and Registry

### MLflow Model Registry

```python
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Register model from a run
model_uri = f"runs:/{run_id}/model"
mv = mlflow.register_model(model_uri, "churn-predictor")

# Transition model stage
client.transition_model_version_stage(
    name="churn-predictor",
    # ... (condensed) ...
        name="churn-predictor",
        version=mv.version,
        stage="Production",
    )
```

## Reproducibility

### Configuration Management

```python
from dataclasses import dataclass, field
import yaml

@dataclass
class DataConfig:
    raw_path: str = "data/raw"
    processed_path: str = "data/processed"
    test_split: float = 0.2
    random_seed: int = 42
    min_samples: int = 100

# ... (condensed) ...
            data=DataConfig(**raw.get("data", {})),
            model=ModelConfig(**raw.get("model", {})),
            experiment_name=raw.get("experiment_name", "default"),
        )
```

### Seed Management

```python
import random
import numpy as np
import torch
import os

def set_all_seeds(seed: int = 42):
    """Set all random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    environment-variables["PYTHONHASHSEED"] = str(seed)
```

## Pipeline Orchestration

### Prefect Pipeline

```python
from prefect import flow, task
from prefect.artifacts import create_markdown_artifact

@task(retries=2, retry_delay_seconds=60)
def ingest_data(config: DataConfig) -> pd.DataFrame:
    """Load and validate raw data."""
    df = pd.read_parquet(config.raw_path)
    assert len(df) > config.min_samples, f"Too few samples: {len(df)}"
    return df

@task
# ... (condensed) ...
    if metrics["f1"] > 0.8:
        register_model(model, metrics, config)

    return metrics
```

### Airflow DAG

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    "owner": "ml-team",
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "email_on_failure": True,
}

# ... (condensed) ...
    score = PythonOperator(task_id="score_model", python_callable=score_model_fn)
    register = PythonOperator(task_id="register_model", python_callable=register_model_fn)

    ingest >> feature_eng >> train >> score >> register
```

## Project Structure

```
ml-project/
+-- config/
|   +-- config.yaml
|   +-- params.yaml
+-- data/
|   +-- raw/
|   +-- processed/
|   +-- raw.dvc
+-- src/
|   +-- data/
|   |   +-- ingest.py
# ... (condensed) ...
+-- dvc.yaml
+-- dvc.lock
+-- pyproject.toml
+-- Makefile
```

## Checklist

- [ ] Version data with DVC or similar tool
- [ ] Build feature pipeline using sklearn Pipeline or equivalent
- [ ] Implement cross-validation appropriate to data type
- [ ] Set up Optuna or similar for hyperparameter tuning
- [ ] Configure experiment tracking (MLflow or W&B)
- [ ] Register models with versioning and stage transitions
- [ ] Set all random seeds for reproducibility
- [ ] Define pipeline config in YAML, not hardcoded
- [ ] Orchestrate with Prefect, Airflow, or similar
- [ ] Write tests for feature engineering and data validation
- [ ] Document the pipeline architecture and run instructions

## When to Use

**Use this skill when:**
- Designing or implementing ml pipeline solutions
- Reviewing or improving existing ml pipeline approaches
- Making architectural or implementation decisions about ml pipeline
- Learning ml pipeline patterns and best practices
- Troubleshooting ml pipeline-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Ml Pipeline Analysis

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

**Input:** "Help me implement ml pipeline for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended ml pipeline approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When ml pipeline must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
