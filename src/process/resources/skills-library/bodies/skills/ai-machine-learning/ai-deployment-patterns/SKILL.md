---
name: ai-deployment-patterns
description: |
  Guides expert-level ai deployment patterns implementation: ai-ml and devops decision frameworks, production-ready patterns, and concrete templates for ai deployment patterns workflows.
  Use when the user asks about ai deployment patterns, ai deployment patterns configuration, or ai-ml best practices for ai projects.
  Do NOT use when the user needs a different ai ml engineering capability -- check sibling skills in the ai ml engineering subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml devops cloud"
  category: "ai-machine-learning"
  subcategory: "ai-ml-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# AI Deployment Patterns

## When to Use

**Use this skill when:**
- User is deploying an ML model or LLM-based system to production and needs to choose a serving architecture (batch inference, real-time API, streaming, edge)
- User needs to decide between blue/green deployments, canary releases, shadow mode testing, or A/B model experiments for rolling out a new model version
- User is designing a multi-model pipeline (ensemble, cascade, router, or fallback chain) and needs guidance on orchestration patterns
- User needs to implement model versioning, artifact management, and rollback procedures for a production ML system
- User is experiencing latency, throughput, or cost problems with a deployed model and needs to apply optimization patterns (batching, caching, quantization, async processing)
- User is building a feature store, model registry, or serving layer and needs to understand integration patterns
- User needs to design the observability stack for a live ML system including drift detection, prediction logging, and alerting thresholds

**Do NOT use this skill when:**
- User needs help with model training, hyperparameter tuning, or experiment tracking -- use the ML Training Workflows skill
- User is designing the data pipeline feeding a model -- use the ML Data Engineering skill
- User needs prompt engineering for an LLM application -- use the Prompt Engineering skill
- User is asking about general Kubernetes or Docker deployment without ML-specific concerns -- use the Container Orchestration skill
- User needs cost optimization for cloud infrastructure broadly -- use the Cloud Cost Optimization skill
- User is asking about MLOps platform selection (Vertex AI vs SageMaker vs Azure ML) without a deployment-specific question -- use the MLOps Platform Evaluation skill
- User needs help with model evaluation metrics or offline benchmarking -- use the Model Evaluation skill

---

## Process

### Step 1: Classify the Deployment Scenario

Before recommending any pattern, establish the concrete constraints.

- **Inference mode:** Is this real-time (latency SLA < 500ms), near-real-time (seconds to minutes), or batch (hours-scale jobs)? These require fundamentally different architectures and cannot be swapped cheaply after launch.
- **Request volume:** Estimate requests per second (RPS). Under 10 RPS favors a simple API server; 10-1000 RPS needs autoscaling; over 1000 RPS requires dedicated inference infrastructure with load balancing and horizontal scaling.
- **Model size class:** Categorize as small (< 500MB, e.g., scikit-learn, small ONNX), medium (500MB--5GB, e.g., BERT-family, ResNet), or large (> 5GB, e.g., LLMs requiring GPU or multi-GPU). Size class determines hosting options and cold-start behavior.
- **Latency SLA:** Determine P50, P95, and P99 targets. A P99 of 200ms is very different from P99 of 2 seconds. Most users conflate average with tail latency -- push for explicit P99 requirements.
- **Stateful vs stateless:** Does the model need conversation history, session context, or per-user state? Stateful serving requires sticky routing or external session storage and eliminates many simple horizontal scaling patterns.
- **Data sensitivity:** PII, PHI, or MNPI in the input/output changes which cloud services are usable, logging policies, and whether a model API call can leave the network boundary.

### Step 2: Select the Core Serving Pattern

Match the classified scenario to the correct serving architecture.

- **REST API serving (synchronous):** Use when latency SLA is under 2 seconds and clients can block on a response. Deploy model behind a REST or gRPC interface. Tools: TorchServe, TensorFlow Serving, Triton Inference Server, BentoML, or a plain FastAPI wrapper for small models. Always expose a `/health` and `/ready` endpoint separately -- liveness and readiness probes have different semantics in Kubernetes.
- **Async/queue-based serving:** Use when requests can tolerate > 2 seconds end-to-end, when inputs arrive in bursts, or when the model is expensive (GPU LLM inference). Pattern: producer pushes to a queue (Kafka, SQS, RabbitMQ), worker pool consumes, results written to a results store (Redis, DynamoDB) with a callback or polling endpoint. This decouples client throughput from model throughput.
- **Batch inference:** Use for scheduled scoring jobs (daily churn prediction, weekly recommendation refresh). Pattern: trigger on schedule or data arrival, load model from registry, read input from data warehouse (BigQuery, Redshift, Snowflake), write predictions to output table, track job metadata. Frameworks: Spark MLlib for distributed scoring, Ray for Python-native parallelism, or simple multiprocessing for small-to-medium datasets.
- **Streaming inference:** Use when predictions must be generated on an event stream (fraud detection on transactions, real-time content moderation). Pattern: Kafka Streams or Flink consumer reads events, model is embedded in the processor or called via sidecar, predictions are emitted downstream. Key constraint: model load time must be << stream consumer timeout.
- **Edge/on-device inference:** Use when latency SLA is under 50ms, network is unreliable, or data cannot leave the device. Requires model export to ONNX, TFLite, or CoreML, plus quantization (INT8 or FP16) to fit device memory. Update mechanism must be designed explicitly -- models cannot update like server-side deployments.

