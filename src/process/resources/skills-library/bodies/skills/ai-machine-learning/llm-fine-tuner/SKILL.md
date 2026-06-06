---
name: llm-fine-tuner
description: |
  Large language model fine-tuning expertise covering LoRA and QLoRA parameter-efficient methods, full fine-tuning strategies, dataset preparation and curation, instruction tuning, DPO alignment, evaluation frameworks, Hugging Face TRL and PEFT libraries, compute optimization, and deployment of fine-tuned models.
  Use when the user asks about llm fine tuner, llm fine tuner best practices, or needs guidance on llm fine tuner implementation.
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
  difficulty: "advanced"
---

# LLM Fine-Tuner

## Overview

Fine-tuning large language models adapts pre-trained foundation models to specific domains, tasks, or behaviors. This skill covers the full fine-tuning workflow: deciding when to fine-tune vs prompt engineer, curating high-quality datasets, choosing between full fine-tuning and parameter-efficient methods (LoRA, QLoRA), training with modern tooling, evaluating results rigorously, and deploying fine-tuned models to production.

## When to Fine-Tune vs Prompt Engineer

```
Decision Matrix:

Factor                     Prompt Engineering    Fine-Tuning
------------------------------------------------------------
Latency sensitivity        Low (long prompts OK) High (need short prompts)
Training data available    < 100 examples         100 - 100K+ examples
Task specificity           General tasks          Domain-specific behavior
Output format control      Moderate               High (consistent format)
Cost per inference         Higher (long context)  Lower (learned behavior)
Iteration speed            Minutes                Hours to days
Knowledge freshness        Retrieval/RAG based    Baked into weights
Behavior modification      Limited                Deep behavior change
Compute budget             Zero training cost     GPU hours required

Decision: Fine-tune when you need consistent specialized behavior
that cannot be achieved through prompting alone, AND you have
sufficient quality training data.
```

## Dataset Preparation

### Instruction Tuning Dataset Format

```python
# Standard instruction format (Alpaca-style)
instruction_dataset = [
    {
        "instruction": "Classify the sentiment of this customer review.",
        "input": "The product arrived damaged and customer service was unhelpful.",
        "output": "Negative. The review expresses dissatisfaction with both product quality (arrived damaged) and customer service (unhelpful)."
    },
    {
        "instruction": "Extract all medication names from this clinical note.",
        "input": "Patient is currently taking metformin 500mg BID, lisinopril 10mg daily, and was prescribed amoxicillin 500mg TID for 7 days.",
        "output": "1. Metformin 500mg (twice daily)\n2. Lisinopril 10mg (once daily)\n3. Amoxicillin 500mg (three times daily, 7-day course)"
    }
]

# ChatML / conversation format
chat_dataset = [
    {
        "messages": [
            {"role": "system", "content": "You are a medical coding assistant."},
            {"role": "user", "content": "Code this diagnosis: Type 2 diabetes with peripheral neuropathy"},
            {"role": "assistant", "content": "ICD-10: E11.40 - Type 2 diabetes mellitus with diabetic neuropathy, unspecified"}
        ]
    }
]
```

### Data Quality Pipeline

```python
import hashlib
from datasets import Dataset

class DatasetCurator:
    """Curate high-quality fine-tuning datasets."""

    def curate(self, raw_data: list[dict]) -> Dataset:
        data = raw_data
        initial_count = len(data)

        # Step 1: Deduplicate
        data = self._deduplicate(data)
        print(f"After dedup: {len(data)} (removed {initial_count - len(data)})")

        # Step 2: Filter by quality
        data = [d for d in data if self._quality_check(d)]
        print(f"After quality filter: {len(data)}")

        # Step 3: Filter by length
        data = [d for d in data if self._length_check(d)]
        print(f"After length filter: {len(data)}")

        # Step 4: Balance distribution
        data = self._balance_distribution(data)
        print(f"After balancing: {len(data)}")

        return Dataset.from_list(data)

    def _deduplicate(self, data):
        seen = set()
        unique = []
        for item in data:
            content_hash = hashlib.md5(
                (item.get('instruction', '') + item.get('input', '')).encode()
            ).hexdigest()
            if content_hash not in seen:
                seen.add(content_hash)
                unique.append(item)
        return unique

    def _quality_check(self, item):
        """Filter low-quality examples."""
        output = item.get('output', '')
        # Reject empty or very short outputs
        if len(output.strip()) < 10:
            return False
        # Reject outputs that are just the input repeated
        if output.strip() == item.get('input', '').strip():
            return False
        # Reject outputs with obvious errors
        if 'as an ai language model' in output.lower():
            return False
        return True

    def _length_check(self, item, max_tokens=2048):
        """Ensure examples fit within context window."""
        total_text = item.get('instruction', '') + item.get('input', '') + item.get('output', '')
        # Rough token estimate: 1 token per 4 characters
        estimated_tokens = len(total_text) / 4
        return estimated_tokens <= max_tokens

    def _balance_distribution(self, data):
        """Balance task type distribution to prevent overfitting."""
        from collections import Counter
        if 'task_type' not in data[0]:
            return data

        type_counts = Counter(d['task_type'] for d in data)
        median_count = sorted(type_counts.values())[len(type_counts) // 2]
        max_per_type = median_count * 3  # Cap at 3x median

        balanced = []
        type_tracker = Counter()
        for d in data:
            if type_tracker[d['task_type']] < max_per_type:
                balanced.append(d)
                type_tracker[d['task_type']] += 1
        return balanced
```

