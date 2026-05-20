---
name: fine-tuning-guide
description: |
  Model fine-tuning covering dataset preparation, LoRA and QLoRA, instruction tuning, RLHF and DPO, benchmarking, overfitting prevention, compute requirements, Hugging Face Trainer, and the fine-tuning vs prompt engineering decision.
  Use when the user asks about fine tuning guide, fine tuning guide best practices, or needs guidance on fine tuning guide implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml deep-learning guide"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Fine-Tuning Guide

## Overview

Fine-tuning adapts a pre-trained model to a specific task or domain by training on curated data. This skill covers when to fine-tune vs use prompt engineering, dataset preparation, parameter-efficient methods (LoRA/QLoRA), alignment techniques (RLHF/DPO), and practical training with Hugging Face tooling.

## Fine-Tuning vs Prompt Engineering Decision

### Decision Framework

```
Can prompt engineering achieve your quality target?
  YES -> Use prompt engineering (cheaper, faster iteration)
  NO  -> Continue

Do you have < 100 high-quality examples?
  YES -> Use few-shot prompting instead
  NO  -> Continue

Is your task highly specialized or domain-specific?
  YES -> Fine-tuning likely needed
  NO  -> Try prompt engineering harder first

Do you need consistent output format/style?
  YES -> Fine-tuning excels at this
  # ... (condensed) ...
  NO  -> Prompt engineering may suffice

Budget for training and hosting?
  LOW  -> Prompt engineering
  HIGH -> Fine-tuning is viable
```

### Comparison Table

| Factor | Prompt Engineering | Fine-Tuning |
|--------|-------------------|-------------|
| Setup time | Minutes | Hours to days |
| Data needed | 0-20 examples | 100-100K examples |
| Cost | Per-API-call | Training + hosting |
| Iteration speed | Instant | Hours per experiment |
| Task specificity | Moderate | High |
| Output consistency | Moderate | High |
| Knowledge injection | Limited by context | Learned into weights |
| Maintenance | Easy | Requires retraining |

## Dataset Preparation

### Instruction Tuning Format

```json
[
  {
    "instruction": "Summarize the following medical report in plain language for a patient.",
    "input": "MRI findings indicate a 2.3cm hyperintense lesion in the right frontal lobe...",
    "output": "Your brain scan showed a small spot (about 1 inch) in the right front part of your brain..."
  },
  {
    "instruction": "Extract all medication names and dosages from this clinical note.",
    "input": "Patient prescribed metformin 500mg BID and lisinopril 10mg daily...",
    "output": "{\"medications\": [{\"name\": \"metformin\", \"dose\": \"500mg\", \"frequency\": \"twice daily\"}, {\"name\": \"lisinopril\", \"dose\": \"10mg\", \"frequency\": \"once daily\"}]}"
  }
]
```

### Chat Format (Preferred for Modern Models)

```json
{
  "messages": [
    {"role": "system", "content": "You are a medical coding assistant."},
    {"role": "user", "content": "Assign ICD-10 codes to: Patient presents with acute bronchitis and type 2 diabetes."},
    {"role": "assistant", "content": "1. J20.9 - Acute bronchitis, unspecified\n2. E11.9 - Type 2 diabetes mellitus without complications"}
  ]
}
```

### Data Quality Pipeline

```python
import json
from dataclasses import dataclass

@dataclass
class QualityMetrics:
    total: int
    passed: int
    failed: int
    failure_reasons: dict

def validate_dataset(data: list[dict]) -> QualityMetrics:
    """Validate fine-tuning dataset quality."""
    failures = {}
    passed = 0
# ... (condensed) ...
        total=len(data),
        passed=passed,
        failed=len(data) - passed,
        failure_reasons=failures,
    )
```

### Data Augmentation Strategies

```python
def augment_instruction_data(
    samples: list[dict],
    client,
    augment_factor: int = 3,
) -> list[dict]:
    """Generate additional training examples from existing ones."""
    augmented = list(samples)

    for sample in samples:
        for _ in range(augment_factor):
            # Paraphrase the instruction
            new_instruction = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{
                    # ... (condensed) ...
                "input": sample["input"],
                "output": sample["output"],
            })

    return augmented
```

## LoRA (Low-Rank Adaptation)

### How LoRA Works

LoRA freezes the pre-trained model weights and injects trainable rank decomposition matrices into each transformer layer. Instead of updating W (d x d), it trains A (d x r) and B (r x d) where r << d.

