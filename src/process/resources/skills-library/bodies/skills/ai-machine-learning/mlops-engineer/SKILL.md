---
name: mlops-engineer
description: |
  MLOps and deployment covering model serving (TorchServe, TF Serving, Triton), containerized inference, A/B testing deployment, model monitoring (data drift, concept drift), feature stores, CI/CD for ML, GPU optimization, and model compression.
  Use when the user asks about mlops engineer, mlops engineer best practices, or needs guidance on mlops engineer implementation.
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
  difficulty: "intermediate"
---

# MLOps Engineer

## Overview

MLOps bridges the gap between model development and production deployment. This skill covers model serving infrastructure, containerized inference, deployment strategies, monitoring for drift, CI/CD pipelines for ML, GPU optimization, and model compression.

## Model Serving

### Serving Framework Comparison

| Framework | Models | Batching | GPU | Protocol |
|-----------|--------|----------|-----|----------|
| TorchServe | PyTorch | Yes | Yes | REST/gRPC |
| TF Serving | TF/Keras | Yes | Yes | REST/gRPC |
| Triton | Multi-framework | Yes | Yes | REST/gRPC |
| BentoML | Multi-framework | Yes | Yes | REST/gRPC |
| vLLM | LLMs | Yes | Yes | OpenAI-compatible |

### TorchServe Deployment

```shell
# Package model
torch-model-archiver \
    --model-name my_classifier \
    --version 1.0 \
    --model-file model.py \
    --serialized-file model_weights.pth \
    --handler image_classifier \
    --export-path model_store

# Start server
torchserve --start \
    --model-store model_store \
    --models my_classifier=my_classifier.mar \
    --ncs
```

### NVIDIA Triton Inference Server

```
# config.pbtxt
name: "my_model"
platform: "onnxruntime_onnx"
max_batch_size: 32

input [
  { name: "input", data_type: TYPE_FP32, dims: [3, 224, 224] }
]
output [
  { name: "output", data_type: TYPE_FP32, dims: [1000] }
]

instance_group [{ count: 2, kind: KIND_GPU }]

dynamic_batching {
  preferred_batch_size: [8, 16, 32]
  max_queue_delay_microseconds: 100
}
```

```shell
docker run --gpus=all --rm -p 8000:8000 -p 8001:8001 \
    -v $(pwd)/model_repository:/models \
    nvcr.io/nvidia/tritonserver:24.01-py3 \
    tritonserver --model-repository=/models
```

## Containerized Inference

### FastAPI Inference Server

```python
from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np, joblib, time

app = FastAPI(title="ML Inference Service")
model = None

@app.on_event("startup")
async def load_model():
    global model
    model = joblib.load("model/classifier.joblib")

class PredictionRequest(BaseModel):
    features: list[float]

class PredictionResponse(BaseModel):
    prediction: int
    probability: list[float]
    model_version: str
    latency_ms: float

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    start = time.time()
    features = np.array(request.features).reshape(1, -1)
    prediction = model.predict(features)
    probability = model.predict_proba(features)
    latency = (time.time() - start) * 1000
    return PredictionResponse(
        prediction=int(prediction[0]),
        probability=probability[0].tolist(),
        model_version="1.0.0",
        latency_ms=round(latency, 2),
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-inference
spec:
  replicas: 3
  selector:
    matchLabels: { app: ml-inference }
  template:
    metadata:
      labels: { app: ml-inference }
    spec:
      containers:
      - name: inference
        image: my-registry/ml-inference:v1.0.0
        ports: [{ containerPort: 8080 }]
        resources:
          requests: { memory: "512Mi", cpu: "500m" }
          limits: { memory: "1Gi", cpu: "1000m" }
        readinessProbe:
          httpGet: { path: /health, port: 8080 }
          initialDelaySeconds: 10
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ml-inference-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ml-inference
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 70 }
```

## A/B Testing Deployment

### Traffic Splitting with Istio

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ml-inference
spec:
  hosts: [ml-inference-svc]
  http:
  - route:
    - destination: { host: ml-inference-svc, subset: model-v1 }
      weight: 80
    - destination: { host: ml-inference-svc, subset: model-v2 }
      weight: 20
```

### Application-Level A/B Testing

```python
import hashlib

class ModelRouter:
    def __init__(self, models: dict, traffic_config: dict):
        self.models = models
        self.traffic_config = traffic_config

    def route(self, request_id: str) -> str:
        # MD5 used for deterministic traffic routing only. Do NOT use MD5 for passwords or security.
        hash_val = int(hashlib.md5(request_id.encode()).hexdigest(), 16) % 100
        cumulative = 0
        for version, weight in self.traffic_config.items():
            cumulative += weight * 100
            if hash_val < cumulative:
                return version
        return list(self.traffic_config.keys())[-1]

    def predict(self, request_id: str, features):
        version = self.route(request_id)
        prediction = self.models[version].predict(features)
        log_prediction(request_id, version, prediction)
        return prediction, version
```

## Model Monitoring

### Data Drift Detection

```python
from scipy import stats
import numpy as np

