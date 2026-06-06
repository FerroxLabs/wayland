---
name: fine-tuning-strategy
description: |
  Guides expert-level fine-tuning strategy implementation: ai-ml and optimization decision frameworks, production-ready patterns, and concrete templates for fine tuning strategy workflows.
  Use when the user asks about fine-tuning strategy, fine tuning strategy configuration, or ai-ml best practices for fine-tuning projects.
  Do NOT use when the user needs a different ai ml engineering capability -- check sibling skills in the ai ml engineering subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml optimization architecture"
  category: "ai-machine-learning"
  subcategory: "ai-ml-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Fine Tuning Strategy

## When to Use

**Use this skill when:**
- The user has a pre-trained foundation model (LLM, vision model, or multimodal model) and needs to adapt it to a domain-specific task, writing style, or instruction format that prompting alone cannot achieve reliably
- The user is experiencing persistent quality failures from prompt engineering -- for example, the base model produces structurally inconsistent outputs, ignores domain terminology, or fails to follow response formats even with detailed few-shot examples
- The user needs to bake task-specific behavior into model weights for latency or cost reasons -- such as eliminating the need for long system prompts or expensive few-shot examples at inference time
- The user wants to train a smaller, cheaper model to match the quality of a larger model on a narrow task (distillation-style fine-tuning)
- The user is building a production system where a specific output schema must be followed with >99% reliability (function calling, JSON extraction, classification with fixed label sets)
- The user needs to instill proprietary knowledge, brand voice, or domain-specific reasoning patterns that are not representable in the base model's training distribution
- The user is evaluating whether fine-tuning is cost-justified against alternatives like retrieval-augmented generation (RAG), prompt caching, or model distillation

**Do NOT use this skill when:**
- The user's problem is a retrieval or knowledge freshness problem -- use a RAG pipeline design skill instead, since fine-tuning does not reliably inject factual knowledge and will hallucinate on dynamic data
- The user wants to evaluate a model's quality or benchmark performance -- use a model evaluation skill that covers evaluation harnesses, benchmark datasets, and human evaluation protocols
- The user needs to deploy or serve a fine-tuned model in production infrastructure -- use a model serving and deployment skill covering VLLM, TGI, or API gateway patterns
- The user is asking about prompt engineering optimization -- use the prompt engineering skill; fine-tuning is expensive and prompt engineering should always be exhausted first
- The user needs to train a model from scratch -- this is a pre-training skill, not fine-tuning; the compute budgets, data requirements, and architecture choices are fundamentally different
- The user is asking about embedding model fine-tuning for search or retrieval -- that is a separate domain with different loss functions (contrastive loss, triplet loss) and evaluation protocols
- The user needs RLHF (Reinforcement Learning from Human Feedback) at scale with a reward model training pipeline -- that is a separate skill with its own dataset design and PPO/DPO trade-off considerations that go beyond supervised fine-tuning

---

## Process

### Step 1: Determine Whether Fine-Tuning Is the Right Tool

Before touching any training infrastructure, validate that fine-tuning is actually justified.

- **Run a prompt engineering ceiling test first.** Spend 4--8 hours building the best possible prompt for the task using chain-of-thought, few-shot examples, and explicit formatting constraints. If the base model achieves >90% of the target quality on a 50-example holdout set, do not fine-tune -- the marginal gain will not justify the cost or maintenance burden.
- **Quantify the failure mode.** Classify every failure in your baseline prompt evaluation into: (a) format/structure failures, (b) domain knowledge gaps, (c) reasoning failures, or (d) style/tone mismatches. Fine-tuning addresses types (a) and (d) reliably, partially addresses (c), and does NOT address (b) -- knowledge gaps require RAG or a larger model.
- **Estimate total cost of fine-tuning vs. alternatives.** A GPT-4o fine-tune on 10k examples at $25/1M tokens costs roughly $50--$200 for training, but requires dataset curation labor (typically 40--120 hours at $20--$100/hr). Compare against the monthly cost of longer prompts with the base model at your expected request volume.
- **Check if a smaller base model with fine-tuning beats the large base model without.** A 7B or 13B fine-tuned model often matches GPT-4-class performance on narrow tasks, with 10--50x lower inference cost. This is the most common ROI-positive use case.
- **Establish a minimum data threshold check.** You need at least 50--100 high-quality examples to see meaningful improvement for a focused task, 500--2000 for robust generalization, and 5000+ for complex multi-step reasoning adaptation. If you cannot hit 100 examples, invest in data collection before starting.

### Step 2: Select the Fine-Tuning Method

The choice of fine-tuning method determines compute cost, catastrophic forgetting risk, and deployment complexity.