### Step 3: Design the Release and Rollout Strategy

Never deploy a new model version directly to 100% of traffic without a staged rollout.

- **Shadow mode (traffic mirroring):** Route 100% of production traffic to the existing model AND mirror it to the new model without serving the new model's predictions to users. Compare outputs offline. Use this pattern first for any significant model change. Requires storing shadow predictions for comparison -- budget for the storage cost. Run shadow mode for at least 24 hours covering a full traffic cycle.
- **Canary deployment:** After shadow mode validation, route a small percentage (typically 1-5%) of live traffic to the new model. Monitor error rates, latency P99, and business metrics. Define explicit rollback criteria before starting the canary (e.g., "roll back if P99 latency increases by > 20% or error rate exceeds 0.5%"). Use weighted routing in your load balancer or service mesh (Istio, AWS ALB weighted target groups).
- **Blue/green deployment:** Maintain two identical serving environments (blue = current production, green = new version). Switch traffic entirely at the load balancer level. Rollback is instant -- flip traffic back to blue. Costs 2x infrastructure during the overlap window. Preferred for model changes that affect the schema of inputs or outputs, where a gradual canary would create version skew problems.
- **A/B model experiment:** Different from a canary -- A/B testing is for measuring business metric impact, not catching errors. Route users consistently (by user ID hash, not randomly per request) to model A or model B, measure downstream conversions or engagement, run a proper statistical test (minimum detectable effect, power analysis) before declaring a winner. Do not run A/B tests for less than the time needed to reach statistical significance, typically 1-2 full weekly business cycles.
- **Feature flags for model routing:** Use a feature flag system (LaunchDarkly, Unleash, or internal) to control model version routing at runtime without redeployment. This enables instant rollback without a new deployment pipeline run.

### Step 4: Implement Model Versioning and the Model Registry

Model artifacts must be versioned and reproducible before any deployment pattern will work reliably.

- **Artifact storage:** Store model artifacts (weights, serialized objects, preprocessing pipelines) in versioned object storage (S3, GCS) with immutable paths (include git commit SHA and training run ID in the path). Never overwrite a model artifact -- always write to a new path.
- **Registry metadata:** For every registered model version, record: training data version or snapshot date, training code git SHA, evaluation metrics on a held-out test set (accuracy, F1, AUC, RMSE as applicable), model size in MB, expected input schema (feature names and dtypes), expected output schema, and the engineer who promoted it to staging/production.
- **Promotion gates:** Enforce a promotion workflow: train --> registered (staging) --> approved (production). Promotion from staging to production must require a passing evaluation suite and at least one human approval. Automate the gate checks; require manual approval only at the final promotion step.
- **Rollback procedure:** A rollback must be a first-class operation that takes under 5 minutes. Document it as a runbook. The rollback should point serving infrastructure at the previous model version artifact path without changing any application code.

### Step 5: Build the Inference Serving Infrastructure

Design the serving layer with production requirements, not prototype assumptions.

- **Containerize the model:** Package the model and all dependencies into a Docker image with a pinned base image (e.g., `python:3.11.4-slim`, not `python:latest`). The inference container must be stateless -- no local file writes during inference. Model weights should be loaded at container startup from object storage, not baked into the image (unless the image size is acceptable and cold start time is not a constraint).
- **Startup and warmup:** After loading weights, run N warmup inference requests (typically 10-50) with representative input shapes before marking the container ready. This fills JIT caches (TorchScript, XLA) and initializes GPU memory. Without warmup, the first real user requests will have 2-10x higher latency.
- **Dynamic batching:** For GPU-served models, enable dynamic batching to amortize the fixed GPU kernel launch overhead. Triton Inference Server supports this natively with configurable `max_queue_delay_microseconds` and `max_batch_size`. A batch size of 8-32 typically gives 3-8x throughput improvement over individual requests. Set `max_queue_delay_microseconds` to no more than 50% of your P99 latency budget.
- **Resource limits:** Set explicit CPU and memory limits on inference containers. For GPU, pin one replica per GPU device or use MIG (Multi-Instance GPU) partitioning for smaller models. Memory leaks in inference servers are common -- set a maximum request count per worker process and recycle workers (gunicorn `--max-requests` or uvicorn equivalent) to bound memory growth.
- **Horizontal autoscaling:** Scale on GPU utilization (target 70-80%) or on request queue depth, not on CPU. Use KEDA (Kubernetes Event-Driven Autoscaling) for queue-depth-based scaling. Set a minimum replica count of at least 2 for any production service to avoid single points of failure and to allow rolling updates without downtime.
- **Timeouts and circuit breakers:** Set aggressive timeouts at every layer: client timeout, load balancer timeout, model server timeout. Use a circuit breaker (Resilience4j, or Envoy circuit breaker via Istio) that opens after N consecutive failures in T seconds. Define the fallback behavior explicitly -- return a cached result, return a default prediction, or return an error with a specific error code that clients handle gracefully.

