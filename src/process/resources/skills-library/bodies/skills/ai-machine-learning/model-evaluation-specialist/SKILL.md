---
name: model-evaluation-specialist
description: |
  Advanced model evaluation covering LLM benchmarks, evaluation frameworks (lm-evaluate-harness, HELM, RAGAS), leaderboard interpretation, custom metrics design, human evaluation protocols, automated LLM-as-judge patterns, and evaluation pipeline architecture for both traditional ML and generative AI systems.
  Use when the user asks about model evaluation specialist, model evaluation specialist best practices, or needs guidance on model evaluation specialist implementation.
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

# Model Evaluation Specialist

## Overview

Model evaluation for modern AI extends beyond accuracy metrics. LLMs and generative models require multi-dimensional assessment: factuality, reasoning, instruction following, safety, and human preference alignment. This skill covers evaluation frameworks, benchmark suites, custom metrics, LLM-as-judge patterns, and reproducible evaluation pipelines.

## LLM Benchmark Landscape

| Benchmark | Measures | Tasks | Scoring |
|-----------|----------|-------|---------|
| MMLU | Broad knowledge | 57 subjects, multiple choice | Accuracy |
| HumanEval / MBPP | Code generation | Python problems | pass@k |
| GSM8K | Math reasoning | Grade school word problems | Exact match |
| MT-Bench | Instruction following | 80 multi-turn questions | LLM judge 1-10 |
| AlpacaEval | Instruction following | 805 instructions | Win rate |
| TruthfulQA | Factuality | 817 misconception questions | Accuracy |
| HELM | Holistic evaluation | Multiple scenarios | Multi-metric |
| IFEval | Instruction compliance | Verifiable constraints | Compliance rate |
| WildBench | Real-world tasks | User-submitted prompts | LLM pairwise |

### Benchmark Selection Guide

```
General-purpose LLM:
  Quick ranking -> AlpacaEval or MT-Bench
  Comprehensive -> HELM or custom suite
  Knowledge -> MMLU + TruthfulQA

Code generation:
  Function completion -> HumanEval (pass@1, pass@10)
  Multi-file -> SWE-bench

Reasoning:
  Math -> GSM8K + MATH
  Logic -> BigBench-Hard + ARC-Challenge

RAG system:
  Retrieval quality -> BEIR
  End-to-end -> RAGAS framework

Chat / assistant:
  Single-turn -> AlpacaEval
  Multi-turn -> MT-Bench
  Real-world -> WildBench + Arena Elo
```

## Evaluation Frameworks

### lm-evaluate-harness

```python
import lm_eval

results = lm_eval.simple_evaluate(
    model="hf",
    model_args="pretrained=meta-llama/Llama-3-8B",
    tasks=["mmlu", "hellaswag", "arc_challenge", "truthfulqa_mc2"],
    batch_size=8,
    num_fewshot=5,
)

for task, metrics in results["results"].items():
    print(f"{task}: {metrics}")
```

### RAGAS (RAG Evaluation)

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset

def evaluate_rag(questions, answers, contexts, ground_truths) -> dict:
    dataset = Dataset.from_dict({
        "question": questions, "answer": answers,
        "contexts": contexts, "ground_truth": ground_truths,
    })
    result = evaluate(dataset, metrics=[
        faithfulness, answer_relevancy, context_precision, context_recall,
    ])
    return dict(result)
```

| RAGAS Metric | Measures | Good Score |
|-------------|----------|------------|
| Faithfulness | Answer grounded in context? | >0.85 |
| Answer Relevancy | Addresses the question? | >0.80 |
| Context Precision | Retrieved docs relevant? | >0.75 |
| Context Recall | All needed docs retrieved? | >0.80 |

## LLM-as-Judge Patterns

### Pairwise Comparison

```python
from openai import OpenAI
import json