- **Full fine-tuning (FFT):** Updates all model parameters. Use only when you have >10k high-quality examples, a task requiring deep structural change, and dedicated GPU infrastructure. FFT on a 7B model requires 4x A100 80GB GPUs with DeepSpeed ZeRO-3 or FSDP. Risk of catastrophic forgetting is highest; mitigate with learning rate warmup and a small fraction of general-purpose data mixed in (5--10% of total).
- **LoRA (Low-Rank Adaptation):** Freezes base model weights and injects trainable low-rank matrices into attention layers. Rank (r) values of 8--64 are typical; start at r=16 with alpha=32 (alpha/r ratio of 2 is a safe default). LoRA reduces trainable parameters by 90--99% and fits on a single A100 or even a 4090 for 7B models. This is the default choice for 80% of fine-tuning projects.
- **QLoRA:** Quantizes the base model to 4-bit NF4 precision and applies LoRA on top. Enables fine-tuning a 13B model on a single A100 40GB or a 7B model on a 24GB consumer GPU. Expect a 1--3% quality regression vs. LoRA due to quantization noise. Use when GPU memory is the binding constraint.
- **DoRA (Weight-Decomposed LoRA):** Decomposes weights into magnitude and direction components, updating both. Consistently outperforms LoRA by 1--5% on benchmarks with the same parameter budget. Available in PEFT library as `use_dora=True`. Use when squeezing maximum quality from constrained compute.
- **Prefix tuning / Prompt tuning:** Adds trainable tokens to the input. Effective for very small datasets (<200 examples) and when base model weights cannot be modified (e.g., locked API models). Rarely used in 2024+ because LoRA dominates.
- **Target layer selection for LoRA:** Always include `q_proj`, `v_proj` as minimum. Adding `k_proj`, `o_proj`, `gate_proj`, `up_proj`, `down_proj` (all linear layers) improves quality but increases memory. Start with attention-only LoRA and add MLP layers if quality is insufficient after first training run.

### Step 3: Design and Curate the Training Dataset

Dataset quality is the single most important variable in fine-tuning success -- more important than architecture choices, hyperparameters, or model size.

