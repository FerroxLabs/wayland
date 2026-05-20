---
name: ai-image-prompt-debugging
description: |
  Diagnoses and fixes AI image generation prompt issues including mismatched style descriptors, conflicting terms, underspecified composition, and overcrowded token budgets with revised prompt output.
  Use when the user asks why their AI image prompt is not producing expected results, wants to fix a failing prompt, or needs to diagnose visual artifacts in generated images.
  Do NOT use for creating new prompts from scratch (use model-specific prompting skills), style transfer (use ai-image-style-transfer), or upscaling (use ai-image-upscaling).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-image-generation analysis design"
  category: "design-creative"
  subcategory: "ai-image-generation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# AI Image Prompt Debugging

## When to Use

**Use this skill when:**
- A user provides an existing prompt and describes a gap between what they expected and what the model produced (wrong style, wrong subject, wrong composition, wrong mood, artifacts, missing elements)
- A user asks why their prompt "used to work" in an older model version but produces degraded results after a model update
- A user describes specific visual failure patterns: anatomy errors, style bleed, background dominance, color casts, texture corruption, or compositional collapse
- A user has tried multiple prompt variations and cannot isolate what is causing the persistent problem
- A user wants to understand the mechanics of why two nearly identical prompts produce drastically different outputs
- A user's negative prompt is actively suppressing desired elements or failing to exclude unwanted ones
- A user reports that CFG, step count, or sampler changes are producing unexpected responses to the same prompt
- A user's weighted terms are causing visible artifacts, halos, or oversaturated focal points

**Do NOT use when:**
- The user has no prompt yet and wants to build one from scratch -- use a model-specific prompting skill instead
- The user wants to migrate a working Midjourney prompt to Stable Diffusion or vice versa -- use a prompt-translation skill
- The user wants to apply a specific visual style to a new subject they have not yet prompted -- use ai-image-style-transfer
- The user wants to increase resolution or recover detail in an already-generated image -- use ai-image-upscaling
- The user wants to generate variations of a working prompt -- use ai-image-variation or model-specific iteration skills
- The user is troubleshooting inpainting or outpainting failures -- use ai-image-inpainting-debug
- The problem is a model crash, API error, NSFW filter block, or queue failure -- this is infrastructure, not prompt diagnosis

---

## Process

### Step 1 -- Gather All Debugging Inputs

Before diagnosing, collect every variable that affects output. Missing even one can lead to incorrect diagnosis.

- **Exact prompt text:** Ask for a copy-paste, not a paraphrase. A single word difference can change output significantly. If the user is on Midjourney, ask them to use the `/describe` output or copy directly from the job history.
- **Negative prompt (if SD/ComfyUI/InvokeAI):** The full negative prompt. A negative prompt that contradicts the positive is one of the most common causes of failure in Stable Diffusion pipelines.
- **Model and version:** SD 1.5 vs SDXL 1.0 vs SDXL Turbo vs SD 3 vs Midjourney v5/v6/v6.1 vs DALL-E 3 vs Flux.1 [dev] vs Flux.1 [schnell] -- these are architecturally different and share almost no prompt syntax conventions.
- **Checkpoint or LoRA (SD):** The base checkpoint (e.g., Realistic Vision v6, DreamShaper XL, Juggernaut XL) affects how prompt terms resolve to visual output. A prompt tuned for Deliberate v3 will fail on SDXL without adaptation.
- **Sampler and scheduler:** DPM++ 2M Karras, Euler a, DDIM, UniPC, LCM -- each has different convergence behavior and responds differently to CFG values.
- **CFG scale / guidance scale:** The exact number. This is diagnostic.
- **Step count:** The exact number. Under 20 steps with most non-distilled samplers produces unfinished output regardless of prompt quality.
- **Resolution:** Width x height. SDXL artifacts above 1.5 megapixels without MultiDiffusion or tiled VAE. SD 1.5 optimal is 512x512 or 512x768. Midjourney --ar ratio.
- **Seed (if known):** A fixed seed lets you isolate prompt changes from randomness.
- **What the user expected vs. what they got:** Ask for a description of the actual output, or better, the image itself. "It looks cartoonish" is less useful than "it rendered as a flat 2D illustration with cel shading and dark outlines."
- **What variations they already tried:** This prevents recommending things they have already ruled out.

---

### Step 2 -- Identify the Model's Prompt Paradigm

Different models process prompts through fundamentally different architectures. Diagnosis must start by confirming which paradigm governs this prompt.

**Stable Diffusion 1.x (CLIP ViT-L/14 encoder):**
- Hard token limit of 77 tokens per pass. Tokens are not words -- a word like "photorealistic" may be 3 tokens. Punctuation costs tokens.
- Terms beyond token 77 are passed to a second CLIP pass with reduced influence. Many implementations simply truncate.
- Comma-separated keyword style works best. Natural language sentences are processed less reliably.
- Supports attention weighting: `(term:1.2)` increases emphasis, `(term:0.8)` reduces it. Values above 1.5 cause visual saturation/artifacts. Values below 0.5 cause near-suppression.
- Checkpoint choice dominates style more than prompt terms. A LoRA with 0.8 weight can overpower a prompt entirely.
- Highly sensitive to quality booster tags: "masterpiece, best quality, ultra-detailed" strongly bias SD 1.5 models trained on Danbooru/e621 datasets.