### Step 6: Implement Observability for Production ML

ML systems have failure modes that standard application monitoring misses entirely.

- **Prediction logging:** Log every inference request: timestamp, input features (or a hash if PII), output prediction, model version, latency, and a unique request ID. Store logs in a structured format (JSON, Parquet) to a queryable store. Prediction logs are the foundation of all other observability.
- **Data drift detection:** Compute feature distribution statistics (mean, standard deviation, percentiles, null rates, categorical frequencies) on a rolling window of prediction logs. Compare to training distribution statistics stored at training time. Alert when the Jensen-Shannon divergence exceeds 0.1 for any individual feature, or when Population Stability Index (PSI) exceeds 0.2 for a critical feature. Tools: Evidently AI, WhyLogs, Nannyml.
- **Concept drift detection:** Monitor prediction distribution over time (mean predicted probability, predicted class distribution, regression output distribution). A shift in prediction distribution is an early signal of concept drift before labels are available. Use Page-Hinkley test or CUSUM for online drift detection.
- **Business metric dashboards:** Connect model predictions to downstream business outcomes where possible (conversions, fraud caught, churn prevented). Build a dashboard tracking these metrics segmented by model version. This is the only way to measure real model value and catch silent failures where the model degrades without technical errors.
- **Alerting thresholds:** Set alerts on: error rate > 1% (P1), P99 latency SLA breach for > 5 minutes (P1), feature null rate increase > 10 percentage points (P2), PSI > 0.25 on any critical feature (P2), prediction distribution shift > 2 standard deviations from 30-day baseline (P2).
- **Trace propagation:** Propagate the request trace ID from the client all the way through to the model inference log. This makes it possible to debug a specific bad prediction by finding it in both the application logs and the model serving logs.

### Step 7: Design Fallback and Graceful Degradation

Every production ML system must have a defined behavior when the model is unavailable or returning low-confidence predictions.

- **Confidence thresholds:** For classification models, define a minimum confidence score below which the model routes to a fallback. Example: if predicted probability max < 0.6, route to a rule-based system or human review queue instead of serving the low-confidence prediction.
- **Fallback hierarchy:** Design a ranked fallback chain: (1) primary model, (2) smaller/faster backup model, (3) rule-based heuristic, (4) cached most-recent prediction, (5) safe default. The farther down the chain, the more degraded the user experience, but the service remains available.
- **Cache layer for idempotent predictions:** For inputs that are repeated frequently (product recommendations for popular items, content moderation for viral content), cache predictions in Redis with a TTL matched to acceptable staleness (typically 1-60 minutes). Cache hit rate of 30-50% is achievable for recommendation systems and eliminates that fraction of model calls entirely.
- **Timeout budget:** Allocate the total request timeout budget across all stages. If the total SLA is 500ms, the model inference budget might be 300ms, leaving 200ms for preprocessing, postprocessing, and network overhead. If the model does not respond within 300ms, execute the fallback path immediately -- do not wait for the full request timeout.

---

## Output Format

Produce the following artifacts when designing or documenting an AI deployment pattern.

### Deployment Pattern Decision Summary

```
Model Deployment Decision Record
=================================
Date:           2024-01-15
Author:         <engineer name>
Model:          customer-churn-classifier-v3
Use Case:       Real-time churn risk scoring at checkout

Serving Pattern:    Synchronous REST API (FastAPI + BentoML)
Rationale:          P99 latency SLA = 200ms, RPS = 45 peak, model size = 85MB

Release Strategy:   Shadow mode (48h) → Canary 5% (24h) → Canary 25% (24h) → Full
Rollback Trigger:   P99 > 180ms OR error rate > 0.5% OR prediction_null_rate > 2%
Fallback:           Rule-based threshold (recency + frequency score)

Infrastructure:
  Replicas (min/max):    2 / 10
  Container CPU:         0.5 / 2.0 cores
  Container Memory:      1Gi / 2Gi
  Autoscale Metric:      request queue depth > 50
  
Monitoring:
  Drift Detection:       PSI on 6 input features, 1-hour rolling window
  Alert P1:              error_rate > 1%, P99 > 200ms
  Alert P2:              PSI > 0.2, prediction_mean shift > 1.5 std
```

### Architecture Diagram (ASCII)

