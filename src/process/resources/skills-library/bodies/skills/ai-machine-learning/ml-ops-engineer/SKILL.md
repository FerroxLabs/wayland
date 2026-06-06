---
name: ml-ops-engineer
description: |
  Machine learning operations covering MLflow experiment tracking and model registry, model versioning and reproducibility, model serving with TorchServe and Triton, A/B testing models in production, data and concept drift detection, feature stores, CI/CD for ML pipelines, and GPU resource optimization.
  Use when the user asks about ml ops engineer, ml ops engineer best practices, or needs guidance on ml ops engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml devops guide"
  category: "ai-machine-learning"
  subcategory: "ml-fundamentals"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# ML Ops Engineer

## Overview

ML Operations (MLOps) bridges the gap between machine learning experimentation and production reliability. This skill focuses on the operational side: tracking experiments reproducibly, managing model versions, serving models at scale, monitoring for drift, automating ML pipelines, and building the infrastructure that makes ML a first-class production concern.

## MLflow Experiment Tracking

### Comprehensive Experiment Logging

```python
import mlflow
from mlflow.models import infer_signature

mlflow.set_tracking_uri("[reference URL]")
mlflow.set_experiment("customer-churn-prediction")

with mlflow.start_run(run_name="xgboost-v3-feature-eng") as run:
    # Log parameters
    params = {
        "model_type": "xgboost",
        "n_estimators": 500,
        "max_depth": 6,
        "learning_rate": 0.1,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "feature_engineering_version": "v3",
        "training_data_start": "2023-01-01",
        "training_data_end": "2024-06-01",
    }
    mlflow.log_params(params)

    # Train model
    model = xgb.XGBClassifier(**{k: v for k, v in params.items()
                                  if k not in ['model_type', 'feature_engineering_version',
                                               'training_data_start', 'training_data_end']})
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    # Log metrics
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    mlflow.log_metrics({
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "auc_roc": roc_auc_score(y_test, y_proba),
        "log_loss": log_loss(y_test, y_proba),
    })

    # Log training curves
    for i, (train_loss, val_loss) in enumerate(zip(
        model.evals_result()['validation_0']['logloss'],
        model.evals_result()['validation_1']['logloss']
    )):
        mlflow.log_metric("train_loss", train_loss, step=i)
        mlflow.log_metric("val_loss", val_loss, step=i)

    # Log model with signature
    signature = infer_signature(X_test, y_pred)
    mlflow.sklearn.log_model(
        model,
        artifact_path="model",
        signature=signature,
        input_example=X_test[:5],
        registered_model_name="churn-predictor",
    )

    # Log artifacts
    mlflow.log_artifact("feature_engineering.py")
    mlflow.log_artifact("data_validation_report.html")

    # Log feature importance plot
    fig = plot_feature_importance(model, X_train.columns)
    mlflow.log_figure(fig, "feature_importance.png")

    # Log dataset info
    mlflow.log_input(
        mlflow.data.from_pandas(X_train.assign(target=y_train)),
        context="training"
    )

    print(f"Run ID: {run.info.run_id}")
```

## Model Registry

### Model Lifecycle Management

```python
from mlflow import MlflowClient

client = MlflowClient()

# Promote model through stages
def promote_model(model_name: str, version: int, stage: str):
    """Promote model version through staging -> production."""
    # Validate model before promotion
    model_version = client.get_model_version(model_name, version)

    if stage == "Production":
        # Run validation checks before production
        validation_results = validate_model_for_production(model_name, version)
        if not validation_results['passed']:
            raise ValueError(f"Model failed validation: {validation_results['failures']}")

        # Archive current production model
        current_prod = client.get_latest_versions(model_name, stages=["Production"])
        for mv in current_prod:
            client.transition_model_version_stage(
                model_name, mv.version, "Archived"
            )

    client.transition_model_version_stage(
        model_name, version, stage
    )

    # Tag the transition
    client.set_model_version_tag(
        model_name, version,
        f"promoted_to_{stage.lower()}", datetime.utcnow().isoformat()
    )

def validate_model_for_production(model_name, version):
    """Comprehensive pre-production validation."""
    checks = []

    # 1. Performance threshold
    run = client.get_run(model_version.run_id)
    auc = float(run.data.metrics.get('auc_roc', 0))
    checks.append({
        'name': 'auc_threshold',
        'passed': auc >= 0.80,
        'value': auc,
        'threshold': 0.80,
    })

    # 2. No performance regression vs current production
    current_prod_auc = get_production_model_metric(model_name, 'auc_roc')
    checks.append({
        'name': 'no_regression',
        'passed': auc >= current_prod_auc * 0.98,  # Allow 2% margin
        'value': auc,
        'threshold': current_prod_auc * 0.98,
    })

    # 3. Model size check
    model_size_mb = get_model_artifact_size(model_name, version)
    checks.append({
        'name': 'model_size',
        'passed': model_size_mb <= 500,  # Max 500MB
        'value': model_size_mb,
    })

    # 4. Inference latency check
    p99_latency = benchmark_inference_latency(model_name, version)
    checks.append({
        'name': 'latency_p99',
        'passed': p99_latency <= 100,  # Max 100ms
        'value': p99_latency,
    })

    return {
        'passed': all(c['passed'] for c in checks),
        'checks': checks,
        'failures': [c for c in checks if not c['passed']],
    }
```