```
Original: h = W * x
LoRA:     h = W * x + (B * A) * x

Where W is frozen, A and B are trainable
r (rank) is typically 8-64 (vs d = 4096+)
```

### LoRA with PEFT

```python
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM, AutoTokenizer

def setup_lora_model(
    base_model: str = "meta-llama/Llama-3.1-8B-Instruct",
    lora_r: int = 16,
    lora_alpha: int = 32,
    lora_dropout: float = 0.05,
    target_modules: list[str] = None,
):
    """Configure a model with LoRA adapters."""

    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        # ... (condensed) ...
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"Trainable: {trainable:,} / {total:,} ({trainable/total:.2%})")

    return model
```

### LoRA Hyperparameter Guide

| Parameter | Range | Effect |
|-----------|-------|--------|
| r (rank) | 4-128 | Higher = more capacity, more parameters |
| lora_alpha | r to 2*r | Scaling factor; alpha/r is the actual scale |
| dropout | 0.0-0.1 | Regularization; 0.05 is typical |
| target_modules | varies | Which layers to adapt (all linear layers recommended) |

**Rules of thumb**:
- Start with r=16, alpha=32
- For simple tasks (classification): r=8 may suffice
- For complex tasks (code, creative): r=32-64
- Always target all linear layers (not just attention)

## QLoRA (Quantized LoRA)

QLoRA combines 4-bit quantization of the base model with LoRA, enabling fine-tuning of large models on consumer GPUs.

```python
from transformers import BitsAndBytesConfig
import torch

def setup_qlora_model(
    base_model: str = "meta-llama/Llama-3.1-8B-Instruct",
    lora_r: int = 16,
):
    """Setup QLoRA: 4-bit base model + LoRA adapters."""

    # 4-bit quantization config
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",  # NormalFloat4
        bnb_4bit_compute_dtype=torch.bfloat16,
        # ... (condensed) ...
        task_type=TaskType.CAUSAL_LM,
    )

    model = get_peft_model(model, lora_config)
    return model
```

### GPU Memory Requirements

| Model Size | Full Fine-Tune | LoRA (fp16) | QLoRA (4-bit) |
|-----------|---------------|-------------|---------------|
| 7B | ~120 GB | ~20 GB | ~6 GB |
| 13B | ~240 GB | ~40 GB | ~12 GB |
| 70B | ~1.2 TB | ~160 GB | ~40 GB |

## Training with Hugging Face

### SFTTrainer (Supervised Fine-Tuning)

```python
from trl import SFTTrainer, SFTConfig
from transformers import AutoTokenizer
from datasets import load_dataset

def train_sft(
    model,
    tokenizer,
    train_dataset,
    output_dir: str = "./fine-tuned-model",
    num_epochs: int = 3,
    batch_size: int = 4,
    learning_rate: float = 2e-4,
):
    """Supervised fine-tuning with SFTTrainer."""
# ... (condensed) ...
    )

    trainer.train()
    trainer.save_model(output_dir)
    return trainer
```

### Complete Training Script

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig

def main():
    # Load base model and tokenizer
    model_name = "meta-llama/Llama-3.1-8B-Instruct"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype="auto",
        # ... (condensed) ...
    trainer.train()
    trainer.save_model("./final-model")

if __name__ == "__main__":
    main()
```

## RLHF and DPO

### DPO (Direct Preference Optimization)

DPO is simpler than full RLHF -- it directly optimizes from preference pairs without a separate reward model.

```python
from trl import DPOTrainer, DPOConfig

def train_dpo(
    model,
    tokenizer,
    preference_dataset,
    output_dir: str = "./dpo-model",
):
    """Train with DPO from preference pairs."""

    # Dataset format: each row has "chosen" and "rejected" responses
    # {
    #   "prompt": "Explain photosynthesis",
    #   "chosen": "Photosynthesis is the process by which plants...",
    # ... (condensed) ...
        args=training_args,
    )

    trainer.train()
    return trainer
```

### Creating Preference Data

```python
def create_preference_pairs(
    prompts: list[str],
    model,
    judge_client,
) -> list[dict]:
    """Generate preference pairs using an LLM judge."""
    pairs = []

    for prompt in prompts:
        # Generate two responses with different temperatures
        response_a = generate(model, prompt, temperature=0.3)
        response_b = generate(model, prompt, temperature=0.9)

        # Judge which is better
        # ... (condensed) ...
            pairs.append({"prompt": prompt, "chosen": response_a, "rejected": response_b})
        else:
            pairs.append({"prompt": prompt, "chosen": response_b, "rejected": response_a})

    return pairs