class DriftDetector:
    def __init__(self, reference_data: np.ndarray, feature_names: list[str]):
        self.reference = reference_data
        self.feature_names = feature_names

    def detect_drift(self, current_data: np.ndarray, alpha: float = 0.05) -> dict:
        results = {}
        for i, feature in enumerate(self.feature_names):
            ref_values = self.reference[:, i]
            cur_values = current_data[:, i]
            ks_stat, ks_pval = stats.ks_2samp(ref_values, cur_values)
            psi = self._compute_psi(ref_values, cur_values)
            results[feature] = {
                "ks_statistic": round(ks_stat, 4),
                "drift_detected": ks_pval < alpha,
                "psi": round(psi, 4),
                "psi_severity": "none" if psi < 0.1 else "moderate" if psi < 0.25 else "severe",
            }
        return results

    def _compute_psi(self, expected, actual, buckets=10):
        breakpoints = np.percentile(expected, np.linspace(0, 100, buckets + 1))
        breakpoints[0], breakpoints[-1] = -np.inf, np.inf
        exp_counts = np.histogram(expected, bins=breakpoints)[0] / len(expected)
        act_counts = np.histogram(actual, bins=breakpoints)[0] / len(actual)
        exp_counts = np.clip(exp_counts, 1e-6, None)
        act_counts = np.clip(act_counts, 1e-6, None)
        return np.sum((act_counts - exp_counts) * np.log(act_counts / exp_counts))
```

### Monitoring Dashboard Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

PREDICTION_COUNT = Counter("model_predictions_total", "Total predictions", ["model_version", "prediction_class"])
PREDICTION_LATENCY = Histogram("model_prediction_latency_seconds", "Prediction latency", ["model_version"])
PREDICTION_CONFIDENCE = Histogram("model_prediction_confidence", "Confidence scores", ["model_version"])
DRIFT_SCORE = Gauge("model_drift_score", "Data drift PSI score", ["feature_name"])
```

## CI/CD for ML

### GitHub Actions ML Pipeline

```yaml
name: ML Pipeline
on:
  push:
    paths: ['src/**', 'data/**', 'config/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: install via pip: -r requirements.txt
      - run: pytest tests/ -v

  train:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: install via pip: -r requirements.txt && dvc pull && dvc repro
      - run: python scripts/check_metrics.py

  deploy:
    needs: train
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t ml-inference:${{ github.sha }} .
      - run: docker push my-registry/ml-inference:${{ github.sha }}
      - run: kubectl set image deployment/ml-inference inference=my-registry/ml-inference:${{ github.sha }}
```

## GPU Optimization

### Mixed Precision & TensorRT

```python
import torch

# FP16 inference
model = model.half().to("cuda")
with torch.no_grad():
    with torch.cuda.amp.autocast():
        output = model(input_tensor.half().cuda())

# TensorRT optimization
import torch_tensorrt

trt_model = torch_tensorrt.compile(
    model.cuda(),
    inputs=[torch_tensorrt.Input(shape=sample_input.shape, dtype=torch.float16)],
    enabled_precisions={torch.float16},
)
```

## Model Compression

### Quantization

```python
# Post-training dynamic quantization
model_quantized = torch.quantization.quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8,
)
```

### Knowledge Distillation

```python
import torch.nn.functional as F

def distillation_loss(student_logits, teacher_logits, labels, temperature=4.0, alpha=0.5):
    soft_loss = F.kl_div(
        F.log_softmax(student_logits / temperature, dim=1),
        F.softmax(teacher_logits / temperature, dim=1),
        reduction="batchmean",
    ) * (temperature ** 2)
    hard_loss = F.cross_entropy(student_logits, labels)
    return alpha * soft_loss + (1 - alpha) * hard_loss
```

### Compression Decision Guide

```
Latency target < 10ms?  -> TensorRT + FP16 + batching
Model too large?        -> Quantization (INT8) first, then pruning
Need smallest model?    -> Knowledge distillation to smaller architecture
Otherwise               -> FP16 quantization is usually sufficient
```

## Checklist

- [ ] Choose serving framework based on model type and scale
- [ ] Containerize inference service with health checks
- [ ] Set up Kubernetes deployment with auto-scaling
- [ ] Implement A/B testing for safe model rollouts
- [ ] Monitor data drift (PSI, KS test) on input features
- [ ] Set up Prometheus/Grafana dashboards for model metrics
- [ ] Build CI/CD pipeline with quality gates
- [ ] Apply GPU optimization (FP16, TensorRT, batching)
- [ ] Consider model compression (quantization, distillation)
- [ ] Plan model retraining triggers and cadence

## When to Use

**Use this skill when:**
- Designing or implementing mlops engineer solutions
- Reviewing or improving existing mlops engineer approaches
- Making architectural or implementation decisions about mlops engineer
- Learning mlops engineer patterns and best practices
- Troubleshooting mlops engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Mlops Engineer Analysis

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

**Input:** "Help me implement mlops engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended mlops engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When mlops engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