## Model Serving

### Serving Architecture Decision

| Framework | Best For | Latency | Throughput | GPU Support |
|-----------|----------|---------|------------|-------------|
| TorchServe | PyTorch models | Low | High | Yes |
| Triton | Multi-framework, GPU | Very Low | Very High | Yes |
| TF Serving | TensorFlow models | Low | High | Yes |
| BentoML | Python-first, easy | Medium | Medium | Yes |
| vLLM | LLM serving | Low | High | Yes |
| FastAPI + custom | Simple models | Varies | Medium | Optional |

### Model Serving with FastAPI

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import mlflow
import numpy as np

app = FastAPI(title="Churn Prediction Service")

# Load model at startup
model = None

@app.on_event("startup")
def load_model():
    global model
    model = mlflow.pyfunc.load_model("models:/churn-predictor/Production")

class PredictionRequest(BaseModel):
    features: dict
    request_id: str = None

class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    model_version: str
    request_id: str = None

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    import time
    start = time.time()

    try:
        features_df = pd.DataFrame([request.features])
        prediction = model.predict(features_df)
        probability = float(prediction[0]) if isinstance(prediction[0], float) \
            else float(prediction[0][1])

        latency = time.time() - start

        # Log prediction for monitoring
        log_prediction(
            request_id=request.request_id,
            features=request.features,
            prediction=int(prediction[0] > 0.5),
            probability=probability,
            latency_ms=latency * 1000,
            model_version=model.metadata.model_uuid,
        )

        return PredictionResponse(
            prediction=int(probability > 0.5),
            probability=probability,
            model_version=model.metadata.model_uuid,
            request_id=request.request_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}
```

## A/B Testing Models

### Traffic Splitting Strategy

```python
import hashlib

class ModelRouter:
    """Route predictions to different model versions for A/B testing."""

    def __init__(self, experiments: list[dict]):
        """
        experiments = [
            {"name": "control", "model": "v1", "weight": 0.80},
            {"name": "candidate", "model": "v2", "weight": 0.20},
        ]
        """
        self.experiments = experiments
        self._validate_weights()

    def route(self, user_id: str) -> dict:
        """Deterministic routing based on user_id hash."""
        hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        bucket = hash_val % 10000  # 10000 buckets for 0.01% granularity

        cumulative = 0
        for exp in self.experiments:
            cumulative += exp['weight'] * 10000
            if bucket < cumulative:
                return exp

        return self.experiments[-1]  # Fallback to last

    def evaluate_experiment(self, metrics_df):
        """Statistical evaluation of A/B test results."""
        from scipy import stats

        control = metrics_df[metrics_df['experiment'] == 'control']
        candidate = metrics_df[metrics_df['experiment'] == 'candidate']

        # Two-sample t-test for conversion rate
        t_stat, p_value = stats.ttest_ind(
            control['converted'].values,
            candidate['converted'].values,
        )

        control_rate = control['converted'].mean()
        candidate_rate = candidate['converted'].mean()
        lift = (candidate_rate - control_rate) / control_rate * 100

        return {
            'control_rate': control_rate,
            'candidate_rate': candidate_rate,
            'lift_pct': lift,
            'p_value': p_value,
            'significant': p_value < 0.05,
            'sample_size': {'control': len(control), 'candidate': len(candidate)},
            'recommendation': 'deploy_candidate' if p_value < 0.05 and lift > 0
                             else 'keep_control',
        }
```

## Drift Detection

### Data Drift and Concept Drift Monitoring

```python
from scipy import stats
import numpy as np