```

## Overfitting Prevention

### Strategies

1. **Early stopping**: Monitor validation loss, stop when it increases

```python
from transformers import EarlyStoppingCallback

trainer = SFTTrainer(
    ...,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=3)],
)
```

2. **Data diversity**: Ensure training data covers the full distribution
3. **Regularization**: LoRA dropout, weight decay
4. **Validation split**: Always hold out 10-20% for validation

```python
dataset = dataset.train_test_split(test_size=0.1, seed=42)
trainer = SFTTrainer(
    ...,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    args=SFTConfig(
        ...,
        eval_strategy="steps",
        eval_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
    ),
)
```

### Signs of Overfitting

| Signal | Indicator | Action |
|--------|-----------|--------|
| Train loss << val loss | Gap increasing | Reduce epochs, increase data |
| Val loss increasing | After initial decrease | Early stopping |
| Repetitive outputs | Model parrots training data | More diverse data |
| Poor generalization | Works only on training-like inputs | Augment data distribution |

## Benchmarking Fine-Tuned Models

### Automated Benchmarks

```python
def benchmark_model(model, tokenizer, test_set: list[dict]) -> dict:
    """Run benchmarks against held-out test set."""
    results = {
        "exact_match": 0,
        "format_compliance": 0,
        "total": len(test_set),
    }

    for sample in test_set:
        prompt = tokenizer.apply_chat_template(
            sample["messages"][:-1],  # All except assistant reply
            tokenize=False,
            add_generation_prompt=True,
        )
# ... (condensed) ...

    results["exact_match_rate"] = results["exact_match"] / results["total"]
    results["format_compliance_rate"] = results["format_compliance"] / results["total"]

    return results
```

### A/B Comparison: Base vs Fine-Tuned

```python
def compare_models(
    base_model,
    fine_tuned_model,
    tokenizer,
    test_prompts: list[str],
    judge_client,
) -> dict:
    """Compare base and fine-tuned model outputs using LLM judge."""
    wins = {"base": 0, "fine_tuned": 0, "tie": 0}

    for prompt in test_prompts:
        base_output = generate(base_model, tokenizer, prompt)
        ft_output = generate(fine_tuned_model, tokenizer, prompt)

        # ... (condensed) ...
            wins["fine_tuned"] += 1
        else:
            wins["tie"] += 1

    return wins
```

## OpenAI Fine-Tuning API

```python
from openai import OpenAI

client = OpenAI()

# Upload training file
file = client.files.create(
    file=open("training_data.jsonl", "rb"),
    purpose="fine-tune",
)

# Create fine-tuning job
job = client.fine_tuning.jobs.create(
    training_file=file.id,
    model="gpt-4o-mini-2024-07-18",
    # ... (condensed) ...
# Use fine-tuned model
response = client.chat.completions.create(
    model=status.fine_tuned_model,
    messages=[{"role": "user", "content": "Your prompt here"}],
)
```

## Checklist

- [ ] Determine if fine-tuning is necessary vs prompt engineering
- [ ] Prepare and validate dataset (minimum 100 high-quality examples)
- [ ] Choose base model appropriate for task and compute budget
- [ ] Select LoRA vs QLoRA based on available GPU memory
- [ ] Configure LoRA hyperparameters (r, alpha, target modules)
- [ ] Set up experiment tracking (W&B or MLflow)
- [ ] Implement validation split and early stopping
- [ ] Train with gradient checkpointing for memory efficiency
- [ ] Benchmark fine-tuned model against base model
- [ ] Check for overfitting (train vs validation loss gap)
- [ ] Consider DPO if you have preference data
- [ ] Save and version the LoRA adapter weights

## When to Use

**Use this skill when:**
- Designing or implementing fine tuning guide solutions
- Reviewing or improving existing fine tuning guide approaches
- Making architectural or implementation decisions about fine tuning guide
- Learning fine tuning guide patterns and best practices
- Troubleshooting fine tuning guide-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Fine Tuning Guide Analysis

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

**Input:** "Help me implement fine tuning guide for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended fine tuning guide approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When fine tuning guide must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