- **Define the input-output format precisely before collecting data.** Every training example must match the exact prompt template and output format you will use at inference time. Inconsistency between training and inference format is the most common cause of fine-tuning failure.
- **Choose a data collection strategy based on availability:**
  - *Human-labeled from scratch:* Highest quality, most expensive. Use annotation platforms with structured guidelines. Budget for 2--3 annotator passes with inter-annotator agreement measurement (Cohen's kappa >0.7 is acceptable).
  - *Self-instruct / GPT-4 distillation:* Generate training examples using GPT-4o or Claude 3.5 Sonnet as a teacher model. Cost-effective for instruction-following tasks. Legal note: check the terms of service of the teacher model API -- some prohibit using outputs to train competing models.
  - *Curated from existing logs:* Mine production logs for input-output pairs. Filter aggressively -- use an LLM judge to score quality and keep only the top 20--40% of examples.
  - *Synthetic augmentation:* Use paraphrasing and backtranslation to expand limited datasets. Effective for format diversity, not for knowledge expansion.
- **Apply deduplication before training.** Use MinHash LSH or exact SHA-256 deduplication. Duplicate examples inflate apparent dataset size and cause overfitting on those specific patterns. A dataset with 30% duplicates behaves like a dataset 1/3 the stated size.
- **Balance the label distribution.** For classification fine-tuning, ensure label balance within ±20%. For generation tasks, ensure diversity in input length, topic, and complexity. An unbalanced dataset produces a model biased toward the majority class.
- **Format every example as a conversation or instruction-response pair** using the target model's chat template. For Llama-3-style models, use the BOS/EOS and role tags exactly as specified. For Mistral models, use `[INST]`/`[/INST]` formatting. Mismatched formatting is undetectable during training but produces garbage at inference.
- **Set aside evaluation splits before any data processing.** Use 80/10/10 (train/validation/test) or 90/5/5 for small datasets. The test split is held out entirely until final evaluation -- never use it to guide hyperparameter choices.
- **Run a data quality audit on 50--100 random examples manually** before starting training. Look for: formatting inconsistencies, factual errors, leaked PII, ambiguous or contradictory label decisions. Fix systemically, not one-by-one.

### Step 4: Configure the Training Hyperparameters

Hyperparameter choices interact strongly with dataset size and model scale. Use these calibrated defaults as starting points.

- **Learning rate:** Start at 2e-4 for LoRA, 1e-5 for full fine-tuning. Use a cosine schedule with linear warmup over the first 3--5% of total training steps. Learning rates above 5e-4 typically destabilize training; rates below 5e-5 show minimal learning within a reasonable number of epochs.
- **Batch size and gradient accumulation:** Target an effective batch size of 32--128. If GPU memory limits per-device batch size to 2, use gradient accumulation steps of 16 to reach an effective batch size of 32. Larger effective batch sizes require proportionally higher learning rates (linear scaling rule: double batch size → double learning rate, to a point).
- **Epochs:** For datasets of 500--5000 examples, train for 2--4 epochs. For >10k examples, 1--2 epochs is usually sufficient. Evaluate on the validation set every 0.25--0.5 epochs and stop when validation loss stops improving (patience of 2--3 evaluation steps).
- **LoRA rank and alpha:** r=16, alpha=32 is the safest default. Increase rank to 32 or 64 if the task is structurally complex or requires learning new reasoning patterns. A higher rank increases trainable parameters linearly and memory usage. Never set alpha < rank -- it suppresses learning signal.
- **Dropout:** Set LoRA dropout to 0.05--0.1 for datasets under 1000 examples, 0.0 for larger datasets where regularization is less critical. Full fine-tuning benefits from weight decay of 0.01--0.1.
- **Gradient clipping:** Set max_grad_norm to 1.0 universally. Training instability (loss spikes or NaN gradients) usually means the learning rate is too high or the batch size is too small.
- **Packing / sequence packing:** For instruction-tuning datasets with short examples, pack multiple examples into a single training sequence up to the model's max context length. This dramatically improves GPU utilization (2--4x throughput improvement). Ensure attention masks are set correctly to prevent cross-contamination between packed examples.

### Step 5: Execute Training with Proper Observability

Running training without systematic monitoring produces uninterpretable results and wasted compute.

- **Log training loss, validation loss, and learning rate** at every evaluation step to a tracking system (Weights & Biases, MLflow, or TensorBoard). Inspect the training curve after the first 10% of training. A flat training loss indicates a learning rate problem or data formatting error. A rapidly diverging loss indicates too high a learning rate or corrupted data.
- **Track token-level metrics, not just loss.** For generation tasks, track perplexity on the validation set. Perplexity below 5.0 on task-specific data indicates strong adaptation; above 15.0 suggests the model is not learning the task distribution.
- **Implement checkpoint saving every 500--1000 steps** and keep the top-3 checkpoints by validation loss. Do not only save the final checkpoint -- the final epoch is frequently overfit.
- **Monitor gradient norms per layer.** In LoRA training, the adapter gradients should be 10--100x larger than the frozen base layer gradients. If the ratio is <2x, the LoRA rank may be too low or learning rate too small.
- **Run a generation quality check mid-training** at 25%, 50%, and 75% of training. Run 10--20 representative examples through the current checkpoint and inspect outputs. This catches catastrophic failure modes (repetition loops, instruction following collapse) before wasting full compute budget.
- **Track GPU utilization and memory.** Utilization above 90% indicates good efficiency. Utilization below 70% suggests batch size is too small or data loading is the bottleneck (add `dataloader_num_workers=4` and `pin_memory=True`).

### Step 6: Evaluate the Fine-Tuned Model

Evaluation is where most fine-tuning projects fail -- they measure the wrong things or measure too little.

- **Evaluate on the held-out test set exclusively.** Run the final evaluation only once per model candidate. If you run it multiple times and pick the best result, you are overfitting to the test set.
- **Define task-specific metrics before training, not after:**
  - Classification: Accuracy, F1 per class, confusion matrix
  - Extraction / structured output: Exact match rate, field-level F1, schema validity rate
  - Generation: ROUGE-L, BERTScore, task-specific rubric with LLM judge
  - Instruction following: Pass rate on a constrained test suite (e.g., format compliance %, length compliance %)
- **Always compare against the base model and the prompt-engineered baseline** on the same test set. This is your minimum bar -- a fine-tuned model that underperforms the baseline prompt-engineered large model is not a successful fine-tune.
- **Use an LLM judge for generation quality** with a structured rubric (e.g., GPT-4o judging on a 1--5 scale for accuracy, relevance, format compliance). Measure judge agreement with human raters on 50 examples before trusting automated scores.
- **Test for catastrophic forgetting.** Run the fine-tuned model on 50--100 general capability benchmarks (MMLU subset, basic math, instruction following) to confirm the model has not degraded significantly on general tasks. A >5% regression on general benchmarks is a red flag.
- **Perform adversarial testing.** Craft 20--30 inputs designed to trigger failure modes: out-of-distribution inputs, edge cases at length limits, inputs with conflicting instructions. Document failure modes systematically.

### Step 7: Iterate, Merge, and Deploy

Fine-tuning is not a one-shot process -- structure your iteration cycle to converge efficiently.

- **Diagnose failure patterns from evaluation before retraining.** Categorize failures: if >60% are format failures, add more format-demonstrating examples. If failures cluster on specific input types, add targeted examples for those types. Do not simply add more data uniformly.
- **For LoRA models, merge the adapter into the base model before production deployment** using `merge_and_unload()` from PEFT. This eliminates inference-time adapter overhead and simplifies the serving stack. The merged model is identical in architecture to the base model and can be served with any standard inference engine.
- **Version every fine-tuned model** with a semantic naming convention: `{base_model}-{task}-{dataset_version}-{training_run}`. Example: `llama3-8b-invoice-extraction-v2-run3`. Track which training data version produced each model.
- **A/B test in production with a shadow deployment** before full rollout. Send 5--10% of traffic to the fine-tuned model, compare quality metrics against the current model, and watch for edge case failures in real-world inputs.
- **Plan for continued fine-tuning.** Production data distribution shifts over time. Schedule re-evaluation of model quality every 30--90 days. Set up pipelines to capture production inputs/outputs for future fine-tuning rounds.

---

## Output Format

### Fine-Tuning Strategy Decision Report

```
╔═══════════════════════════════════════════════════════════╗
║           FINE-TUNING STRATEGY ASSESSMENT                 ║
╚═══════════════════════════════════════════════════════════╝

PROJECT: [Name/Description]
DATE: [Date]
ANALYST: [AI Assistant]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: FINE-TUNING JUSTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task Type:              [classification | extraction | generation | instruction-following]
Baseline Method Tried:  [prompt-engineering | RAG | few-shot | none]
Baseline Quality Score: [X%] on [metric] with [N] examples
Target Quality Score:   [X%]
Gap:                    [X%] -- [justifies / does not justify] fine-tuning

Primary Failure Mode:   [format | knowledge | reasoning | style]
Fine-Tuning Addressable: [YES / NO / PARTIALLY]

Decision: [PROCEED WITH FINE-TUNING / USE ALTERNATIVE APPROACH]
Rationale: [2--3 sentences]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: METHOD SELECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Base Model:             [model name and parameter count]
Fine-Tuning Method:     [LoRA | QLoRA | DoRA | Full Fine-Tune]
Justification:          [compute constraint | data size | quality requirement]

LoRA Configuration (if applicable):
  rank (r):             [8 | 16 | 32 | 64]
  alpha:                [16 | 32 | 64 | 128]
  dropout:              [0.0 | 0.05 | 0.1]
  target_modules:       [q_proj, v_proj | all linear layers]

Hardware Requirement:   [GPU type and count]
Estimated Training Time:[X hours]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: DATASET PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Collection Strategy:    [human-labeled | GPT-4 distillation | log mining | synthetic]
Target Dataset Size:    [N examples total]
  Train split:          [N examples]
  Validation split:     [N examples]
  Test split:           [N examples]

Input Format:           [describe the prompt template]
Output Format:          [describe the expected completion format]
Quality Filter Method:  [LLM judge | human review | rule-based filter]
Deduplication Method:   [MinHash | SHA-256 | none]

Known Data Risks:       [imbalance | noise | PII | terms of service]
Mitigation:             [specific mitigation steps]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: TRAINING CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Hyperparameter          | Value          | Rationale                        |
|-------------------------|----------------|----------------------------------|
| Learning rate           | [value]        | [rationale]                      |
| LR schedule             | cosine + warmup| Standard for fine-tuning         |
| Warmup steps            | [N steps]      | [X%] of total steps              |
| Per-device batch size   | [N]            | GPU memory constraint            |
| Gradient accum. steps   | [N]            | Effective batch size = [N]       |
| Epochs                  | [N]            | Dataset size [N], expected [N]   |
| Max sequence length     | [N tokens]     | [Percentile] of examples         |
| Gradient clipping       | 1.0            | Universal stability practice     |
| Weight decay            | [0.01 | 0.1]  | [Regularization strength]        |
| Mixed precision         | bf16 / fp16    | Hardware dependent               |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: EVALUATION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary Metric:         [metric name + measurement method]
Secondary Metrics:      [list 2--3 with measurement method]
Catastrophic Forgetting Test: [benchmark subset + regression threshold]
Comparison Baselines:
  - Base model + best prompt: [current score]
  - Target fine-tuned model:  [target score]

LLM Judge:              [GPT-4o | Claude 3.5 | manual rubric]
Human Evaluation:       [YES / NO] -- [N] examples if YES

Pass Criteria:          [specific threshold for go/no-go decision]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6: COST ESTIMATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dataset Curation:       ~[N] hours @ [$X/hr] = $[total]
Training Compute:       ~[N] GPU-hours @ [$X/hr] = $[total]
Evaluation:             ~[N] hours = $[total]
Total One-Time Cost:    ~$[total]

Inference Cost (baseline): $[X] per 1000 requests (large model + long prompt)
Inference Cost (fine-tuned): $[X] per 1000 requests (small model + short prompt)
Monthly Savings at [N] req/month: $[X]
Payback Period:         [N months]
```

---

### Training Launch Script (annotated)

```python
# fine_tune_lora.py
# LoRA fine-tuning script using HuggingFace PEFT + TRL SFTTrainer
# Tested with: transformers>=4.40, peft>=0.10, trl>=0.8, bitsandbytes>=0.43

import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, TaskType
from trl import SFTTrainer, DataCollatorForCompletionOnlyLM

# ── Model and task configuration ──────────────────────────────────────────────
BASE_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"
OUTPUT_DIR = "./llama3-8b-invoice-extraction-v1"
TASK_NAME  = "invoice-extraction"

# ── LoRA configuration ────────────────────────────────────────────────────────
# r=16, alpha=32: safe default for focused extraction tasks
# Targeting all linear layers for extraction tasks (more expressive than attn-only)
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    use_dora=True,  # DoRA: slight quality boost over standard LoRA at same cost
)

# ── 4-bit quantization for QLoRA (remove if using full 16-bit LoRA) ───────────
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",           # NF4 is better than fp4 for LLMs
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,      # Nested quantization saves ~0.4 GB
)

# ── Load model and tokenizer ──────────────────────────────────────────────────
model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    quantization_config=bnb_config,
    device_map="auto",
    attn_implementation="flash_attention_2",  # Requires flash-attn>=2.0
    torch_dtype=torch.bfloat16,
)
model.config.use_cache = False           # Disable KV cache during training
model.config.pretraining_tp = 1         # Disable tensor parallelism during training

tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
tokenizer.pad_token = tokenizer.eos_token   # Llama-3 has no pad token by default
tokenizer.padding_side = "right"            # Right-padding for causal LM training

# ── Dataset loading and formatting ────────────────────────────────────────────
# Training examples MUST use the same chat template as inference
def format_example(example):
    """Apply Llama-3 chat template. System prompt is baked into training examples."""
    messages = [
        {
            "role": "system",
            "content": "Extract structured invoice data as JSON. "
                       "Return only valid JSON with no explanation.",
        },
        {"role": "user", "content": example["invoice_text"]},
        {"role": "assistant", "content": example["extracted_json"]},
    ]
    return {"text": tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=False
    )}

dataset = load_dataset("json", data_files={
    "train": "data/train.jsonl",
    "validation": "data/validation.jsonl",
})
dataset = dataset.map(format_example, remove_columns=dataset["train"].column_names)

# Train only on the assistant response (not the prompt) using response template
response_template = "<|start_header_id|>assistant<|end_header_id|>"
collator = DataCollatorForCompletionOnlyLM(
    response_template=response_template,
    tokenizer=tokenizer,
)

# ── Training arguments ─────────────────────────────────────────────────────────
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=16,      # Effective batch size = 32
    learning_rate=2e-4,
    lr_scheduler_type="cosine",
    warmup_ratio=0.05,                   # Warmup over first 5% of steps
    max_grad_norm=1.0,
    weight_decay=0.01,
    bf16=True,                           # Use bf16 on Ampere+ GPUs
    optim="paged_adamw_32bit",           # Paged optimizer reduces GPU memory spikes
    logging_steps=10,
    eval_strategy="steps",
    eval_steps=50,
    save_strategy="steps",
    save_steps=50,
    save_total_limit=3,                  # Keep top-3 checkpoints
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    report_to="wandb",                   # Log to Weights & Biases
    run_name=f"{TASK_NAME}-run1",
)

# ── Trainer ────────────────────────────────────────────────────────────────────
trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["validation"],
    peft_config=lora_config,
    data_collator=collator,
    max_seq_length=2048,
    dataset_text_field="text",
    packing=True,                        # Pack short examples for GPU efficiency
)

trainer.train()
trainer.save_model(OUTPUT_DIR)

# ── Merge LoRA adapter into base model for deployment ─────────────────────────
from peft import PeftModel
merged_model = PeftModel.from_pretrained(
    AutoModelForCausalLM.from_pretrained(BASE_MODEL, torch_dtype=torch.bfloat16),
    OUTPUT_DIR,
)
merged_model = merged_model.merge_and_unload()
merged_model.save_pretrained(f"{OUTPUT_DIR}-merged")
tokenizer.save_pretrained(f"{OUTPUT_DIR}-merged")
print("Merged model saved. Ready for deployment.")
```

---

## Rules

1. **NEVER start training without a prompt-engineered baseline score.** You cannot know if fine-tuning succeeded unless you know what you are improving on. The baseline is the minimum bar the fine-tuned model must exceed.

2. **ALWAYS mask the prompt tokens from the training loss.** Training the model to predict both the prompt and the completion causes it to learn to reproduce the prompt format rather than the task. Use `DataCollatorForCompletionOnlyLM` or equivalent to compute loss only on completion tokens.

3. **NEVER use the test split for any decision during training or hyperparameter selection.** Using the test set to pick the best checkpoint invalidates your evaluation. Validation loss drives early stopping; test set is used once at the end.

4. **ALWAYS verify the chat template exactly matches inference.** A single token difference between training format and inference format (e.g., a missing newline, a different BOS token) can reduce model quality by 10--40%. Print three formatted examples and inspect them visually before starting training.

5. **NEVER fine-tune to inject factual knowledge.** Fine-tuning teaches the model how to behave, not what is true. A model fine-tuned on outdated medical protocols will confidently output those protocols even when they are wrong. Use RAG for knowledge grounding.

6. **ALWAYS keep a frozen copy of the base model during iteration.** Fine-tuning is destructive to model weights in full fine-tuning and modifies adapter weights in LoRA. Maintain a registry of base model versions and adapter checkpoints to enable rollback.

7. **NEVER set LoRA alpha lower than LoRA rank.** The effective learning rate of LoRA adapters is scaled by alpha/rank. Setting alpha < rank suppresses the adapter contribution to near zero, making fine-tuning effectively a no-op. The standard ratio is 1:2 (r=16, alpha=32) or 1:1 (r=16, alpha=16).

8. **ALWAYS check for data leakage between train and test splits before training.** If your test examples are near-duplicates of training examples, you will measure memorization, not generalization. Run deduplication across all splits and compute nearest-neighbor similarity between test and train examples.

9. **NEVER deploy a fine-tuned model without a catastrophic forgetting audit.** Run the model on 50 general-capability examples (basic reasoning, safety refusals, instruction following in off-task domains) and confirm it has not regressed more than 5% vs. the base model. A fine-tuned model with destroyed general capability is a liability.

10. **ALWAYS document the training data provenance and version.** Fine-tuned model behavior is entirely determined by training data. When a production incident occurs (and it will), you must be able to trace the model output back to specific training examples. Maintain a data lineage log including source, curation method, filter criteria, and version hash.

---

## Edge Cases

### The Data Cliff: Fewer Than 100 Examples

When you have fewer than 100 high-quality examples, standard LoRA fine-tuning will overfit severely and produce a model that memorizes the training set rather than generalizing.

- **Use prefix tuning or prompt tuning** instead of LoRA for <50 examples -- these methods have far fewer trainable parameters and are harder to overfit.
- **Increase LoRA dropout to 0.1--0.15** to add regularization pressure.
- **Augment with synthetic examples** generated by a teacher model, but validate each synthetic example manually before including it. Synthetic data quality degrades at scale; keep synthetic-to-real ratio below 5:1.
- **Switch to a few-shot prompting strategy instead** and reconsider fine-tuning when you have 200+ examples. The quality ceiling for <100 examples rarely justifies the overhead.
- **Use the full dataset for training and evaluate with k-fold cross-validation** (k=5) rather than a fixed train/test split, to get reliable quality estimates despite small sample size.

### Multi-Task Fine-Tuning: Avoiding Task Interference

When a single model must perform multiple tasks (e.g., extraction, classification, and summarization), naive mixing of training data from each task causes task interference where the model degrades on each individual task.

- **Use task prefix tokens** in every training example (e.g., `[EXTRACT]`, `[CLASSIFY]`, `[SUMMARIZE]`) so the model can condition behavior on task identity.
- **Balance task representation carefully** -- do not let one task dominate by volume. If task A has 10x more examples than task B, downsample A or upsample B using weighted sampling.
- **Train a separate model per task** if tasks have incompatible output formats (e.g., binary classification vs. long-form generation). The operational complexity of multiple models is usually lower than the debugging complexity of task interference.
- **Monitor per-task metrics independently during training.** A single aggregate loss curve can mask that one task is improving at the expense of another.

### Catastrophic Forgetting at Scale (Full Fine-Tuning)

Full fine-tuning of large models (>13B parameters) on narrow datasets routinely destroys general capabilities, especially instruction following, safety behaviors, and reasoning.

- **Mix in 5--10% general-purpose instruction data** (from datasets like Alpaca, FLAN, or OpenHermes) with every training batch. This is called "replay" or "experience replay" and dramatically reduces forgetting.
- **Use elastic weight consolidation (EWC)** if mixing general data is impractical -- EWC adds a regularization term that penalizes large changes to weights important for general tasks.
- **Apply layer-wise learning rate decay** -- set learning rates 5--10x lower for early layers (which encode general knowledge) than later layers (which encode task-specific patterns). In transformers, early layers 0--8 should have lr * 0.1, middle layers lr * 0.3, last layers lr * 1.0.
- **Prefer LoRA over full fine-tuning for any dataset smaller than 50k examples** -- LoRA's frozen base weights are inherently immune to catastrophic forgetting.

### Fine-Tuning Proprietary or Confidential Data

When training data contains confidential information (customer records, legal documents, internal communications), the fine-tuned model can memorize and reproduce training examples verbatim.

- **Apply differential privacy (DP-SGD)** during training by adding calibrated Gaussian noise to gradients. Use epsilon values of 2--8 for most applications (epsilon=8 is a common industry practice; epsilon=1 is research-grade strong privacy). DP-SGD reduces quality by 2--8% depending on epsilon and dataset size.
- **Scrub PII from training data** using a combination of rule-based detection (regex for SSNs, emails, phone numbers) and NER-based detection before fine-tuning begins. Log every scrubbed field for audit purposes.
- **Evaluate for memorization** using the extraction attack protocol: take 100 training examples, prompt the fine-tuned model with the first 50 tokens, and measure what percentage can regenerate the rest with >80% overlap. Memorization rates above 5% require data review.
- **Restrict model access** post-deployment to authenticated users with audit logging of all inputs and outputs.

### Continued Fine-Tuning on an Already Fine-Tuned Model

When you need to update a fine-tuned model with new data rather than retraining from scratch, naive continued training causes the model to overfit to new data and forget the original fine-tuning.

- **Always start from the base model weights** and merge the old adapter with new data in a combined training run. Continued fine-tuning of an already-adapted model rarely outperforms retraining from base.
- **If retraining from base is too expensive**, use a small learning rate (10x lower than original) and mix old training data (20--30%) with new data in the continued training run.
- **Maintain a versioned dataset registry** so you can always reproduce any model version from its exact training data snapshot.
- **Budget for at least 2 full retraining cycles per year** for production models serving evolving tasks.

### Fine-Tuning for Safety-Critical Applications

In domains like medical, legal, or financial advice, a fine-tuned model that is more confident and fluent in the domain but has subtly incorrect behavior is more dangerous than a conservative base model.

- **Do not fine-tune safety refusal behaviors away**, even inadvertently. If your training data does not include examples of appropriate refusals, the model learns to be unhelpfully compliant. Explicitly include refusal examples in training data for out-of-scope queries.
- **Implement output validation post-inference** -- do not rely on the model to self-validate. For structured outputs, validate JSON schema before returning to the user. For medical/legal outputs, route to human review above a confidence threshold.
- **Maintain a red-team evaluation suite** of adversarial inputs and evaluate every new model version against it before deployment. Include known failure modes from the previous model version.
- **Use a two-model architecture** for highest-stakes applications: the fine-tuned model generates a draft, and a general-purpose model (GPT-4o, Claude 3.5 Sonnet) acts as a critic to flag potential errors before returning the response.

### Cloud API Fine-Tuning (OpenAI, Cohere, Vertex AI)

When using managed fine-tuning APIs rather than self-hosted training infrastructure, many of the above controls are unavailable or limited.

- **Validate that the provider's fine-tuning API supports your model size and token budget.** OpenAI's GPT-4o fine-tuning as of 2024 is limited to 65,536 training tokens per example and has different checkpoint behavior than self-hosted training.
- **You cannot inspect gradients, layer weights, or intermediate checkpoints** with cloud APIs. Compensate by investing more in evaluation -- run thorough quality assessment on every model version the API produces.
- **Check terms of service on data retention.** Most cloud providers retain your training data for 30--180 days for safety monitoring. Ensure your data agreements with data subjects permit this use.
- **Test the API's chat template formatting exactly.** Providers often have undocumented formatting quirks that differ from the open-source model's original template. Download 3--5 example training files from the provider's documentation and compare with your own formatting.

---

## Example

**Input from user:**
> "We have a legal tech startup. We want to fine-tune a model to extract structured data from commercial contracts -- specifically, extracting the parties, effective date, payment terms, governing law, and termination clauses from uploaded PDFs. We have about 800 labeled contracts. We're currently using GPT-4o with a detailed prompt and getting about 78% exact-match accuracy on our test set, and we want to get to 92%+. What fine-tuning strategy should you recommend?"

---

**Output:**

```
╔═══════════════════════════════════════════════════════════╗
║           FINE-TUNING STRATEGY ASSESSMENT                 ║
╚═══════════════════════════════════════════════════════════╝

PROJECT: Commercial Contract Structured Extraction
DATE: [Current date]
ANALYST: AI Assistant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: FINE-TUNING JUSTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task Type:              Structured extraction (JSON output from legal text)
Baseline Method Tried:  Prompt engineering with GPT-4o
Baseline Quality Score: 78% exact match on test set
Target Quality Score:   92%+ exact match
Gap:                    14% -- JUSTIFIES fine-tuning

Primary Failure Mode:   Format inconsistency + legal domain terminology
                        (78% exact match means ~22% of outputs have wrong JSON
                        structure, wrong field names, or missed/wrong values)
Fine-Tuning Addressable: YES -- format failures and terminology are the
                         highest-ROI fine-tuning use cases

Decision: PROCEED WITH FINE-TUNING
Rationale: The 14-point gap is too large to close with prompt engineering alone
(you are already at a well-engineered GPT-4o baseline). Format and terminology
failures are precisely what fine-tuning addresses. With 800 labeled examples
and a focused 6-field extraction task, you have sufficient data for LoRA
fine-tuning of a 7B or 13B model to match or exceed GPT-4o performance while
reducing inference cost by ~20x.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: METHOD SELECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Base Model:             Llama-3-8B-Instruct (8B parameters)
                        OR Mistral-7B-Instruct-v0.3 (7B, strong extraction benchmark)
Fine-Tuning Method:     QLoRA (4-bit base + LoRA adapters)
Justification:          800 examples is ideal for LoRA. QLoRA enables training on
                        a single A100 40GB or H100 80GB without full-precision memory.
                        Full fine-tuning is not warranted at this dataset size.

LoRA Configuration:
  rank (r):             16
  alpha:                32  (alpha/r ratio = 2, standard)
  dropout:              0.05 (small regularization for 800 examples)
  target_modules:       q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj
                        (all linear layers -- extraction benefits from full expressivity)
  use_dora:             True (free quality improvement)

Hardware Requirement:   1x A100 40GB (or 2x A6000 48GB) OR cloud equivalent
Estimated Training Time: 2--4 hours at 800 examples x 3 epochs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: DATASET PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Collection Strategy:    Existing labeled contracts (you have 800 -- this is enough)
Target Dataset Size:    800 examples total

  Train split:          640 examples (80%)
  Validation split:     80 examples (10%)
  Test split:           80 examples (10%)

Important: Your existing test set from the GPT-4o evaluation must become the
test split here. Do NOT re-split -- maintain evaluation continuity so that
your 78% baseline and fine-tuned model score are directly comparable.

Input Format (CRITICAL -- must match inference exactly):
  The input is the raw OCR/extracted text of the contract, truncated to 6000
  tokens if necessary (use the first and last 3000 tokens for very long contracts;
  most payment terms and termination clauses appear at the start and end).

  Prompt template:
  [System]: You are a contract analysis assistant. Extract the following fields
  from the contract text as a JSON object: parties (array of strings), 
  effective_date (ISO 8601 string or null), payment_terms (string), 
  governing_law (string), termination_clause (string). 
  Return ONLY valid JSON with no explanation.
  [User]: [CONTRACT TEXT]
  [Assistant]: {"parties": [...], "effective_date": "...", ...}

Output Format:
  Strict JSON. Every training example MUST have all 6 keys present, even if 
  the value is null (for missing fields). This teaches the model to always 
  output a complete schema.

Quality Filter Method:  Manual review of 80 random examples from your existing
                        labeled dataset. Flag any examples where the label is
                        ambiguous (e.g., multiple possible effective dates).
                        Remove ambiguous examples from training data.

Deduplication Method:   SHA-256 on contract text. Legal contracts are often
                        templated -- you may have near-duplicates with different
                        party names. Keep all of them (this diversity is valuable)
                        but remove true duplicates.

Known Data Risks:
  - PII: Client names, addresses, payment amounts are present. Fine-tuning
    on this data is permissible if your data agreements cover ML training use.
    Confirm with your legal team before starting.
  - Class imbalance: "governing_law" is probably 80%+ one jurisdiction
    (e.g., New York or Delaware). The model will be less accurate on minority
    jurisdictions. Audit and potentially oversample minority jurisdiction contracts.
  - Contract length: Some contracts may exceed 8192 tokens. Decide on a
    truncation strategy and apply it consistently to both training and inference.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: TRAINING CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Hyperparameter          | Value          | Rationale                              |
|-------------------------|----------------|----------------------------------------|
| Learning rate           | 2e-4           | Standard LoRA starting point           |
| LR schedule             | cosine + warmup| Smooth convergence for small datasets  |
| Warmup ratio            | 0.05           | ~96 warmup steps over 1920 total       |
| Per-device batch size   | 2              | A100 40GB memory constraint w/ QLoRA   |
| Gradient accum. steps   | 16             | Effective batch size = 32              |
| Epochs                  | 3              | 800 examples, monitor val loss at 1.5  |
| Max sequence length     | 4096 tokens    | Covers 95th percentile contract length |
| Gradient clipping       | 1.0            | Universal                              |
| Weight decay            | 0.01           | Light regularization for 800 examples  |
| Mixed precision         | bf16           | A100 native, lower loss than fp16      |
| Optimizer               | paged_adamw_32bit | Reduces