class LLMJudge:
    def __init__(self, judge_model: str = "gpt-4o"):
        self.client = OpenAI()
        self.model = judge_model

    def pairwise_compare(self, prompt: str, response_a: str, response_b: str, criteria: str) -> dict:
        judge_prompt = f"""Compare two responses to the given prompt.

## Prompt
{prompt}

## Response A
{response_a}

## Response B
{response_b}

## Criteria: {criteria}

Analyze both, then give verdict as "A", "B", or "tie".
JSON: {{"reasoning": "...", "verdict": "A" or "B" or "tie"}}"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": judge_prompt}],
            response_format={"type": "json_object"},
            temperature=0,
        )
        return json.loads(response.choices[0].message.content)

    def score_response(self, prompt: str, response: str, rubric: dict) -> dict:
        rubric_text = "\n".join(f"- {d}: {desc}" for d, desc in rubric.items())
        judge_prompt = f"""Score this response on each dimension (1-5).

## Prompt: {prompt}
## Response: {response}
## Rubric:\n{rubric_text}

JSON: {{"scores": {{"dim": score}}, "reasoning": "..."}}"""

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": judge_prompt}],
            response_format={"type": "json_object"}, temperature=0,
        )
        return json.loads(resp.choices[0].message.content)
```

### Reducing Judge Bias

| Bias | Mitigation |
|------|------------|
| Position bias | Randomize order, run both orderings |
| Verbosity bias | Include "conciseness" in criteria |
| Self-preference | Use different model as judge |
| Style bias | Focus rubric on content, not style |

```python
def debiased_pairwise(judge, prompt, resp_a, resp_b, criteria) -> dict:
    """Run comparison in both orderings to reduce position bias."""
    r1 = judge.pairwise_compare(prompt, resp_a, resp_b, criteria)
    r2 = judge.pairwise_compare(prompt, resp_b, resp_a, criteria)

    v1 = r1["verdict"]
    v2 = {"A": "B", "B": "A", "tie": "tie"}[r2["verdict"]]

    if v1 == v2:
        return {"verdict": v1, "confidence": "high"}
    elif "tie" in (v1, v2):
        return {"verdict": v1 if v2 == "tie" else v2, "confidence": "medium"}
    return {"verdict": "tie", "confidence": "low"}
```

## Custom Metrics Design

```python
from abc import ABC, abstractmethod

class EvalMetric(ABC):
    @property
    @abstractmethod
    def name(self) -> str: pass

    @abstractmethod
    def compute(self, prediction: str, reference, context: dict = None) -> float: pass

class StructuredOutputAccuracy(EvalMetric):
    @property
    def name(self): return "structured_output_accuracy"

    def compute(self, prediction: str, reference: dict, context=None) -> float:
        import json
        try:
            parsed = json.loads(prediction)
        except json.JSONDecodeError:
            return 0.0
        expected = set(reference.keys())
        actual = set(parsed.keys())
        key_score = len(expected & actual) / len(expected) if expected else 1.0
        type_ok = sum(
            1 for k in expected & actual
            if type(parsed[k]).__name__ == type(reference[k]).__name__
        )
        return (key_score + type_ok / max(len(expected), 1)) / 2

class InstructionCompliance(EvalMetric):
    @property
    def name(self): return "instruction_compliance"

    def compute(self, prediction: str, reference, context=None) -> float:
        constraints = (context or {}).get("constraints", [])
        if not constraints:
            return 1.0
        met = 0
        for c in constraints:
            if c["type"] == "max_words" and len(prediction.split()) <= c["value"]:
                met += 1
            elif c["type"] == "contains" and c["value"].lower() in prediction.lower():
                met += 1
            elif c["type"] == "starts_with" and prediction.strip().startswith(c["value"]):
                met += 1
        return met / len(constraints)
```

## Human Evaluation Protocols

```
Absolute Rating:
  - Rate each response 1-5 on multiple dimensions
  - Min 3 annotators per item, include calibration examples

Pairwise Preference:
  - Show two responses side by side (randomized order)
  - Pick: A better / B better / tie
  - Most reliable for model ranking

Best-of-N:
  - Show N responses from N models, rank all
  - Efficient for comparing multiple models
```

### Inter-Annotator Agreement

```python
from sklearn.metrics import cohen_kappa_score
import numpy as np

def compute_agreement(annotations: list[list[int]]) -> dict:
    """Compute pairwise Cohen's Kappa across annotators."""
    kappas = []
    for i in range(len(annotations)):
        for j in range(i + 1, len(annotations)):
            kappas.append(cohen_kappa_score(annotations[i], annotations[j]))
    mean_k = np.mean(kappas)
    level = ("almost perfect" if mean_k > 0.8 else "substantial" if mean_k > 0.6
             else "moderate" if mean_k > 0.4 else "fair" if mean_k > 0.2 else "slight")
    return {"mean_kappa": round(mean_k, 4), "agreement_level": level}