```
Client Request
      |
      v
[API Gateway / Load Balancer]
      |
      |-- Feature Flag: canary? --> [Model v3 Serving Cluster]
      |                                    |
      |-- (else) -----------------> [Model v2 Serving Cluster]
                                          |
                           +-- Input Validation (schema check)
                           +-- Feature Preprocessing
                           +-- [Model Inference Engine]
                           |        |
                           |   [Prediction Cache (Redis, TTL=5min)]
                           |        |
                           +-- Confidence Check
                                  |
                    >= 0.6 -------+------- < 0.6
                      |                       |
               Serve prediction         [Fallback: rule-based]
                      |
                [Prediction Logger]
                      |
                [Response to Client]
                      
Async path:
[Prediction Logger] --> [Kafka topic: model-predictions]
                              |
                   [Drift Detector (Evidently)]
                              |
                   [Metrics Dashboard (Grafana)]
                              |
                   [Alert Manager (PagerDuty)]
```

### Serving Configuration Template (BentoML / FastAPI)

```python
# serving/model_service.py
# Synchronous REST inference service with fallback, caching, and observability

import time
import hashlib
import logging
from typing import Optional
from dataclasses import dataclass

import redis
import bentoml
from bentoml.io import NumpyNdarray, JSON
from prometheus_client import Histogram, Counter, Gauge

# -- Prometheus metrics
INFERENCE_LATENCY = Histogram(
    "model_inference_latency_seconds",
    "Model inference latency",
    buckets=[0.01, 0.025, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0],
    labelnames=["model_version", "path"],  # path: "model" | "cache" | "fallback"
)
PREDICTION_COUNTER = Counter(
    "model_predictions_total",
    "Total predictions served",
    labelnames=["model_version", "path", "confidence_bucket"],
)
FALLBACK_COUNTER = Counter(
    "model_fallback_total",
    "Total fallback activations",
    labelnames=["reason"],  # "low_confidence" | "timeout" | "error"
)

logger = logging.getLogger(__name__)


@dataclass
class InferenceConfig:
    model_tag: str                  # e.g. "churn-classifier:v3.2.1"
    model_version: str              # e.g. "v3.2.1" for labels
    confidence_threshold: float     # e.g. 0.60
    cache_ttl_seconds: int          # e.g. 300
    inference_timeout_ms: int       # e.g. 150
    redis_url: str                  # e.g. "redis://redis-svc:6379/0"
    warmup_requests: int            # e.g. 20


class ModelService:
    def __init__(self, config: InferenceConfig) -> None:
        self.config = config
        self.runner = bentoml.models.get(config.model_tag).to_runner()
        self.cache = redis.from_url(config.redis_url, decode_responses=True)
        self._warmup()

    def _warmup(self) -> None:
        """Run warmup inferences before marking service ready."""
        import numpy as np
        dummy_input = np.zeros((1, 12), dtype=np.float32)  # match training feature count
        for i in range(self.config.warmup_requests):
            self.runner.predict.run(dummy_input)
        logger.info(
            "Warmup complete",
            extra={"warmup_requests": self.config.warmup_requests}
        )

    def _cache_key(self, features: dict) -> str:
        canonical = str(sorted(features.items()))
        return f"pred:{hashlib.sha256(canonical.encode()).hexdigest()[:16]}"

    def _rule_based_fallback(self, features: dict) -> dict:
        """
        Rule-based fallback: deterministic churn score from recency + frequency.
        Returns same schema as model output for transparent substitution.
        """
        recency_days = features.get("days_since_last_order", 999)
        order_count = features.get("order_count_90d", 0)
        score = min(1.0, recency_days / 180.0) * (1.0 - min(1.0, order_count / 10.0))
        return {
            "churn_probability": round(score, 4),
            "confidence": 0.0,          # signal to downstream that this is a fallback
            "prediction_source": "fallback_rules",
        }

    async def predict(self, features: dict) -> dict:
        start = time.perf_counter()
        cache_key = self._cache_key(features)

        # -- Cache check
        cached = self.cache.get(cache_key)
        if cached:
            elapsed = (time.perf_counter() - start) * 1000
            INFERENCE_LATENCY.labels(
                model_version=self.config.model_version, path="cache"
            ).observe(elapsed / 1000)
            PREDICTION_COUNTER.labels(
                model_version=self.config.model_version,
                path="cache",
                confidence_bucket="high",
            ).inc()
            return {"churn_probability": float(cached), "prediction_source": "cache"}

        # -- Model inference with timeout guard
        import asyncio
        import numpy as np

        feature_vector = np.array(
            [list(features.values())], dtype=np.float32
        )
        try:
            result = await asyncio.wait_for(
                self.runner.predict.async_run(feature_vector),
                timeout=self.config.inference_timeout_ms / 1000.0,
            )
            churn_prob = float(result[0][1])  # index 1 = churn class probability
            confidence = max(churn_prob, 1.0 - churn_prob)

            elapsed = (time.perf_counter() - start) * 1000
            confidence_bucket = "high" if confidence >= 0.6 else "low"
            INFERENCE_LATENCY.labels(
                model_version=self.config.model_version, path="model"
            ).observe(elapsed / 1000)
            PREDICTION_COUNTER.labels(
                model_version=self.config.model_version,
                path="model",
                confidence_bucket=confidence_bucket,
            ).inc()

            # -- Confidence gate
            if confidence < self.config.confidence_threshold:
                FALLBACK_COUNTER.labels(reason="low_confidence").inc()
                return self._rule_based_fallback(features)

            # -- Cache successful high-confidence prediction
            self.cache.setex(cache_key, self.config.cache_ttl_seconds, str(churn_prob))

            return {
                "churn_probability": round(churn_prob, 4),
                "confidence": round(confidence, 4),
                "prediction_source": f"model:{self.config.model_version}",
            }

        except asyncio.TimeoutError:
            FALLBACK_COUNTER.labels(reason="timeout").inc()
            logger.warning("Model inference timeout", extra={"timeout_ms": self.config.inference_timeout_ms})
            return self._rule_based_fallback(features)

        except Exception as exc:
            FALLBACK_COUNTER.labels(reason="error").inc()
            logger.error("Model inference error", exc_info=exc)
            return self._rule_based_fallback(features)
```