class DriftDetector:
    """Monitor for data drift and concept drift in production."""

    def __init__(self, reference_data, feature_names):
        self.reference = reference_data
        self.feature_names = feature_names
        self.reference_stats = self._compute_stats(reference_data)

    def detect_data_drift(self, production_data, window_size=1000):
        """Detect feature distribution changes."""
        drift_results = {}

        for i, feature in enumerate(self.feature_names):
            ref_values = self.reference[:, i]
            prod_values = production_data[:, i]

            # KS test for continuous features
            stat, p_value = stats.ks_2samp(ref_values, prod_values)

            # Population Stability Index (PSI)
            psi = self._compute_psi(ref_values, prod_values)

            drift_results[feature] = {
                'ks_statistic': stat,
                'ks_p_value': p_value,
                'psi': psi,
                'drifted': psi > 0.2 or p_value < 0.01,
                'severity': 'high' if psi > 0.25 else 'medium' if psi > 0.1 else 'low',
            }

        return drift_results

    def detect_concept_drift(self, predictions, actuals, window_size=500):
        """Detect changes in model-target relationship."""
        windows = []
        for i in range(0, len(predictions) - window_size, window_size // 2):
            window_preds = predictions[i:i + window_size]
            window_actuals = actuals[i:i + window_size]

            accuracy = np.mean(window_preds == window_actuals)
            windows.append({
                'window_start': i,
                'accuracy': accuracy,
            })

        # Detect downward trend
        if len(windows) >= 4:
            recent_accuracy = np.mean([w['accuracy'] for w in windows[-3:]])
            baseline_accuracy = np.mean([w['accuracy'] for w in windows[:3]])

            return {
                'baseline_accuracy': baseline_accuracy,
                'recent_accuracy': recent_accuracy,
                'degradation': baseline_accuracy - recent_accuracy,
                'concept_drift_detected': (baseline_accuracy - recent_accuracy) > 0.05,
            }

        return {'concept_drift_detected': False, 'insufficient_data': True}

    def _compute_psi(self, reference, production, bins=10):
        """Population Stability Index."""
        ref_pcts, edges = np.histogram(reference, bins=bins)
        prod_pcts, _ = np.histogram(production, bins=edges)

        ref_pcts = ref_pcts / len(reference) + 1e-6
        prod_pcts = prod_pcts / len(production) + 1e-6

        psi = np.sum((prod_pcts - ref_pcts) * np.log(prod_pcts / ref_pcts))
        return psi

# PSI interpretation:
# < 0.1:  No significant drift
# 0.1-0.2: Moderate drift (monitor closely)
# > 0.2:  Significant drift (retrain recommended)
```

## ML CI/CD Pipeline

```yaml
# .github/workflows/ml-pipeline.yml
name: ML Pipeline
on:
  push:
    paths: ['models/**', 'features/**', 'training/**']

jobs:
  validate-data:
    runs-on: ubuntu-latest
    steps:
      - name: Validate training data
        run: python training/validate_data.py
      - name: Check data drift
        run: python training/check_data_drift.py

  train:
    needs: validate-data
    runs-on: [self-hosted, gpu]
    steps:
      - name: Train model
        run: python training/train.py --experiment ci-${{ github.sha }}
      - name: Evaluate model
        run: python training/evaluate.py --run-id $RUN_ID
      - name: Compare with production
        run: python training/compare_with_production.py --run-id $RUN_ID

  register:
    needs: train
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Register model
        run: python training/register_model.py --run-id $RUN_ID --stage Staging

  integration-test:
    needs: register
    runs-on: ubuntu-latest
    steps:
      - name: Load staging model
        run: python tests/test_model_serving.py --stage Staging
      - name: Run integration tests
        run: pytest tests/integration/ -v
      - name: Promote to production
        if: success()
        run: python training/promote_model.py --stage Production
```

## MLOps Maturity Checklist

```
Level 0 - Manual:
  [ ] Models trained in notebooks
  [ ] Manual deployment
  [ ] No versioning or tracking

Level 1 - Tracked:
  [ ] Experiment tracking (MLflow)
  [ ] Model registry with versioning
  [ ] Reproducible training scripts
  [ ] Basic model serving (API)

Level 2 - Automated:
  [ ] Automated training pipeline
  [ ] CI/CD for model deployment
  [ ] Automated testing (unit + integration)
  [ ] Feature store for feature reuse
  [ ] Model validation gates

Level 3 - Monitored:
  [ ] Data drift detection
  [ ] Concept drift detection
  [ ] Model performance monitoring
  [ ] Automated alerting on degradation
  [ ] A/B testing infrastructure

Level 4 - Automated Retraining:
  [ ] Triggered retraining on drift detection
  [ ] Automated model comparison and promotion
  [ ] Shadow deployment before production
  [ ] Automatic rollback on performance drop
  [ ] Full audit trail of all model changes
```

## When to Use

**Use this skill when:**
- Designing or implementing ml ops engineer solutions
- Reviewing or improving existing ml ops engineer approaches
- Making architectural or implementation decisions about ml ops engineer
- Learning ml ops engineer patterns and best practices
- Troubleshooting ml ops engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Ml Ops Engineer Analysis

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

**Input:** "Help me implement ml ops engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended ml ops engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When ml ops engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