**Stable Diffusion XL (two CLIP encoders: ViT-L and ViT-bigG):**
- Two separate 77-token passes: one to each CLIP encoder. The ViT-bigG encoder (second) carries more semantic weight.
- Responds better to natural language phrases within keyword strings.
- Quality booster tags ("masterpiece") have less effect on SDXL than on SD 1.5.
- Optimal base resolution: 1024x1024. Using 512x512 causes composition collapse and face malformation.
- SDXL Refiner pipeline expects a denoising_start cutoff between 0.7-0.9 (approximately the last 20-30% of steps).
- VAE bakes into output quality -- the official SDXL VAE (madebyollin fp16 fix) is required to prevent washed-out colors.

**Flux.1 [dev] / Flux.1 [schnell]:**
- Transformer-based (not UNet). CLIP + T5-XXL dual text encoder architecture.
- T5-XXL processes natural language with high fidelity -- full sentences work. Comma-separated tags are less optimal than in SD.
- No attention weighting syntax in baseline Flux. Weights like `(term:1.5)` are either ignored or parsed inconsistently.
- CFG guidance in schnell: 3.5-4.5. In dev: 3.5-7. Higher CFG than these ranges causes severe artifacts.
- Very long prompts are handled better than SD, but subject/action/style ordering still matters.
- Strong anatomy and hand quality at default settings compared to SD 1.x.

**Midjourney v5/v6/v6.1:**
- No explicit token limit, but prompt weighting uses `::` multi-prompt syntax and `--s` (stylize) control.
- Earlier terms in the prompt carry more weight than later terms.
- `--style raw` reduces aesthetic stylization. `--s 0` eliminates it almost entirely (often too flat). `--s 100-250` is the photorealism-to-artistic spectrum.
- Parameter flags (`--ar`, `--v`, `--no`, `--cref`, `--sref`) are syntactically separate from the text prompt and must appear at the end.
- v6+ responds to natural language far better than v5. v5-style comma-keyword prompts in v6 produce noticeably different (often worse) results.
- `--no` is the primary negative mechanism. It is less precise than SD negative prompts but works for broad style exclusion.

**DALL-E 3:**
- Responds to natural language descriptions only. Tags and keyword syntax produce worse results.
- ChatGPT/system prompt context affects output even when invisible to the user.
- Has built-in safety and copyright filters that silently modify prompts ("prompt revision"). The user may not be prompting what they think they are prompting.
- Does not support CFG, sampler, steps, seeds, or negative prompts.
- If results seem randomly inconsistent, the system may be revising the prompt silently. Ask the user to check the "revised prompt" in the API response or UI tooltip.

---

### Step 3 -- Run the Seven-Category Diagnostic

Evaluate the prompt against all seven categories systematically. Do not skip categories because they seem unlikely.

**Category 1 -- Conflicting Descriptors**
Look for pairs or groups of terms that encode opposing visual properties:
- Medium conflicts: "watercolor" + "photorealistic" + "sharp focus" -- a medium (watercolor) that implies softness, combined with photographic precision
- Lighting conflicts: "dramatic shadows" + "bright, even lighting" -- these are mutually exclusive lighting setups
- Temporal conflicts: "sunset" + "golden hour" + "midday sun" -- pick one
- Tone conflicts: "dark, gritty, noir" + "vibrant, colorful, cheerful"
- Resolution conflicts: "painterly, impressionistic" + "4K, ultra-detailed, sharp"
- Composition conflicts: "minimalist" + "highly detailed, intricate, busy"
Each conflict forces the model to average two opposing instructions, producing a muddy or inconsistent result. Fix: identify the dominant intent, remove the contradicting term, and if both are genuinely desired (e.g., a detailed minimalist composition is actually possible), rewrite with precise spatial control.

**Category 2 -- Style Paradigm Mismatch**
The style descriptors do not belong to the same visual language family:
- Mixing artistic-medium terms ("oil painting," "impasto texture") with photographic terms ("85mm lens," "bokeh," "ISO 800") -- these belong to incompatible visual paradigms
- Mixing era/movement terms without coherence: "Art Deco Baroque cyberpunk" -- three unrelated style languages
- Using film/photography jargon on a model that was not trained on photographic data (some SD 1.5 anime checkpoints do not respond to camera specs at all)
- Using anime quality tags ("best quality, masterpiece") on photorealistic checkpoints -- these terms activate anime training data, not photo training data
Fix: map all style descriptors to a single visual paradigm. Choose medium OR photography OR illustration OR 3D render, then use only the vocabulary of that paradigm.

