---
name: synthetic-data-generator
description: |
  Synthetic data generation covering LLM-based data creation, statistical data synthesis, privacy-preserving techniques (differential privacy, k-anonymity), tabular data generation, text augmentation, image augmentation, validation frameworks, and quality assurance for generated datasets.
  Use when the user asks about synthetic data generator, synthetic data generator best practices, or needs guidance on synthetic data generator implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml data-science guide"
  category: "ai-machine-learning"
  subcategory: "applied-ai"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Synthetic Data Generator

## Overview

Synthetic data generation creates artificial datasets that preserve the statistical properties of real data without exposing sensitive information. This skill covers LLM-based text generation, statistical tabular synthesis, privacy-preserving methods, augmentation strategies, and validation to ensure synthetic data is useful and safe.

## When to Use Synthetic Data

| Use Case | Why Synthetic | Risk Level |
|----------|--------------|------------|
| ML training augmentation | Insufficient labeled data | Low |
| Software testing | Need realistic test fixtures | Low |
| Data sharing across teams | Privacy regulations (GDPR, HIPAA) | Medium |
| Bias correction | Underrepresented groups | Medium |
| Rare event simulation | Insufficient edge case examples | Low |
| Public datasets / demos | Cannot expose real customer data | High |

### Decision Tree

```
Privacy / compliance:
  Sharing externally? -> Full synthetic with differential privacy
  Internal only? -> Pseudonymization may suffice

Training data:
  Enough real data? -> Augmentation for diversity / class balance
  Insufficient? -> Full synthetic generation to bootstrap

Testing / development:
  Need realistic distributions? -> Statistical synthesis from real profile
  Just need structure? -> Rule-based Faker data

Research / demos:
  Must look realistic? -> LLM-generated + statistical synthesis
  Just need volume? -> Simple random generation
```

## Tabular Data Generation

### Statistical Synthesis with SDV

```python
from sdv.metadata import Metadata
from sdv.single_table import GaussianCopulaSynthesizer, CTGANSynthesizer
import pandas as pd

class TabularSynthesizer:
    """Generate synthetic tabular data preserving statistical properties."""

    def __init__(self, method: str = "gaussian_copula"):
        self.method = method
        self.synthesizer = None

    def fit(self, real_data: pd.DataFrame) -> None:
        metadata = Metadata.detect_from_dataframe(real_data)
        if self.method == "gaussian_copula":
            self.synthesizer = GaussianCopulaSynthesizer(metadata)
        elif self.method == "ctgan":
            self.synthesizer = CTGANSynthesizer(
                metadata, epochs=300, batch_size=500,
                generator_dim=(256, 256), discriminator_dim=(256, 256),
            )
        self.synthesizer.fit(real_data)

    def generate(self, n_rows: int) -> pd.DataFrame:
        return self.synthesizer.sample(num_rows=n_rows)
```

### Method Comparison

| Method | Speed | Quality | Privacy | Best For |
|--------|-------|---------|---------|----------|
| Gaussian Copula | Fast | Good | Medium | Continuous data, prototyping |
| CTGAN | Slow | Very Good | Medium | Mixed types, complex distributions |
| TVAE | Medium | Good | Medium | Continuous-heavy datasets |
| Faker (rule-based) | Very Fast | Low-Medium | High | Testing, structure only |

### Rule-Based with Faker

```python
from faker import Faker
import random
import pandas as pd

fake = Faker()
Faker.seed(42)

def generate_customer_data(n: int = 1000) -> pd.DataFrame:
    records = []
    for _ in range(n):
        records.append({
            "customer_id": fake.uuid4(),
            "name": fake.name(),
            "email": fake.email(),
            "city": fake.city(),
            "signup_date": fake.date_between(start_date="-3y", end_date="today"),
            "plan": random.choices(
                ["free", "basic", "pro", "enterprise"], weights=[0.5, 0.3, 0.15, 0.05],
            )[0],
            "monthly_spend": round(random.lognormvariate(3.5, 1.2), 2),
            "is_active": random.random() > 0.15,
        })
    return pd.DataFrame(records)
```