### Drift Monitoring Configuration

```yaml
# drift_config.yaml -- Evidently AI drift profile
reference_dataset: s3://ml-artifacts/churn-v3/reference/training_sample_10k.parquet
monitoring_window_hours: 1
alert_channel: pagerduty-p2

features:
  - name: days_since_last_order
    type: numerical
    drift_method: psi
    alert_threshold: 0.20

  - name: order_count_90d
    type: numerical
    drift_method: psi
    alert_threshold: 0.20

  - name: payment_method
    type: categorical
    drift_method: chi_square
    alert_threshold: 0.05   # p-value threshold

  - name: customer_tier
    type: categorical
    drift_method: chi_square
    alert_threshold: 0.05

prediction_monitoring:
  metric: mean_predicted_probability
  baseline_window_days: 30
  alert_on_shift_std: 2.0
```

---

## Rules

1. **Never skip shadow mode for a significant model change.** A "significant" change includes: different training data vintage, different feature set, different model architecture or framework, or > 5% change in offline evaluation metrics. Shadow mode is cheap insurance. Skipping it is how silent prediction regressions reach production.

2. **Define rollback criteria before the canary starts, not after.** Specifying rollback thresholds retroactively creates pressure to rationalize away degradation signals. Write the thresholds in the deployment record before the rollout begins and treat them as hard gates, not guidelines.

3. **Never bake model weights into the container image for models larger than 500MB.** Image pull times for large images during autoscale events will exceed your latency SLA. Load weights from object storage at startup, use a persistent volume claim for caching, or use a dedicated model download init container.

4. **Always set a hard timeout on model inference that is no more than 60% of the total request SLA.** Leaving 40% of the time budget for network, preprocessing, and postprocessing prevents a slow model from consuming the entire timeout and leaving no room for the fallback path to execute within SLA.

5. **Never use random per-request routing for A/B model experiments.** Random per-request routing means the same user can get different model versions in consecutive requests, creating inconsistent experiences and confounding session-level business metrics. Always hash on a stable user or entity identifier.

6. **Always version the preprocessing pipeline alongside the model weights.** A model trained on a specific scaler, encoder, or tokenizer will produce garbage predictions if the preprocessing changes without retraining. The model artifact must include or reference the exact preprocessing code and parameters used during training.

7. **Never disable prediction logging in production, even under load.** Prediction logs are required for debugging, retraining, and drift detection. If logging is causing latency problems, make it asynchronous (fire-and-forget to a Kafka topic) rather than disabling it. The cost of losing prediction logs during an incident is higher than the latency overhead.

8. **Always implement readiness and liveness probes with different behaviors.** The liveness probe should only check that the process is alive (not deadlocked). The readiness probe should verify that the model is loaded and has passed warmup. Conflating them causes Kubernetes to restart healthy-but-loading containers during startup.

9. **Never deploy to GPU without profiling the actual batch size vs. throughput curve for your specific model.** The optimal batch size is not always the maximum. For transformer models, throughput often plateaus at batch size 16-32 and memory requirements grow quadratically with sequence length. Profile before setting `max_batch_size` in production.

10. **Always store the training data version or data snapshot identifier alongside the model artifact.** Without this, debugging a model regression is nearly impossible -- you cannot reproduce the training run, understand what distribution the model was trained on, or determine whether a drift alert indicates real world change or a data pipeline bug.

---

## Edge Cases

### LLM-Backed Services with Non-Deterministic Latency