**Category 3 -- Underspecified Composition**
The prompt lacks the spatial and structural cues needed to constrain the layout:
- Subject with no positioning: "a warrior" -- foreground or background? Facing camera or turned? Close-up or full-body?
- No depth cues: no near/far relationship, no layering, no atmospheric perspective reference
- No lighting source: models default to flat ambient lighting when no light source is specified
- No frame: "a forest" could be an aerial shot, a ground-level path view, a canopy shot, or a clearing -- the model picks randomly
- Ambiguous subject count: "wolves in the snow" -- one wolf? Three? A pack of twenty?
Severity: medium-to-high for subjects. Low for abstract or texture-only generations.
Fix: add the minimum compositional triangle: (1) viewpoint/angle, (2) subject scale/framing, (3) light source.

**Category 4 -- Overcrowded Token Budget / Adjective Flooding**
Too many descriptors that compete for influence:
- More than 8-12 meaningful descriptors in an SD 1.5 prompt exceeds the useful density threshold
- Subjective adjectives ("beautiful," "stunning," "amazing," "perfect," "incredible") consume tokens without adding visual information -- they are evaluative, not descriptive
- Redundant synonyms: "majestic, epic, grand, imposing" all instruct the model toward the same quality -- one strong term is more effective
- In Midjourney, long adjective chains reduce the coherence of the core subject
Token budget rule of thumb for SD: every comma-separated term uses approximately 1-3 tokens. A 30-word prompt may already be 50-60 tokens, leaving little budget for quality tags, style, and negative guidance.
Fix: apply the "cut-by-half" test -- remove every term that does not directly describe a visible, physical quality. If the image would look the same without it, cut it.

**Category 5 -- Negative Prompt Issues (SD-specific)**
Negative prompts introduce their own failure modes:
- Over-long negatives (100+ tokens) cut into the effective influence of the positive prompt because total attention is shared
- Generic mega-negatives copied from the internet ("worst quality, low quality, normal quality, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, jpeg artifacts, signature, watermark, username, artist name, blurry, text, error") applied to every prompt regardless of subject -- for a landscape, "bad anatomy" and "missing fingers" are irrelevant and waste token budget
- Negating the subject accidentally: a portrait prompt with "face" in the negative will suppress facial features
- Negating style you want: "painting" in the negative when the prompt asks for an "oil painting" style
- Contradictory negatives: "no people" in the negative when the positive prompt features a character
Fix: audit every term in the negative prompt against the positive. Remove any term that could match a desired element. Keep negatives focused and relevant to the specific content type.

**Category 6 -- Parameter Misconfiguration**
Settings interact with the prompt in ways that can override even well-written text:
- **CFG scale:**
  - SD 1.5: optimal 6-9. Below 4: prompt ignored, random output. Above 14: oversaturated colors, burned highlights, artifacts.
  - SDXL: optimal 6-8. More sensitive than SD 1.5 -- 10+ causes noticeable degradation.
  - Flux.1 dev: 3.5-7. Flux.1 schnell: 1-3 (it is a distilled model; standard CFG ranges destroy it).
  - Midjourney: no direct CFG control. Use `--s` (stylize) instead.
- **Step count:**
  - SD 1.5 with DPM++ 2M Karras: 20-30 steps is sufficient. Above 40 yields diminishing returns. Below 15 produces unfinished/blurry output.
  - SDXL: 25-35 steps optimal. Below 20 causes composition collapse.
  - LCM/Turbo distilled models: 4-8 steps. Running 30 steps on LCM oversmooths and degrades quality.
  - Flux.1 schnell: 4 steps is by design. Running more steps does not improve quality.
- **Sampler:**
  - DPM++ 2M Karras: most consistent for photorealistic content, SD 1.5 and SDXL.
  - Euler a: more creative/varied but less consistent across seeds.
  - DDIM: good for inpainting, lower quality for full generations.
  - UniPC: fast with reasonable quality, good for testing iterations.
  - LCM: fast distilled sampler -- only for LCM LoRA or LCM checkpoint models.
- **Resolution mismatch:**
  - SD 1.5 trained at 512x512. Generating at 768x768 directly causes anatomical issues (extra limbs, head duplication). Use hires.fix or img2img upscaling at 0.4-0.5 denoising strength.
  - SDXL trained at 1024x1024. Generating at 512x512 causes composition and anatomy problems. Never go below 768px on either dimension.
  - Generating non-square with incorrect orientation encoding: SDXL and SD 3 use target_size and crops_coords_top_left conditioning -- generating 1024x1024 but setting target_size to 768x768 produces incorrect scale rendering.

**Category 7 -- Weight and Emphasis Imbalance (SD-specific)**
Prompt weighting syntax must be used conservatively:
- `(term:1.0)` -- no change. `(term:1.2)` -- modest emphasis. `(term:1.5)` -- strong emphasis, approaching artifact risk. `(term:2.0)` -- very likely to cause artifacts, bleed, or hallucinations.
- Stacking weights additively: `((term))` in some implementations equals `(term:1.21)`. `(((term)))` equals approximately `(term:1.33)`. More than two stacked parentheses approaches artifact territory.
- Competing high-weight terms: `(red hair:1.5), (blue eyes:1.5), (green dress:1.5)` forces the model to simultaneously oversaturate three competing attributes -- color artifacts result.
- Under-weighting the subject while over-weighting modifiers: `a woman, (detailed background:1.5), (intricate texture:1.5)` can cause the background to dominate and the subject to become unclear.
- SDXL: the dual encoder means weights propagate differently. Keep weights between 0.8 and 1.3 for reliable results.
Fix: use weighting sparingly, only for the one or two most important elements. Reduce conflicting high weights. Use negative prompt suppression rather than weight reduction below 0.5.