```

## Evaluation Pipeline

```python
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
import json, numpy as np

@dataclass
class EvalConfig:
    model_name: str
    eval_suite: str
    tasks: list[str]
    num_samples: int = None
    seed: int = 42

class EvaluationPipeline:
    def __init__(self, config: EvalConfig):
        self.config = config
        self.metrics: list[EvalMetric] = []

    def add_metric(self, metric: EvalMetric):
        self.metrics.append(metric)

    def run(self, dataset: list[dict], model_fn) -> dict:
        import random
        random.seed(self.config.seed)
        samples = dataset
        if self.config.num_samples:
            samples = random.sample(dataset, min(self.config.num_samples, len(dataset)))

        per_sample = []
        for s in samples:
            pred = model_fn(s["prompt"])
            scores = {m.name: m.compute(pred, s.get("reference"), s.get("context", {})) for m in self.metrics}
            per_sample.append(scores)

        aggregated = {}
        for m in self.metrics:
            vals = [r[m.name] for r in per_sample]
            aggregated[m.name] = {"mean": round(np.mean(vals), 4), "std": round(np.std(vals), 4)}

        return {"config": vars(self.config), "metrics": aggregated, "n_samples": len(samples)}
```

## Leaderboard Pitfalls

| Pitfall | What to Check |
|---------|---------------|
| Contamination | Training data cutoff, decontamination methods |
| Cherry-picking | Look for comprehensive evals, not single metrics |
| Prompt sensitivity | Check if few-shot format matches reported results |
| Stale benchmarks | Prefer recent benchmarks, check for data leaks |
| Missing error bars | Look for confidence intervals or repeated runs |

## Evaluation Anti-Patterns

```
Evaluating on training data -> Hold out test data, check contamination
Single metric decisions -> Multi-dimensional evaluation
Ignoring variance -> Report confidence intervals, multiple seeds
Static evaluation -> Automate in CI/CD
Trusting LLM judges blindly -> Calibrate against human annotations
Benchmarks as product decisions -> Always validate on your specific data
```

## Checklist

- [ ] Define evaluation dimensions relevant to the use case
- [ ] Select benchmarks (avoid saturation, check contamination)
- [ ] Set up reproducible pipeline with versioned configs
- [ ] Implement automated metrics for rapid iteration
- [ ] Add LLM-as-judge with position bias mitigation
- [ ] Design human evaluate protocol with rubrics and calibration
- [ ] Compute inter-annotator agreement
- [ ] Build custom metrics for domain-specific quality
- [ ] Report confidence intervals and statistical significance
- [ ] Compare models on cost-normalized and latency-normalized bases
- [ ] Automate evaluation in CI/CD for continuous monitoring

## When to Use

**Use this skill when:**
- Designing or implementing model evaluation specialist solutions
- Reviewing or improving existing model evaluation specialist approaches
- Making architectural or implementation decisions about model evaluation specialist
- Learning model evaluation specialist patterns and best practices
- Troubleshooting model evaluation specialist-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Model Evaluation Specialist Analysis

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

**Input:** "Help me implement model evaluation specialist for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended model evaluation specialist approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When model evaluation specialist must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