## LoRA (Low-Rank Adaptation)

### LoRA Configuration and Training

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer

# Load base model
model_name = "meta-llama/Llama-3.1-8B"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.bfloat16,
    device_map="auto",
    attn_implementation="flash_attention_2",
)
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token

# LoRA configuration
lora_config = LoraConfig(
    r=16,                          # Rank (4-64, higher = more capacity)
    lora_alpha=32,                 # Scaling factor (typically 2x rank)
    target_modules=[               # Which layers to adapt
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
    modules_to_save=["embed_tokens", "lm_head"],  # Optional: train embeddings
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# trainable params: 20M || all params: 8B || trainable%: 0.25%
```

### LoRA Hyperparameter Guide

```
Parameter       Recommended Range    Notes
--------------------------------------------------------------
r (rank)        8-64                 Start with 16. Higher for complex tasks.
                                     8 for simple classification.
                                     32-64 for code/math.

lora_alpha      2x rank              Controls learning rate scaling.
                                     alpha/r = effective multiplier.

target_modules  All attention +      Start with attention only, add MLP
                MLP projections      if undertrained. More modules = more
                                     capacity but slower training.

lora_dropout    0.0-0.1              0.05 is safe default. Increase if
                                     overfitting (val loss diverges).

learning_rate   1e-4 to 5e-4         Higher than full fine-tuning.
                                     2e-4 is common starting point.

batch_size      4-32                 Larger batches stabilize training.
                                     Use gradient accumulation if GPU
                                     memory limited.

epochs          1-5                  Start with 3. Watch for overfitting
                                     after epoch 2-3 on small datasets.
```

## QLoRA (Quantized LoRA)

### QLoRA Training Setup

```python
from transformers import BitsAndBytesConfig

# 4-bit quantization config
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # NormalFloat4 quantization
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,      # Nested quantization
)

# Load quantized model
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.1-70B",
    quantization_config=bnb_config,
    device_map="auto",
    attn_implementation="flash_attention_2",
)

# Apply LoRA on quantized model
model = get_peft_model(model, lora_config)

# Memory comparison:
# Full fine-tuning 70B: ~280GB VRAM (impossible on consumer GPUs)
# LoRA 70B (bf16):      ~140GB VRAM (multi-GPU needed)
# QLoRA 70B (4-bit):    ~40GB VRAM  (fits on 2x A100 or 1x A100-80GB)
```

## Training with TRL (Transformer Reinforcement Learning)

### Supervised Fine-Tuning

```python
from trl import SFTTrainer, SFTConfig

training_args = SFTConfig(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    gradient_accumulation_steps=4,       # Effective batch size: 4 * 4 = 16
    learning_rate=2e-4,
    lr_scheduler_type="cosine",
    warmup_ratio=0.1,
    weight_decay=0.01,
    max_grad_norm=1.0,

    # Precision
    bf16=True,

    # Logging
    logging_steps=10,
    eval_strategy="steps",
    eval_steps=100,
    save_strategy="steps",
    save_steps=100,
    save_total_limit=3,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",

    # SFT specific
    max_seq_length=2048,
    packing=True,                         # Pack short examples together
    dataset_text_field="text",

    # Memory optimization
    gradient_checkpointing=True,
    optim="adamw_torch_fused",
)

trainer = SFTTrainer(
    model=model,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=tokenizer,
    args=training_args,
)

trainer.train()
trainer.save_model("./fine-tuned-model")
```

### DPO (Direct Preference Optimization)

```python
from trl import DPOTrainer, DPOConfig

# DPO dataset format: chosen vs rejected completions
dpo_dataset = [
    {
        "prompt": "Explain quantum entanglement simply.",
        "chosen": "Quantum entanglement is like having two coins that always land on opposite sides, no matter how far apart they are. When you flip one and get heads, the other instantly becomes tails. In quantum physics, particles can become 'entangled' so measuring one instantly determines the state of the other.",
        "rejected": "Quantum entanglement is a quantum mechanical phenomenon in which the quantum states of two or more objects have to be described with reference to each other, even though the individual objects may be spatially separated. This leads to correlations between observable physical properties of the systems."
    }
]

dpo_config = DPOConfig(
    output_dir="./dpo-results",
    num_train_epochs=1,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    learning_rate=5e-5,              # Lower LR for DPO
    beta=0.1,                         # KL penalty coefficient
    max_length=1024,
    max_prompt_length=512,
    bf16=True,
    gradient_checkpointing=True,
    logging_steps=10,
)

dpo_trainer = DPOTrainer(
    model=model,
    ref_model=None,                   # Uses implicit reference with LoRA
    train_dataset=dpo_dataset,
    tokenizer=tokenizer,
    args=dpo_config,
)