---

### Step 4 -- Rank Issues by Severity

After completing all seven category checks, rank every identified issue:

- **High severity** -- This issue alone could fully explain the gap between expected and actual output. Fix this first. Example: "magical" triggering fantasy rendering when the user wanted photorealism.
- **Medium severity** -- This issue contributes to the problem but may not be the sole cause. Fix after the high-severity issue is resolved. Example: missing camera specs that would reinforce a photorealistic intent.
- **Low severity** -- This issue is a quality improvement rather than a fix. Address after the primary problems are resolved. Example: redundant synonyms consuming token budget without causing visible failure.

State explicitly when you cannot determine severity without seeing the actual generated image. Ask the user for an image description if needed.

---

### Step 5 -- Write the Revised Prompt

Apply all high and medium severity fixes. Apply low-severity fixes only if they do not change the user's intent.

- Preserve the user's core subject and intent absolutely. If they wanted a mountain landscape, the revised prompt must still be a mountain landscape.
- Make all changes minimally -- do not rewrite the prompt from scratch when targeted surgery is possible.
- Front-load the most critical terms: subject first, then style, then composition, then quality modifiers.
- For SD: quality tags first, then subject, then style, then composition, then technical specs (camera/lighting), then additional detail tags.
- For Midjourney v6+: subject description first (in natural language), then style qualifiers, then technical parameters as flags at the end.
- For Flux.1: full natural language sentence describing subject, action, environment, lighting, then style and technical references.
- For DALL-E 3: complete natural language paragraph. No tags. Active voice ("a photographer captures...") outperforms passive ("a photograph of...").
- Document every single change separately. Do not bundle multiple changes into one table row.

---

### Step 6 -- Verify Model Limitations Are Not the Root Cause

Some problems cannot be fixed with prompt changes. These must be identified honestly rather than routing the user toward an impossible prompt fix:

- **Exact legible text in images** -- All diffusion models hallucinate text. DALL-E 3 handles short strings (1-3 words) in some contexts, but complex text is unreliable across all models. Honest fix: generate the image without text, add text in post using Photoshop, Canva, or similar.
- **Precise spatial relationships** -- "Put the red ball exactly 3 centimeters to the left of the blue cube" is not achievable through prompting alone. Use ControlNet (for SD) or reference images (for MJ `--cref`/`--sref`) for precise layout.
- **Consistent faces across multiple generations** -- Diffusion models do not have memory. Consistent character identity requires ControlNet face reference, IP-Adapter, Midjourney `--cref`, or fine-tuning (LoRA/DreamBooth). This is not fixable with prompting.
- **Multiple distinct characters in a scene** -- Models frequently merge attributes of two characters (one character gets both their hair colors, their clothing blends). Mitigations exist (ControlNet multi-person, regional prompting in SDXL) but are workflow changes, not prompt changes.
- **Hands and fingers** -- A structural limitation of most diffusion models due to training data distribution and the high variability of hand poses. Mitigation: add "perfect hands, correct anatomy, eight fingers, two thumbs" to positive; "deformed hands, extra fingers, missing fingers, malformed hands, mutated hands" to negative; use 30+ steps; CFG 6-8; consider ControlNet handpose reference. Set honest expectations: this reduces but does not eliminate hand errors.
- **Exact color matching to a hex code** -- Models do not process hex values. Describe colors in natural language with multiple reference points: "deep burgundy red, the color of aged Merlot wine" works better than "#7B2240."

---

### Step 7 -- Compile the Full Debug Report

Assemble all findings into the structured output format. Include:
- Original prompt, exact
- All issues detected, categorized and severity-rated
- A diagnostic explanation in natural language that explains the causal chain
- The revised prompt, exact
- A changes table with every modification documented
- Numbered follow-up recommendations if the revised prompt still fails
- Prevention tips tailored to the specific mistake pattern found

---

## Output Format