## LLM-Based Text Generation

```python
from openai import OpenAI
import json

class LLMDataGenerator:
    """Generate synthetic text data using LLMs."""

    def __init__(self, model: str = "gpt-4o-mini"):
        self.client = OpenAI()
        self.model = model

    def generate_batch(
        self, schema: dict, n_samples: int,
        context: str = "", examples: list[dict] = None, batch_size: int = 10,
    ) -> list[dict]:
        all_samples = []
        for i in range(0, n_samples, batch_size):
            current_batch = min(batch_size, n_samples - i)
            prompt = (
                f"Generate exactly {current_batch} synthetic data samples.\n\n"
                f"Schema:\n```json\n{json.dumps(schema, indent=2)}\n```\n\n"
            )
            if context:
                prompt += f"Context: {context}\n\n"
            if examples:
                prompt += f"Examples:\n{json.dumps(examples[:3], indent=2)}\n\n"
            prompt += "Return as JSON: {\"samples\": [...]}\n"

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Generate realistic, diverse data matching the schema."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=1.0,
            )
            batch = json.loads(response.choices[0].message.content)
            all_samples.extend(batch.get("samples", []))
        return all_samples[:n_samples]
```

## Text Augmentation

| Technique | Quality | Speed | Best For |
|-----------|---------|-------|----------|
| Synonym replacement | Medium | Fast | Simple vocabulary variation |
| Random deletion | Low-Medium | Fast | Robustness training |
| Back-translation | High | Slow | Natural paraphrasing |
| LLM paraphrase | Very High | Slow | High-quality augmentation |
| Entity swapping | Medium | Fast | Named entity variation |

```python
class TextAugmenter:
    def synonym_replace(self, text: str, n: int = 2) -> str:
        """Replace n random words with synonyms (uses WordNet)."""
        words = text.split()
        import random
        indices = random.sample(range(len(words)), min(n, len(words)))
        for idx in indices:
            syn = self._get_synonym(words[idx])
            if syn:
                words[idx] = syn
        return " ".join(words)

    def random_deletion(self, text: str, p: float = 0.1) -> str:
        """Randomly delete words with probability p."""
        import random
        words = text.split()
        remaining = [w for w in words if random.random() > p]
        return " ".join(remaining) if remaining else words[0]

    def llm_paraphrase(self, text: str, style: str = "neutral") -> str:
        """Use an LLM to paraphrase while preserving meaning."""
        client = OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": f"Paraphrase in {style} style:\n{text}"}],
            temperature=0.8,
        )
        return response.choices[0].message.content.strip()
```

## Image Augmentation

```python
import albumentations as A
from albumentations.pytorch import ToTensorV2

def get_training_augmentation(task: str = "classification") -> A.Compose:
    if task == "classification":
        return A.Compose([
            A.RandomResizedCrop(224, 224, scale=(0.8, 1.0)),
            A.HorizontalFlip(p=0.5),
            A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1, p=0.8),
            A.GaussianBlur(blur_limit=(3, 7), p=0.3),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2(),
        ])
    elif task == "detection":
        return A.Compose([
            A.RandomResizedCrop(640, 640, scale=(0.5, 1.0)),
            A.HorizontalFlip(p=0.5),
            A.RandomBrightnessContrast(p=0.5),
            A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ToTensorV2(),
        ], bbox_params=A.BboxParams(format="pascal_voc", min_visibility=0.3, label_fields=["labels"]))
```

## Privacy-Preserving Generation

### Differential Privacy

```python
import numpy as np

class DPMechanism:
    @staticmethod
    def laplace_mechanism(true_value: float, sensitivity: float, epsilon: float) -> float:
        """Add Laplace noise for epsilon-differential privacy."""
        return true_value + np.random.laplace(0, sensitivity / epsilon)

    @staticmethod
    def dp_histogram(data: np.ndarray, bins: int, epsilon: float) -> tuple:
        """Create differentially private histogram."""
        counts, edges = np.histogram(data, bins=bins)
        noisy = np.array([max(0, c + np.random.laplace(0, 2 / epsilon)) for c in counts])
        return noisy, edges
```