Large language model inference has highly variable latency -- a short prompt may complete in 200ms while a long generation takes 15+ seconds. Standard synchronous REST patterns break under this variability.

- Convert the API to an async job pattern: the client submits a request and receives a job ID immediately (HTTP 202 Accepted), then polls a status endpoint or receives a webhook callback when the generation completes.
- For streaming use cases (chatbot, copilot), use Server-Sent Events (SSE) or WebSocket to stream tokens as they are generated. This improves perceived latency significantly even though total time-to-completion is the same.
- Set token budgets (`max_tokens`) on all LLM calls and fail fast if the model is taking longer than 3x the median completion time -- this indicates the model is stuck in a repetition loop and the generation should be cancelled and retried.
- Track prompt token count and completion token count separately in metrics, because cost and latency are linear in token count and this distribution changes with user behavior over time.

### Multi-Model Cascade (Cheap Screener + Expensive Specialist)

When a fast cheap model handles easy cases and a slow expensive model handles hard cases, the cascade pattern introduces complexity around what "hard" means.

- Define the routing criterion precisely: it should be based on the first model's confidence score, not on features of the input. Routing on input features creates a leaky abstraction where the routing logic duplicates model logic.
- Measure the cascade's overall accuracy as a combined metric, not as the accuracy of each model independently. The cascade P99 latency is bounded by the slow path -- measure it separately from the fast path.
- Always log which path each request took. Without this, it is impossible to calculate the actual distribution of fast vs. slow path requests or to audit the routing decision.
- Budget for the case where the screener model degrades and routes more traffic to the expensive specialist than expected. The specialist serving cluster must be sized for a burst to 100% of traffic, even if it is normally handling 20%.

### GPU Node Interruptions and Spot/Preemptible Instance Use

GPU compute is expensive, and spot or preemptible instances can reduce cost by 60-80%, but they can be interrupted with 2-minute notice.

- Never use spot instances as the sole backend for synchronous real-time serving. Use spot for worker pools behind a queue, where individual worker interruption does not cause a user-facing error -- the job is requeued and picked up by another worker.
- For real-time GPU serving, use a mixed node pool: on-demand nodes handle the minimum baseline RPS, spot nodes handle burst. Configure the autoscaler to prefer spot when scaling up but maintain on-demand minimum replicas.
- Implement proper SIGTERM handling in the inference server: on interrupt signal, stop accepting new requests (mark unready), finish in-flight requests, then exit cleanly. This prevents requests from being dropped during preemption.
- Test interrupt recovery in staging: manually cordon and drain a GPU node and verify that the load balancer stops routing to it before the drain completes.

### Model Registry and Serving Across Multiple Environments (Dev/Staging/Production)

Model versions and their promotion states must be environment-aware without creating per-environment artifact duplication.

- Store a single model artifact in a canonical path. Use the registry metadata (staging, approved, deprecated flags) to control which environments can serve each version. Do not copy artifacts between environment-specific buckets.
- Environment-specific serving configuration (replicas, resource limits, caching TTLs) should be in environment-specific Helm values or Kustomize overlays, not in the model artifact or registry.
- Staging must always run the same model version that is about to be promoted to production, not the production version. Running production models in staging defeats the purpose of staging as a pre-production validation environment.
- Implement a promotion audit log: every time a model version moves from staging to production, record who approved it, what evaluation metrics passed, and what time it was promoted. This is required for compliance in regulated industries and valuable for debugging everywhere.

### Prediction Schema Drift Between Model Versions

When a new model version changes input feature names, adds features, or changes output schema, the serving layer must handle both old and new schemas during the rollout window.

- Version the input and output schemas explicitly (e.g., `input_schema_version: v2`, `output_schema_version: v1`). Include the schema version in the prediction log.
- During a canary rollout of a schema-changing model, the serving layer must accept the old schema and transform it to the new schema before calling the new model. Define this transformation in a backwards-compatibility adapter, not in the client code.
- Blue/green deployment is strongly preferred over canary for schema-breaking changes, because it eliminates the version skew window where two incompatible schemas are both live. The cutover is atomic at the load balancer level.
- After a schema change is fully deployed and the old schema is no longer in use, remove the backwards-compatibility adapter in a subsequent release. Dead compatibility code becomes a maintenance hazard within 3-6 months.

### Cold Start Latency on Serverless and Auto-Scaled Deployments

When the serving infrastructure scales to zero or starts a new replica from scratch, the first request experiences significantly higher latency due to container image pull, process startup, and model weight loading.

- For synchronous real-time services, never scale to zero. Maintain a minimum of 1-2 warm replicas at all times. The cost of 2 idle replicas is almost always less than the cost of cold-start latency degrading a user-facing SLA.
- For async job queues, scale-to-zero is acceptable because the queue buffers requests. Size the cold-start time budget based on acceptable job queue backlog, not on user-facing latency.
- Use provisioned concurrency (AWS Lambda) or always-on minimum instances (Cloud Run) for serverless deployments where true scale-to-zero is a cost requirement but cold starts are unacceptable.
- Reduce cold start time by pre-loading model weights into a shared volume or using SnapStart-style snapshotting (AWS Lambda SnapStart, GCP Cloud Run startup CPU boost) to checkpoint the post-warmup process state and restore it for new instances.