```
## Prompt Debug Report

### Original Prompt
[user's exact prompt, reproduced verbatim -- do not paraphrase]

Model: [model name and version] | Parameters: [CFG: X | Steps: X | Sampler: X | Resolution: XxX | Seed: X or "not provided"]

Negative Prompt (if provided):
[exact negative prompt text, or "none provided"]

---

### Issues Detected
| # | Category                      | Severity | Specific Problem Found                                          |
|---|-------------------------------|----------|-----------------------------------------------------------------|
| 1 | [Category name]               | HIGH     | [Specific conflicting/problematic terms cited verbatim]         |
| 2 | [Category name]               | MEDIUM   | [Specific issue with quoted term from the prompt]               |
| 3 | [Category name]               | LOW      | [Specific minor issue with quoted term]                         |

Severity key: HIGH = primary cause | MEDIUM = contributing factor | LOW = quality improvement

---

### Diagnosis
**Primary failure mode:** [1-sentence summary of the main cause]

[Paragraph 1: Explain the causal chain -- which specific terms are causing which specific visual outcomes, and why. Reference the model's architecture where relevant. Be specific about term interactions.]

[Paragraph 2: Secondary contributing factors. Note any parameter settings that compound the prompt issues. Note any model limitations that apply.]

---

### Revised Prompt
[corrected prompt, exact and complete, ready to copy-paste]

Model: [model] | Parameters: [CFG: X | Steps: X | Sampler: X | Resolution: XxX]

Revised Negative Prompt (SD only, if applicable):
[revised negative prompt]

---

### Changes Made
| # | Original Term or Setting       | Revised To                          | Reason                                                        |
|---|-------------------------------|-------------------------------------|---------------------------------------------------------------|
| 1 | "[exact original term]"        | "[exact replacement]"               | [mechanism: why this specific change fixes this specific issue] |
| 2 | "[exact original setting]"     | "[exact new setting]"               | [why this parameter change affects the output]                |

---

### Model Limitations Noted
[If any of the user's goals are not achievable through prompt changes alone, state them here with honest mitigation options]
-- or --
None identified. The issues above are addressable through prompt and parameter changes.

---

### If the Revised Prompt Still Fails
1. [Most likely residual issue and the next specific adjustment to make -- a concrete change, not "try experimenting"]
2. [Second most likely residual issue with specific fix]
3. [Alternative workflow approach if prompting alone cannot achieve the result]

---

### Prevention Tips
- [Specific habit or rule that would prevent the exact issue found, phrased as a portable principle]
- [Second specific prevention principle]
```

---

## Rules

1. **Never diagnose without the exact original prompt.** Paraphrases and summaries of prompts are not sufficient. A single word ("magical," "dark," "anime") can be the entire cause of failure. Ask for copy-paste confirmation before proceeding.

2. **Always identify the model architecture before diagnosing.** The same prompt failure has different root causes in SD 1.5, SDXL, Flux.1, and Midjourney. A token budget issue is a crisis in SD 1.5 and irrelevant in Flux.1 dev. Diagnosing the wrong architecture wastes the user's iteration cycles.

3. **Run all seven diagnostic categories, every time.** Do not stop at the first issue found. Multiple issues frequently co-occur and reinforce each other. Missing a secondary issue means the user will be back with the same failure after applying the first fix.

4. **Severity ratings must be grounded in mechanism, not intuition.** Assign HIGH only when you can name the specific causal chain: "term X activates training data cluster Y, which produces visual property Z, which the user does not want." If you cannot articulate the mechanism, rate it MEDIUM.

5. **The revised prompt must be copy-paste ready.** No bracketed placeholders. No "[insert your subject here]." No instructions embedded in the prompt string. The revised prompt must be a complete, valid prompt the user can paste into the model UI immediately.

6. **Document every change individually.** Bundling changes into "rewrote the prompt for clarity" is not acceptable. Each modification -- including parameter changes -- gets its own row in the changes table with the original term, the replacement, and the mechanism.

7. **Preserve user intent absolutely.** If the user wanted a castle at night, the revised prompt must feature a castle at night. Do not substitute a "fortress at dusk" because you think it prompts better. If you believe the original concept is fundamentally difficult for the model, say so explicitly while still attempting the fix.

8. **Flag model limitations honestly before promising a fix.** Exact text rendering, precise spatial layout, consistent identity across generations, and exact color values are structural model limitations. State this directly rather than sending the user through 10 failed iterations. Offer realistic mitigations.

9. **Weight values above 1.5 in SD syntax must be flagged as HIGH severity artifact risks** regardless of whether they appear to be causing the current problem. They are latent bugs that will surface as soon as the user changes other parameters. Recommend replacing weight syntax above 1.5 with more terms and clearer natural language instead.

10. **Never recommend parameters outside safe ranges without explicit justification.** Do not suggest CFG 15 "to push the style harder." The safe ranges exist because the model training creates nonlinear instability outside them. If a user needs extreme emphasis, explain why weight syntax or negative prompts are safer tools than extreme CFG.

11. **For SD prompts, check total estimated token count.** Count comma-delimited terms and multiply by approximately 1.5-2.5 tokens per term to estimate token usage. If the estimated total approaches 60-70 tokens for SD 1.5 or either 77-token pass for SDXL, flag this as a medium-severity issue and identify which terms are likely falling in the degraded zone.

12. **If the user has already tried variations, start from their most recent version, not the original.** Each variation provides diagnostic data. The pattern of changes and their effects narrows the cause space significantly. Ask what changed between versions and what the effect was before advising.

---

## Edge Cases