```
Epsilon guidelines:
  < 1.0  -> Strong privacy (significant noise)
  1-5    -> Moderate privacy (typical)
  5-10   -> Weak privacy (minimal noise)
  > 10   -> Negligible privacy
```

### K-Anonymity

```python
import pandas as pd

def check_k_anonymity(data: pd.DataFrame, quasi_ids: list[str], k: int = 5) -> dict:
    group_sizes = data.groupby(quasi_ids).size()
    min_group = group_sizes.min()
    violating = (group_sizes < k).sum()
    return {
        "satisfies": min_group >= k,
        "k_actual": int(min_group),
        "violating_groups": int(violating),
    }
```

## Validation Framework

```python
from scipy import stats
import pandas as pd
import numpy as np

class SyntheticDataValidator:
    def __init__(self, real: pd.DataFrame, synthetic: pd.DataFrame):
        self.real = real
        self.synthetic = synthetic

    def validate_distributions(self) -> dict:
        results = {}
        for col in self.real.columns:
            if col not in self.synthetic.columns:
                continue
            if self.real[col].dtype in ["float64", "int64"]:
                stat, p = stats.ks_2samp(self.real[col].dropna(), self.synthetic[col].dropna())
                results[col] = {"test": "ks", "stat": round(stat, 4), "p": round(p, 4), "ok": p > 0.05}
        return results

    def validate_correlations(self) -> dict:
        cols = [c for c in self.real.select_dtypes(include=[np.number]).columns if c in self.synthetic.columns]
        real_corr = self.real[cols].corr()
        synth_corr = self.synthetic[cols].corr()
        diff = np.linalg.norm(real_corr.values - synth_corr.values, "fro")
        norm_diff = diff / (np.linalg.norm(real_corr.values, "fro") * 2)
        return {"diff": round(diff, 4), "normalized": round(norm_diff, 4),
                "quality": "good" if norm_diff < 0.1 else "moderate" if norm_diff < 0.25 else "poor"}

    def validate_utility(self, target: str) -> dict:
        """Train-on-synthetic, test-on-real (TSTR) evaluation."""
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.metrics import f1_score
        feats = [c for c in self.real.select_dtypes(include=[np.number]).columns if c != target]
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(self.synthetic[feats].fillna(0), self.synthetic[target])
        pred = model.predict(self.real[feats].fillna(0))
        tstr = f1_score(self.real[target], pred, average="macro")
        return {"tstr_score": round(tstr, 4)}
```

## Cost and Performance

| Method | Speed | Setup Cost | Quality | Privacy |
|--------|-------|------------|---------|---------|
| Faker | 100K+ rows/sec | Low | Low | High |
| Gaussian Copula | 10K rows/sec | Low | Good | Medium |
| CTGAN | 100 rows/sec | Medium (GPU) | Very Good | Medium |
| LLM generation | 10-50 rows/min | Low (API cost) | Excellent | High |

## Checklist

- [ ] Define purpose: training augmentation, privacy, testing, or sharing
- [ ] Profile the real dataset (distributions, correlations, constraints)
- [ ] Select generation method matching quality and compute budget
- [ ] Implement pipeline with reproducible seeds
- [ ] Validate statistical fidelity (distribution and correlation tests)
- [ ] Run utility tests (train-on-synthetic, test-on-real)
- [ ] Verify privacy guarantees (k-anonymity, differential privacy)
- [ ] Check for data leakage (no real records copied verbatim)
- [ ] Document methodology, parameters, and validation results
- [ ] Establish monitoring if synthetic data is regenerated periodically

## Output Format

```markdown
# Synthetic Data Generator Analysis

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

**Input:** "Help me implement synthetic data generator for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended synthetic data generator approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When synthetic data generator must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