---

## Example

**Input:** "We have a fraud detection model (an XGBoost classifier, ~12MB, 45 features) that currently runs as a nightly batch job, scoring all transactions from the day before. The fraud team wants real-time scoring at transaction time with a P99 latency of 150ms. We're on AWS and use Kubernetes. The model is already in SageMaker Model Registry. What deployment pattern should we use and how do we roll it out safely?"

---

**Output:**

### Step 1: Deployment Pattern Selection

This is a **synchronous real-time REST API** deployment. The requirements are:
- P99 SLA: 150ms -- well within synchronous REST feasibility (XGBoost inference on 45 features takes 1-5ms; the budget is ample)
- Model size: 12MB -- trivially small, loads in < 1 second, can be baked into the container image
- Volume estimate: financial transaction volume typically peaks at 200-500 RPS for mid-size merchants. Confirm the expected RPS during the requirements phase.
- Stateless: each transaction scores independently, no session state needed

**Reject async/queue-based pattern** because the fraud decision must block the transaction authorization -- 150ms is the budget for the full synchronous call, not for a polling loop. A queue-based pattern would add 500ms-2 seconds of round-trip to check job status.

**Reject the batch pattern** for real-time use cases -- the current nightly batch job should be retained as a secondary reconciliation job to catch transactions missed during a serving outage, but it cannot fulfill the real-time requirement.

### Step 2: Architecture

```
Transaction Service (Spring Boot)
         |
         | POST /v1/predict  (timeout: 100ms hard limit)
         v
[AWS ALB -- weighted target groups for canary]
         |
    +----+----+
    |         |
  [v1]      [v2]         <- during canary window
  [XGB]     [XGB]
         |
[FastAPI inference container on EKS]
    |
    +-- Input validation (45-feature schema check, null imputation)
    +-- XGBoost model inference (< 5ms)
    +-- Confidence gate: if max_probability < 0.55 --> return fraud_score=null, route_to_review=true
    +-- Redis cache (TTL=60s, key=hash(card_token + merchant_id + amount_bucket))
    +-- Prediction logger (async, Kafka topic: fraud-predictions)
         |
    [Flink consumer]
         |
    [Drift detector (Evidently)]  -->  [CloudWatch Metrics + PagerDuty alerts]
```

### Step 3: Rollout Plan

**Week 1 -- Shadow Mode:**
- Deploy v2 (real-time model) as a shadow target alongside the existing batch scoring system
- Mirror 100% of transaction events to the new model via Kafka -- the shadow predictions are logged but not used for fraud decisions
- The nightly batch job continues as the authoritative fraud signal
- Compare shadow predictions to the batch model's next-day scores on the same transactions
- Target: shadow prediction should agree with batch model on > 85% of flagged transactions

**Week 2 -- Canary 5%:**
- Route 5% of transactions to the real-time model for the fraud decision
- Route 95% to the batch model (or a rule-based interim if needed -- in practice, the fraud system needs an existing real-time component or this phase is the first real-time signal at all)
- Monitor: error rate, P99 latency, fraud_catch_rate (requires a 24-48hr window for chargebacks to surface), false_positive_rate
- Rollback triggers: P99 > 120ms (80% of 150ms budget), error rate > 0.3%, null prediction rate > 2%

**Week 3 -- Canary 25% then 100%:**
- If Week 2 metrics are clean, increase to 25% for 24 hours, then to 100%
- Retain the batch job as a reconciliation run for 30 days post-launch to catch any systematic errors
- Decommission the batch job only after 30 days of clean real-time operation

### Step 4: Infrastructure Configuration (EKS)

```yaml
# k8s/fraud-inference-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fraud-inference-v2
  labels:
    app: fraud-inference
    version: v2
spec:
  replicas: 3          # minimum 3 for HA + rolling updates without downtime
  selector:
    matchLabels:
      app: fraud-inference
      version: v2
  template:
    spec:
      containers:
        - name: inference
          image: 123456789.dkr.ecr.us-east-1.amazonaws.com/fraud-inference:v2.3.1
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "2000m"
              memory: "1Gi"
          env:
            - name: MODEL_PATH
              value: "/app/models/xgb_fraud_v2.3.1.ubj"   # baked in image (12MB is fine)
            - name: CONFIDENCE_THRESHOLD
              value: "0.55"
            - name: INFERENCE_TIMEOUT_MS
              value: "80"         # 80ms leaves 70ms for network + preprocessing within 150ms SLA
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: fraud-inference-secrets
                  key: redis-url
          livenessProbe:
            httpGet:
              path: /healthz       # only checks process is alive
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /readyz        # checks model loaded + warmup complete
              port: 8080
            initialDelaySeconds: 15   # enough time for warmup (20 requests x 5ms = 100ms)
            periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fraud-inference-v2-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fraud-inference-v2
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Pods
      pods:
        metric:
          name: http_requests_in_flight    # custom metric via KEDA or Prometheus adapter
        target:
          type: AverageValue
          averageValue: "50"              # scale when avg 50 concurrent requests per pod
```