### Same prompt works in one model version but fails in a newer one
Model version updates frequently retrain attention weighting and change how tags resolve to training data clusters. Midjourney v5 style keyword chains ("intricate, detailed, cinematic lighting, octane render") work less well in v6 because v6 was trained to respond to natural language, making keyword-style prompts produce flatter, more literal results. Diagnosis: identify whether the prompt was written for the older version's syntax conventions, then translate to the current version's paradigm. For Midjourney v5-to-v6 migration, convert comma-separated keyword strings to descriptive sentences while preserving all specific visual attributes.

### Prompt produces extremely inconsistent results across seeds (good 1 in 10 times)
This is not primarily a prompt quality issue -- it is a CFG-and-sampler convergence issue. At mid-range CFG (7-9 for SD 1.5), certain prompt configurations create a wide attractor basin in the diffusion latent space, meaning many different visual interpretations satisfy the prompt constraints equally. Fix: first lock the seed of a "good" result to confirm what parameters produced it. Then identify what structural element in the prompt allows multiple valid interpretations (usually an underspecified subject or a conflicting descriptor pair). Tighten those terms. If inconsistency persists, try Euler a vs DPM++ 2M Karras -- Euler a is intentionally more variable, DPM++ 2M Karras converges more deterministically. Reducing CFG by 1-2 points can also narrow the attractor basin.

### Correct style but wrong subject (or correct subject but wrong style)
These two failure modes have opposite causes. Correct style + wrong subject means the style terms are overpowering the subject terms. Fix: move the subject description earlier in the prompt, add specificity to the subject (species, clothing, pose, expression -- any precise physical attribute), and reduce style term density or weight. Correct subject + wrong style means the subject description is displacing the style terms. Fix: for SD, use `(style:1.2)` weight on the style terms. For Midjourney, use multi-prompt syntax to give the style its own emphasis weight: `photorealistic portrait::2 oil painting::0` -- the style gets direct weighting independent of the subject description.

### LoRA or embedding is overriding the prompt
A LoRA with trigger word activated will bias output heavily toward its training distribution regardless of prompt content. If the user is using a checkpoint + LoRA combination and cannot achieve a style or subject that contradicts the LoRA's training data, the LoRA is the bottleneck, not the prompt. Diagnosis: ask whether the same prompt without the LoRA produces the expected result. If yes, the LoRA is suppressing the prompt. Fix options: reduce the LoRA weight (from 1.0 to 0.5-0.7), remove the LoRA trigger word from the prompt, or try a different LoRA with a narrower training scope. Some textual inversion embeddings also have this behavior -- "EasyNegative" for example contains a compressed set of negative concepts that can suppress positive prompt terms if the concepts overlap.

### Image has correct composition but color or lighting is wrong
The compositional terms (angle, framing, depth) are working but the lighting/color terms are not resolving correctly. This often indicates that the lighting terms are either: (1) positioned too late in the prompt (beyond token 50 in SD), (2) too abstract ("moody lighting" instead of "single directional key light from camera left, hard shadow, color temperature 3200K tungsten"), or (3) conflicting with a style term that implies its own lighting (e.g., "high key portrait" combined with "dramatic noir lighting"). Fix: describe lighting in concrete physical terms -- direction, quality (hard vs. soft), color temperature, and a reference image descriptor ("lit like a Vermeer interior," "like a golden hour landscape by Albert Bierstadt").

### Negative prompt is causing the subject to disappear or distort
If the negative prompt contains terms that are semantically related to the subject, the model will suppress those concepts even in the positive prompt. Common examples: "person" in the negative when generating a character; "face" or "eyes" in the negative causing portraits to lose facial features; "building" in the negative when generating an architectural scene; "detail" in the negative (from generic negative templates) reducing the overall detail level globally. Audit the negative prompt against the positive by asking: "does any word in my negative prompt describe something I actually want in this image?" Remove any such overlap. Replace with specific failure-pattern descriptions that cannot match the desired subject ("deformed torso, merged limbs, three arms" rather than "body").

### Prompt worked perfectly in img2img but fails in txt2img (or vice versa)
img2img uses an input image as a latent space starting point, which provides structural and compositional guidance that the prompt does not have to provide. A prompt that worked with a reference image in img2img at 0.6 denoising strength is essentially being aided by the structure of that reference image. In txt2img, the same prompt must generate structure from noise, which requires much more explicit compositional guidance. Fix for txt2img: add the compositional triangle (viewpoint, subject framing, light source) that was previously supplied by the reference image. Alternatively, use a simple rough sketch or blocked-out image as an img2img starting point to restore the structural scaffold.