dpo_trainer.train()
```

## Evaluation

### Comprehensive Evaluation Framework

```python
class FineTuneEvaluator:
    """Evaluate fine-tuned model quality."""

    def evaluate(self, model, tokenizer, eval_dataset) -> dict:
        results = {}

        # 1. Perplexity (lower is better)
        results['perplexity'] = self._compute_perplexity(model, tokenizer, eval_dataset)

        # 2. Task-specific accuracy
        results['task_accuracy'] = self._evaluate_task(model, tokenizer, eval_dataset)

        # 3. Regression check against base model
        results['regression'] = self._check_regression(model, tokenizer)

        # 4. Generation quality (human-evaluate proxy)
        results['generation_quality'] = self._evaluate_generation(model, tokenizer, eval_dataset)

        return results

    def _evaluate_task(self, model, tokenizer, dataset):
        """Evaluate on held-out examples with exact/fuzzy match."""
        correct = 0
        total = 0
        for example in dataset:
            prompt = format_prompt(example)
            generated = generate(model, tokenizer, prompt, max_new_tokens=256)
            expected = example['output']

            # Exact match
            if generated.strip() == expected.strip():
                correct += 1
            # Fuzzy match (for free-form text)
            elif self._fuzzy_match(generated, expected) > 0.8:
                correct += 0.5
            total += 1

        return correct / total if total > 0 else 0

    def _check_regression(self, model, tokenizer):
        """Ensure fine-tuning did not degrade general capabilities."""
        regression_prompts = [
            "What is 2 + 2?",
            "Translate 'hello' to French.",
            "Write a haiku about the moon.",
        ]
        # Compare outputs to expected baselines
        regressions = []
        for prompt in regression_prompts:
            output = generate(model, tokenizer, prompt)
            if not self._basic_sanity_check(prompt, output):
                regressions.append(prompt)
        return {"regressions_found": len(regressions), "details": regressions}
```

## Deployment

### Merging LoRA Weights for Deployment

```python
from peft import PeftModel

# Load base model and LoRA adapter
base_model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.1-8B",
    torch_dtype=torch.bfloat16,
)
model = PeftModel.from_pretrained(base_model, "./fine-tuned-lora-adapter")

# Merge LoRA weights into base model
merged_model = model.merge_and_unload()

# Save merged model
merged_model.save_pretrained("./merged-model")
tokenizer.save_pretrained("./merged-model")

# Convert to GGUF for llama.cpp / Ollama deployment
# python convert_hf_to_gguf.py ./merged-model --outtype q4_k_m
```

### vLLM Deployment

```python
from vllm import LLM, SamplingParams

# Deploy merged fine-tuned model
llm = LLM(
    model="./merged-model",
    dtype="auto",
    tensor_parallel_size=1,        # Increase for multi-GPU
    max_model_len=4096,
    gpu_memory_utilization=0.9,
)

sampling_params = SamplingParams(
    temperature=0.1,               # Low for consistent domain tasks
    top_p=0.95,
    max_tokens=512,
    stop=["<|eot_id|>"],
)

outputs = llm.generate(["Your prompt here"], sampling_params)
```

## Fine-Tuning Checklist

```
Planning:
  [ ] Confirmed fine-tuning is needed (not achievable via prompting)
  [ ] Defined success criteria and evaluation metrics
  [ ] Selected base model appropriate for task and budget
  [ ] Estimated compute requirements and costs

Data Preparation:
  [ ] Collected 500+ high-quality examples (1000+ preferred)
  [ ] Deduplicated and quality-filtered dataset
  [ ] Split into train/evaluate/test (80/10/10)
  [ ] Balanced task distribution
  [ ] Verified formatting matches model's expected template

Training:
  [ ] Selected method (LoRA for most cases, QLoRA for large models)
  [ ] Configured hyperparameters (start with recommended defaults)
  [ ] Enabled gradient checkpointing for memory efficiency
  [ ] Set up evaluation during training (evaluate every N steps)
  [ ] Monitored training loss curve for overfitting

Evaluation:
  [ ] Evaluated on held-out test set
  [ ] Compared against base model baseline
  [ ] Checked for capability regression
  [ ] Tested edge cases and adversarial inputs
  [ ] Had domain expert review sample outputs

Deployment:
  [ ] Merged LoRA weights (or deployed adapter separately)
  [ ] Quantized for production (GPTQ, AWQ, or GGUF)
  [ ] Set up serving infrastructure (vLLM, TGI, or Ollama)
  [ ] Configured monitoring for output quality drift
  [ ] Documented model card with training details
```

## When to Use

**Use this skill when:**
- Designing or implementing llm fine tuner solutions
- Reviewing or improving existing llm fine tuner approaches
- Making architectural or implementation decisions about llm fine tuner
- Learning llm fine tuner patterns and best practices
- Troubleshooting llm fine tuner-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Llm Fine Tuner Analysis

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

**Input:** "Help me implement llm fine tuner for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended llm fine tuner approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When llm fine tuner must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