### Step 5: Prediction Logger (Async, Non-Blocking)

```python
# serving/prediction_logger.py
import json
import time
import threading
from queue import Queue, Full
from dataclasses import dataclass, asdict
from typing import Optional
from kafka import KafkaProducer

@dataclass
class PredictionRecord:
    request_id: str
    timestamp_ms: int
    model_version: str
    # Features stored as hash to avoid logging PII card numbers
    feature_hash: str
    # Store non-PII features directly for drift analysis
    transaction_amount_bucket: str    # e.g. "0-10", "10-50", "50-200", "200+"
    merchant_category_code: str
    hour_of_day: int
    day_of_week: int
    # Outputs
    fraud_probability: float
    fraud_decision: bool              # True = flagged
    prediction_source: str            # "model:v2" | "fallback_rules" | "cache"
    inference_latency_ms: float
    confidence: float

class AsyncPredictionLogger:
    """
    Non-blocking prediction logger. Drops events if the queue is full
    rather than blocking the inference response path.
    Acceptable loss rate for logging: < 0.1% of events.
    """
    def __init__(self, kafka_bootstrap: str, topic: str, queue_maxsize: int = 10_000):
        self._queue: Queue = Queue(maxsize=queue_maxsize)
        self._producer = KafkaProducer(
            bootstrap_servers=kafka_bootstrap,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            acks=1,            # leader ack only -- prioritize throughput over durability for logs
            compression_type="gzip",
        )
        self._dropped_count = 0
        self._thread = threading.Thread(target=self._flush_loop, daemon=True)
        self._thread.start()

    def log(self, record: PredictionRecord) -> None:
        try:
            self._queue.put_nowait(asdict(record))
        except Full:
            self._dropped_count += 1
            # Log to stderr only -- do NOT block or raise
            if self._dropped_count % 1000 == 0:
                print(f"WARN: PredictionLogger queue full, dropped {self._dropped_count} events")

    def _flush_loop(self) -> None:
        while True:
            record = self._queue.get()
            try:
                self._producer.send("fraud-predictions", value=record)
            except Exception as e:
                print(f"WARN: Kafka send failed: {e}")
```

### Step 6: Monitoring Alert Rules (Prometheus / Alertmanager)

```yaml
# alerts/fraud-inference-alerts.yaml
groups:
  - name: fraud_inference_p1
    rules:
      - alert: FraudInferenceHighErrorRate
        expr: |
          rate(http_requests_total{job="fraud-inference", status=~"5.."}[5m])
          / rate(http_requests_total{job="fraud-inference"}[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
          team: ml-platform
        annotations:
          summary: "Fraud inference error rate > 1% for 2 minutes"

      - alert: FraudInferenceP99LatencyBreach
        expr: |
          histogram_quantile(0.99,
            rate(model_inference_latency_seconds_bucket{job="fraud-inference"}[5m])
          ) > 0.12   # 120ms = 80% of 150ms SLA -- alert before the SLA is actually breached
        for: 3m
        labels:
          severity: critical

  - name: fraud_inference_p2
    rules:
      - alert: FraudInferenceFallbackRateHigh
        expr: |
          rate(model_fallback_total{job="fraud-inference"}[15m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Fallback activation rate > 5% -- model may be degrading"

      - alert: FraudInferencePredictionDistributionShift
        expr: |
          abs(
            avg_over_time(fraud_prediction_mean[1h])
            - avg_over_time(fraud_prediction_mean[30d])
          ) / stddev_over_time(fraud_prediction_mean[30d]) > 2.0
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Fraud score distribution shifted > 2 std from 30-day baseline"
```

### Expected Outcomes

After full rollout to 100% of real-time traffic:
- **Latency:** P50 ~8ms, P95 ~25ms, P99 ~60ms (well within 150ms SLA; XGBoost on 45 features is fast)
- **Cache hit rate:** ~35% for repeat card/merchant combinations within 60-second TTL window
- **Fraud catch improvement:** Real-time scoring catches fraud 18-23 hours earlier than next-day batch, enabling same-session card blocking
- **Fallback activation rate:** Expected < 1% under normal conditions; monitor this as an early warning signal for model degradation or feature pipeline issues

The nightly batch job is retained as a reconciliation mechanism for 30 days, then decommissioned. Keep the batch infrastructure configuration in version control for 90 days post-decommission in case an outage requires temporary reactivation.