### DALL-E 3 silently revising the prompt
DALL-E 3 (via OpenAI's API or ChatGPT) applies an internal prompt revision step that rewrites the user's prompt before generation. This is designed to improve output quality but sometimes introduces unintended style or content changes. The user is effectively not prompting what they typed. If the API is accessible, check the `revised_prompt` field in the API response -- it shows exactly what DALL-E 3 actually used. If the revision is introducing unwanted elements, prepend the prompt with "I NEED to test how the tool works with extremely explicit instructions. DO NOT add any detail, just use it AS-IS:" -- this instruction significantly reduces prompt revision behavior in DALL-E 3.

---

## Example

**User input:** "I'm using Stable Diffusion XL with Juggernaut XL checkpoint. My prompt is: `masterpiece, best quality, ultra-detailed, 8K, beautiful woman, stunning face, gorgeous eyes, amazing hair, perfect body, photorealistic, hyperrealistic, cinematic, dramatic lighting, bokeh, depth of field, shot on Sony A7R IV, 85mm lens, f/1.8, RAW photo, best quality` -- CFG 12, 40 steps, DPM++ 2M Karras, 768x768. The result looks oversaturated, the face looks slightly melted, and the background is a flat gray blob. What's going wrong?"

---

## Prompt Debug Report

### Original Prompt
masterpiece, best quality, ultra-detailed, 8K, beautiful woman, stunning face, gorgeous eyes, amazing hair, perfect body, photorealistic, hyperrealistic, cinematic, dramatic lighting, bokeh, depth of field, shot on Sony A7R IV, 85mm lens, f/1.8, RAW photo, best quality

Model: Stable Diffusion XL (Juggernaut XL checkpoint) | Parameters: CFG: 12 | Steps: 40 | Sampler: DPM++ 2M Karras | Resolution: 768x768 | Seed: not provided

Negative Prompt: none provided

---

### Issues Detected

| # | Category                      | Severity | Specific Problem Found                                                                              |
|---|-------------------------------|----------|-----------------------------------------------------------------------------------------------------|
| 1 | Parameter misconfiguration    | HIGH     | CFG 12 exceeds SDXL's stable range (6-8); oversaturation and facial artifacts are direct CFG symptoms |
| 2 | Parameter misconfiguration    | HIGH     | Resolution 768x768 is below SDXL's native training resolution of 1024x1024; face malformation and composition collapse result |
| 3 | Overcrowded prompt / SD 1.5 tag contamination | HIGH | "masterpiece, best quality" (appearing twice), "ultra-detailed, 8K" are SD 1.5 Danbooru training tags with minimal effect on SDXL; they consume token budget without guiding the SDXL encoders |
| 4 | Underspecified composition    | MEDIUM   | No background, environment, location, or setting described; "flat gray blob" background is what SDXL generates when the background is entirely undefined |
| 5 | Conflicting descriptors       | MEDIUM   | "cinematic" implies a scene with environment and narrative context; "bokeh, depth of field" implies shallow focus portrait isolation -- these push against each other |
| 6 | Overcrowded (adjective flood) | MEDIUM   | 6 subjective evaluative adjectives ("beautiful," "stunning," "gorgeous," "amazing," "perfect") describe desired quality, not visual properties; they consume CLIP token budget without adding visual specificity |
| 7 | Negative prompt issues        | LOW      | No negative prompt provided; without at least basic quality and artifact negatives for SDXL, the model has no guidance to exclude common failure patterns |
| 8 | Overcrowded (duplicate term)  | LOW      | "best quality" appears twice in the same prompt; this wastes 2-3 tokens with zero additional benefit |

Severity key: HIGH = primary cause | MEDIUM = contributing factor | LOW = quality improvement

---

### Diagnosis

**Primary failure mode:** CFG 12 on SDXL combined with sub-native resolution (768x768) is causing both the oversaturation and the facial artifacts. The prompt construction issues are compounding these parameter problems but are not the primary cause.

SDXL operates differently from SD 1.5 at the parameter level. SD 1.5 has a relatively stable output up to CFG 14, but SDXL shows clear oversaturation and artifact patterns above CFG 9. At CFG 12, the model is "overcorrecting" on every pixel toward the prompt signal, causing skin tones to oversaturate toward orange-red and fine detail (especially in facial areas with subtle gradients like the eye sockets and lip contours) to become exaggerated and melted-looking. Additionally, SDXL was trained at 1024x1024. Generating at 768x768 creates a resolution mismatch with the internal convolutional layers, which causes the model's composition and anatomy routines to produce output at an incorrect scale -- the most visible symptom of this is face malformation and loss of structural coherence in detailed regions.

The prompt structure adds further problems. The quality booster tags ("masterpiece, best quality, ultra-detailed") are derived from Danbooru-dataset SD 1.5 fine-tuning conventions. SDXL was not trained on Danbooru tags and does not have the same tag-to-training-cluster mapping. These terms consume token budget in SDXL without providing meaningful guidance to either CLIP encoder. The six subjective adjectives ("beautiful woman, stunning face, gorgeous eyes, amazing hair, perfect body") tell SDXL nothing about specific visual properties and activate its general "attractive person" concept without providing the specific physical, lighting, or compositional attributes needed to constrain the output. The undefined background is a direct consequence of zero background specification -- SDXL fills unspecified backgrounds with a neutral gray-to-white gradient by default, which is exactly what the user observed.

---

### Revised Prompt

RAW photo, a woman in her late twenties with sharp cheekbones and dark brown eyes, standing near a large window, soft directional daylight falling from camera left, loose dark hair falling across one shoulder, wearing a simple cream linen blouse, shallow depth of field, background is a soft-focus warm-toned interior with blurred bookshelves, shot on a Sony A7R IV, 85mm f/1.8, natural skin texture, subsurface scattering on skin, photorealistic, cinematic color grade

Model: Stable Diffusion XL (Juggernaut XL) | Parameters: CFG: 7 | Steps: 30 | Sampler: DPM++ 2M Karras | Resolution: 1024x1024

Revised Negative Prompt:
deformed face, asymmetrical eyes, bad anatomy, watermark, signature, oversaturated, plastic skin, doll-like, airbrushed, extra fingers, malformed hands, blurry face, (worst quality:1.2), cartoon, illustration, painted

---

### Changes Made

| # | Original Term or Setting                            | Revised To                                                    | Reason                                                                                                              |
|---|-----------------------------------------------------|---------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| 1 | CFG: 12                                             | CFG: 7                                                        | SDXL's stable range is 6-8; CFG 12 is the primary cause of oversaturation and facial melting on SDXL                |
| 2 | Resolution: 768x768                                 | Resolution: 1024x1024                                         | SDXL native training resolution; sub-native resolution causes facial malformation and composition collapse           |
| 3 | Steps: 40                                           | Steps: 30                                                     | 40 steps on DPM++ 2M Karras with SDXL is diminishing-return territory; 25-30 is optimal                            |
| 4 | "masterpiece, best quality, ultra-detailed, 8K"    | "RAW photo" (kept as SDXL-compatible quality anchor)          | Danbooru tags have minimal effect on SDXL's CLIP encoders; "RAW photo" activates photographic quality concepts in SDXL |
| 5 | "best quality" (duplicate)                          | Removed second instance                                       | Duplicate term wastes 2-3 tokens with zero additional effect                                                        |
| 6 | "beautiful woman, stunning face, gorgeous eyes, amazing hair, perfect body" | "a woman in her late twenties with sharp cheekbones and dark brown eyes" + specific physical attributes | Subjective evaluative adjectives replaced with physical descriptors that provide actual visual constraints           |
| 7 | No background or environment specified              | "standing near a large window... warm-toned interior with blurred bookshelves" | Eliminates the undefined-background default (flat gray); gives SDXL a specific spatial context to render             |
| 8 | "dramatic lighting" (abstract)                      | "soft directional daylight falling from camera left"          | Concrete lighting direction and quality replaces an abstract mood tag; specifies direction, hardness, and color temp |
| 9 | "cinematic, dramatic lighting, bokeh, depth of field" (stacked) | "shallow depth of field, cinematic color grade" (separated)  | Separated the lens effect (depth of field) from the color treatment (cinematic grade); removed redundancy            |
| 10 | No negative prompt                                  | Added targeted negative prompt                                | SDXL without any negative guidance cannot exclude common failure patterns; targeted negatives are more effective than generic mega-negatives |

---

### Model Limitations Noted

The user has not requested any features that are structural model limitations. All identified issues are addressable through the parameter and prompt changes above.

Note: Exact and consistent facial identity across multiple generations is not achievable through prompting alone on any diffusion model. If the user needs repeatable character identity, IP-Adapter with a face reference image or a character LoRA trained on specific face images is required.

---

### If the Revised Prompt Still Fails

1. **If skin still looks oversaturated or plastic:** Add "natural skin imperfections, pores visible, realistic skin texture" to the positive prompt and "(plastic skin:1.1), (airbrushed:1.1)" to the negative. Juggernaut XL has a tendency toward skin smoothing; counteract it with texture-specific positive terms.
2. **If the face still shows structural issues:** Enable Hires.fix in Automatic1111 (or the equivalent upscaler in ComfyUI/InvokeAI) at 1.5x upscale, 0.4 denoising strength. This two-pass approach generates the composition at 1024x1024 then sharpens and corrects detail at 1536x1536, which is where SDXL achieves its highest facial quality.
3. **If the background is still too flat:** Add more specific environmental detail -- describe a specific room type, architectural elements, material textures (e.g., "warm tungsten lamp in the background, wooden bookshelves slightly out of focus, cream-painted walls, afternoon light casting long horizontal shadows"). The background needs as much physical specificity as the subject.

---

### Prevention Tips

- For SDXL specifically: always start at 1024x1024 minimum. Treat 768x768 as incompatible with Juggernaut XL and similar SDXL checkpoints.
- Replace SD 1.5 quality tag clusters ("masterpiece, best quality, ultra-detailed, 8K, highres") with SDXL-appropriate anchors: "RAW photo," "photorealistic," "cinematic color grade," and "professional photography." The Danbooru tag vocabulary does not map to SDXL's training data.
- Set CFG to 7 as your SDXL default and only increase it (maximum 9) if the output is ignoring clear prompt instructions -- not as a general quality booster.
- Replace subjective adjectives ("beautiful," "perfect," "stunning") with physical descriptors at every opportunity. Ask yourself: "if I were directing a photo shoot, what would I actually say to the photographer and subject to produce this image?" Those instructions translate directly to effective SDXL prompts.
- Always specify the background, even briefly. "Undefined background" in a portrait prompt will produce a neutral gray default on SDXL as reliably as leaving a CSS background-color unset produces white.
