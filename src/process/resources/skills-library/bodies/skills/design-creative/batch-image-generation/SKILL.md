---
name: batch-image-generation
description: |
  Produces batch image generation strategies with prompt templates using variable placeholders, seed management for consistent series, parameter variation approaches, and output organization systems.
  Use when the user asks to generate multiple images from a template, create image variations systematically, batch-produce AI art, or organize a large generation workflow.
  Do NOT use for single-image prompting (use model-specific skills), character consistency (use midjourney-consistency), or prompt debugging (use ai-image-prompt-debugging).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-image-generation automation template"
  category: "design-creative"
  subcategory: "ai-image-generation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Batch Image Generation

## When to Use

**Use this skill when:**
- The user needs to produce 5 or more related images from a shared structural template, where some elements change and others stay constant across the series
- The user wants to systematically vary one or more dimensions (subject, color, background, mood, style, composition angle, time of day, season) while keeping the rest of the prompt locked
- The user is building a product catalog, social media content calendar, character expression sheet, background variation set, or concept exploration grid
- The user needs a reproducible, documented workflow so they can regenerate, adjust, or extend the batch later without rebuilding it from memory
- The user wants to run parameter sweeps to find optimal settings (CFG scale, stylize, chaos, step count, guidance scale) before committing to a full production run
- The user is managing a multi-model batch where different image types are routed to the model best suited for them
- The user needs output naming conventions, folder structures, and metadata systems to keep 20-100+ images organized and traceable
- The user wants to create "families" of images -- visually cohesive series like seasonal variants, color palette explorations, or mood board expansions

**Do NOT use when:**
- The user needs a single, highly specific image -- use the model-specific prompting skill instead (Midjourney, DALL-E, Stable Diffusion, or Flux as appropriate)
- The user's primary challenge is maintaining a consistent character, face, or personality across images -- use `midjourney-consistency` which covers `--cref`, `--sref`, and identity-locking techniques
- The user has a prompt that is producing wrong results and needs diagnostic help -- use `ai-image-prompt-debugging` to fix the underlying prompt before batching it
- The user wants to upscale, enhance, or process already-generated images -- use `ai-image-upscaling` or `ai-image-post-processing`
- The user wants a curated set of wildly different, unrelated images -- batch generation assumes structural relationships between images in the series; unrelated images don't benefit from a shared template
- The user is asking about Stable Diffusion LoRA training or fine-tuning on a custom dataset -- that is a model training task, not a generation batch task

---

## Process

### Step 1: Define the Batch Scope and Classify the Batch Type

Before writing a single prompt, identify which batch archetype the user's request falls into. Each has different structural requirements.

- **Variation batch:** One subject, multiple treatments. Example: the same product in 6 colorways, or the same character in 8 moods. The subject is always the constant; the treatment is the variable.
- **Combination batch (cross-product):** Two or more variables combined exhaustively or selectively. Example: 4 characters x 3 settings = 12 images. Warning -- three variables with 5 options each = 125 images; always recommend curation over full cross-product beyond 30 combinations.
- **Series batch:** A sequential set that tells a story or progresses through states. Example: 12 images of a landscape through seasons, or a product launch sequence. Order matters and should be documented.
- **Parameter exploration batch:** Same prompt, different model settings. Used to find the sweet spot before committing. Typically 4-16 images. Output is a comparison grid, not a final deliverable.
- **Content calendar batch:** A larger production run (20-60 images) organized by theme, week, or campaign phase. Requires sub-template structure -- one master template plus 3-5 sub-templates.

Ask the user:
- How many total images are needed?
- What changes between images? List every varying dimension explicitly.
- What must stay identical across all images? (camera angle, lighting style, aspect ratio, artistic style, model version)
- Which AI model(s) will be used? (This determines seed behavior, parameter syntax, and workflow tooling)
- Is this a draft run for ideation or a production run for publishing?
- What is the output resolution and aspect ratio requirement?

### Step 2: Build the Prompt Template with Typed Placeholders

A batch prompt template is a reusable structure where every variable element is replaced with a typed placeholder. "Typed" means the placeholder name describes what kind of value fills it, not just a generic `{VAR1}`.

**Template structure anatomy:**
```
[SUBJECT_DESCRIPTION], [SUBJECT_ATTRIBUTE], [ENVIRONMENT], [LIGHTING], [CAMERA_DETAILS], [ARTISTIC_STYLE], [QUALITY_BOOSTERS] [MODEL_PARAMETERS]
```

**Placeholder typing convention:**
- `{COLOR:matte_white|ocean_blue|terracotta_red}` -- pipe-separated list of valid values
- `{SETTING:studio|outdoor|lifestyle}` -- categorical choice
- `{MOOD:serene|dramatic|playful}` -- qualitative dimension
- `{ANGLE:front-45deg|overhead|three-quarter}` -- specific technical value
- `{SEASON:spring|summer|autumn|winter}` -- discrete enumeration

**Constant-locking rules for the template:**
- Lock the camera angle in text, not just in parameters. "45-degree angle, slightly elevated" is more reliable than assuming the model will default to it.
- Lock lighting in specific terms: "soft diffused studio lighting from camera-left" rather than "good lighting."
- Lock style era and rendering engine for Stable Diffusion: always specify the model checkpoint name in the workflow, not just in the prompt.
- For Midjourney, lock `--v`, `--ar`, `--style`, and `--s` as constants in the template. These must not vary unless the variable is intentional.
- Write negative prompts as constants and append them identically to every generated prompt. A negative prompt that differs between images is an uncontrolled variable.

**Template validation test:** Substitute two different variable values manually and read both full prompts aloud. If anything other than the intended variable sounds different, the template has a hidden variable. Fix it.

### Step 3: Build the Variation Matrix

The variation matrix is the operational heart of the batch plan. It is a complete enumeration of every image to be generated, with its variable values, full prompt, seed assignment, and output filename.

**For a single-variable batch (simplest case):**

| # | Variable: Color | Full Prompt | Seed | Output Filename |
|---|----------------|-------------|------|----------------|
| 1 | matte white | [full text] | 1001 | batch_white_1001.png |
| 2 | ocean blue | [full text] | 1001 | batch_blue_1001.png |

**For a two-variable cross-product batch:**
Generate all combinations systematically. For 4 colors x 3 backgrounds = 12 rows. Always sort the matrix so the slower-changing variable is in the outer loop (colors) and the faster-changing variable is in the inner loop (backgrounds). This makes the matrix easier to review and makes regeneration requests easier to handle.

**For a curated selection from a large combination space:**
- State the full possible combination count explicitly: "4 subjects x 5 moods x 3 styles = 60 possible images."
- Present the recommended curated selection (20-25 images) with justification for which combinations were excluded.
- Common curation rules: exclude redundant combinations (blue/cold and blue/melancholy overlap), exclude low-value combinations (abstract style defeats product photography purpose), prioritize combinations that serve the stated use case.
- Always offer to generate the full matrix if the user wants it, but note the time and cost implications.

**Matrix size thresholds:**
- 1-15 images: Full cross-product is always fine
- 16-30 images: Full cross-product acceptable, recommend reviewing before upscaling
- 31-60 images: Recommend curated selection or sub-batching in groups of 15-20
- 60+ images: Mandatory sub-batching; recommend API/automation tooling; draft-then-select workflow required

### Step 4: Define the Seed Management Strategy

Seed behavior differs fundamentally between models. Applying the wrong seed strategy produces incoherent batches or wasted generations.

**Midjourney seed behavior:**
- Seeds in Midjourney influence the noise initialization, which affects overall composition and subject placement, not fine pixel detail.
- Same seed + same prompt = highly similar result (but not pixel-identical). The seed is a strong composition anchor.
- Same seed + different variable value = similar layout with the variable change applied. This is the core mechanism for comparable batches.
- Retrieve a seed by reacting to any Midjourney image with the envelope emoji (✉️) -- the bot DMs you the seed.
- Seed ranges in Midjourney: any integer from 0 to 4294967295. For batch work, use memorable anchors: 1000, 1001, 2000, etc.
- To generate controlled composition variations within one variable value: use seed, seed+1, seed+2. The increment of 1 produces a similar-but-not-identical composition.
- To generate dramatically different compositions: use seeds spaced 1000 apart.

**Stable Diffusion / Flux seed behavior:**
- In SD and Flux, the seed is deterministic -- same seed + same prompt + same parameters = identical pixel output. This is the most reliable seed system.
- For a variation batch: use the same seed across all variable changes to maximize compositional comparability.
- For a diversity batch where you want variety: use sequential seeds (1000, 1001, 1002) or use the batch count feature in A1111/ComfyUI which auto-increments seeds.
- In ComfyUI, use the "increment" seed mode for batch nodes. In A1111, enable "Increment seed by 1 each batch" in settings.
- When using ControlNet poses or depth maps as constants, the seed matters less for composition (ControlNet overrides it) but still affects texture, color, and fine detail.

**DALL-E 3 and GPT-image-1 seed behavior:**
- No user-exposed seed control. Each generation is stochastic.
- Mitigation strategy: Generate 3-4 versions of each prompt variation and select the best per variation. This is the "de facto batch" for DALL-E.
- Consistency across a DALL-E batch relies entirely on the constant text quality. Make constants extremely specific.
- For critical product/brand work, DALL-E batches require human curation at every step -- do not plan automated pipelines around DALL-E.

**Seed documentation rule:** Every batch plan must explicitly state the seed strategy in the output, even if the strategy is "random with manual curation." Undocumented seeds make batches impossible to reproduce.

### Step 5: Define Parameter Variation Strategy and Conduct Pre-Batch Test

Never run a full batch on untested parameters. A 5% quality improvement in parameter tuning saves 95% regeneration time on a 30-image batch.

**Pre-batch parameter sweep protocol:**
1. Select 2-3 representative prompts from the matrix -- choose ones that span the range of your variables (e.g., the lightest color + simplest background, and the most complex variable combination).
2. Run a parameter sweep on only those 2-3 prompts before committing to the full batch.
3. Document which parameter value wins and lock it as a constant for the full batch.

**Key parameter sweeps by model:**

*Stable Diffusion / Flux:*
- **CFG Scale sweep:** 4, 6, 7.5, 10, 12. Values below 6 often produce washed-out, incoherent results. Values above 10 often introduce artifacts and over-saturation. Sweet spot is typically 6.5-8 for photorealistic subjects, 7-9 for illustrated styles.
- **Step count sweep:** 20, 30, 40 steps. Beyond 40 steps, quality improvement is minimal but generation time doubles. 25-30 is the practical sweet spot for most models.
- **Sampler sweep:** DPM++ 2M Karras vs. Euler a vs. DPM++ SDE Karras. DPM++ 2M Karras is the most consistent for batch work (deterministic across seeds). Euler a introduces more variation between generations.
- **Denoising strength (for img2img batches):** 0.4-0.5 preserves original composition, 0.6-0.75 allows significant variation, above 0.8 is nearly equivalent to txt2img.

*Midjourney:*
- **Stylize sweep:** `--s 0`, `--s 100`, `--s 250`, `--s 500`. Low stylize values (0-100) produce more literal, less aesthetically "polished" interpretations. Values of 250-500 add Midjourney's trained aesthetic sense. For product photography, use 0-100. For artistic work, 250-750.
- **Chaos sweep:** `--chaos 0`, `--chaos 20`, `--chaos 50`. Chaos 0 produces the most predictable, repeatable compositions -- ideal for product batches. Chaos above 30 introduces significant compositional variation -- useful for ideation batches, bad for catalog batches.
- **Quality sweep:** `--q 0.5` vs. `--q 1` vs. `--q 2`. For draft/test runs, use `--q 0.5` (50% of standard GPU time). For production, always `--q 1` minimum. `--q 2` rarely produces visible improvement sufficient to justify the 2x generation time.

**Parameter budget discipline:** Pick ONE parameter axis to sweep per pre-batch test. Testing CFG, steps, and sampler simultaneously produces uninterpretable results. Vary one parameter at a time, hold all others constant.

### Step 6: Define Output Organization System

Without a systematic output organization, batches beyond 20 images become unmanageable. File names like `grid_0023.png` and `upscaled_final_v3.png` destroy any hope of reproducibility.

**Naming convention structure:**
```
{batch-id}_{variable1}_{variable2}_{seed}_{version}.{format}
```
- `batch-id`: A short, meaningful project code. `mug-catalog`, `hero-banners-q1`, `char-moods`
- Variable values: Shortened but human-readable. `wht` for white, `stu` for studio, `drm` for dramatic
- `seed`: The exact seed number used
- `version`: `d1` for draft 1, `s1` for selected iteration 1, `up` for upscaled
- Format: Always `.png` for AI outputs (lossless; avoids JPEG compression artifacts in intermediate files)

**Examples of good file names:**
- `mug-catalog_terracotta_studio_1001_d1.png`
- `hero-banners_summer_bold_2400_s1.png`
- `char-moods_happy_forest_1000_up.png`

**Folder structure for batches under 30 images:**
```
{batch-id}/
  00_brief/        # Prompt template, variable list, parameter settings, this plan
  01_drafts/       # All first-pass generations, unselected
  02_selected/     # Best version per combination, chosen from drafts
  03_upscaled/     # Upscaled/enhanced final versions
  04_exports/      # Final deliverable formats (resized, color-corrected, platform-specific)
  metadata.csv     # One row per image: filename, full_prompt, seed, parameters, selected_flag, notes
```

**Folder structure for batches 30-100 images (sub-batch organization):**
```
{batch-id}/
  00_brief/
  sub-batch-01_{theme}/
    01_drafts/
    02_selected/
  sub-batch-02_{theme}/
    01_drafts/
    02_selected/
  03_upscaled_all/
  04_exports/
  metadata.csv
```

**Metadata CSV schema (minimum required columns):**
```
image_id, batch_id, variable_1_name, variable_1_value, variable_2_name, variable_2_value, seed, model, model_version, full_prompt, negative_prompt, cfg_scale, steps, sampler, ar, generation_timestamp, selected, upscaled, notes
```

This CSV is the batch's reproducibility record. If someone needs to regenerate image #7 in six months, the CSV contains everything needed.

### Step 7: Define the Workflow Sequence and Compile the Full Plan

Assemble the workflow into a concrete, ordered sequence with decision gates.

**Standard 5-phase workflow:**

Phase 1 -- Template validation (1-4 test images):
- Generate 2-3 representative images from the matrix using draft quality settings
- Verify that the constant elements are truly constant (same angle, same lighting behavior, same style rendering)
- Identify any prompt language that produces inconsistent behavior and fix the template
- Do not proceed to full batch until template validation passes

Phase 2 -- Parameter sweep (4-16 test images):
- Run the parameter sweep on the validated template
- Select winning parameters and lock them as constants
- Document the winning values in the batch plan

Phase 3 -- Full batch generation (all images):
- Generate all images in the variation matrix
- For Midjourney: generate one image per prompt (not a grid of 4) using `--no` to skip the grid and speed selection -- use the `/imagine` command with `--q 1 --s [locked value]`
- For SD/Flux/ComfyUI: use batch processing nodes with the pre-configured seed management
- Log every generation to the metadata CSV in real time, not after the fact

Phase 4 -- Selection and quality gate:
- Review all drafts and flag the best result per variation combination
- If any combination has no acceptable result: regenerate that specific combination with a new seed (document the seed change in the CSV)
- Target: at least one usable image per matrix row before proceeding to upscaling

Phase 5 -- Upscaling and export:
- Upscale only selected images, never the full draft set
- For Midjourney: use "Upscale (Subtle)" for 2x with minimal change; "Upscale (Creative)" only for artistic images where enhancement is acceptable
- For SD: use the SD Hi-Res Fix (2x, denoising 0.4-0.5) or Ultimate SD Upscale in A1111
- Export to platform-required formats and dimensions after upscaling

---

## Output Format

```markdown
## Batch Generation Plan: {Batch Name}

### Overview
| Field | Value |
|-------|-------|
| Batch ID | {short-code} |
| Total images | {n} ({breakdown: e.g., 4 colors x 3 backgrounds}) |
| Batch type | {variation / combination / series / parameter-exploration / content-calendar} |
| Target model | {model name and version} |
| Quality tier | {draft / production} |
| Estimated generation time | {time per image} x {n images} = {total} (excluding review) |
| Estimated fast-pass server cost | {if API-based, estimate token/image cost} |

---

### Prompt Template

**Template (copy this, substitute placeholders):**
```
{CONSTANT_SUBJECT_DESCRIPTION}, {COLOR:value1|value2|value3}, {ENVIRONMENT:value1|value2|value3}, {LIGHTING}, {CAMERA_DETAILS}, {STYLE}, {QUALITY_TERMS} {MODEL_PARAMETERS}
```

**Negative prompt (constant, copy identically to all prompts):**
```
{negative prompt text}
```

**Constants (must appear word-for-word in every generated prompt):**
- Subject core description: "{exact constant text}"
- Lighting: "{exact constant text}"
- Camera angle: "{exact constant text}"
- Style/rendering: "{exact constant text}"

**Variables:**
| Variable Name | Placeholder | Value Options |
|---------------|-------------|---------------|
| {Name} | {PLACEHOLDER} | {val1}, {val2}, {val3} |
| {Name} | {PLACEHOLDER} | {val1}, {val2}, {val3} |

---

### Variation Matrix

| # | {Variable 1} | {Variable 2} | Seed | Full Prompt | Output Filename |
|---|-------------|-------------|------|-------------|----------------|
| 1 | {value} | {value} | {seed} | {full prompt text} | {filename}.png |
| 2 | {value} | {value} | {seed} | {full prompt text} | {filename}.png |
| ... | | | | | |

**Total combinations:** {n}
**Excluded combinations (if curated):** {list excluded combos and reason}

---

### Seed Strategy
- **Seed management approach:** {identical seed / incrementing / random-with-curation}
- **Base seed:** {number or "random"}
- **Seed increment rule:** {e.g., "same seed for all variations" / "seed+1 per composition variant within same variable"}
- **Rationale:** {why this seed approach serves this batch's goals}
- **Regeneration rule:** {if a draft fails, change seed by +100 and document new seed in CSV}

---

### Locked Parameter Settings

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| {parameter} | {value} | {specific reason this value serves this batch} |
| {parameter} | {value} | {specific reason} |

**Pre-batch parameter sweep:**
- **Sweep axis:** {which parameter to test before full batch}
- **Test values:** {list the 3-5 values to test}
- **Test images:** Use rows #{n} and #{n} from the matrix as test prompts
- **Decision rule:** {how to select the winner from the sweep}

---

### Output Organization

**Naming convention:** `{batch-id}_{var1-short}_{var2-short}_{seed}_{version}.png`

**Folder structure:**
```
{batch-id}/
  00_brief/
  01_drafts/
  02_selected/
  03_upscaled/
  04_exports/
  metadata.csv
```

**Metadata CSV columns:**
`image_id, variable_1_value, variable_2_value, seed, full_prompt, negative_prompt, {model_params}, generation_timestamp, selected, upscaled, notes`

---

### Workflow Sequence
1. **Template validation** -- Generate images #{n} and #{n}, verify constants behave correctly
2. **Parameter sweep** -- Test {parameter} at {values}, select winner
3. **Full batch generation** -- Generate all {n} images with locked settings, log to CSV
4. **Selection pass** -- Review all drafts, flag best per variation; regenerate any failed rows with seed +100
5. **Upscaling** -- Upscale selected images only using {upscale method}
6. **Export** -- Deliver in {format/dimensions} to {destination}

---

### Reproduction Checklist
- [ ] Full prompt template documented
- [ ] All variable values enumerated
- [ ] All seeds recorded in metadata CSV
- [ ] All parameter settings documented
- [ ] Folder structure created before generation begins
- [ ] Metadata CSV headers created before generation begins
```

---

## Rules

1. **Never write individual prompts from scratch.** Always derive every prompt by substituting values into the validated template. Any prompt written independently of the template introduces hidden variables and breaks batch coherence.

2. **Constants must be lexically identical.** Copy-paste the constant portions, do not retype them. "Soft studio lighting from camera-left" and "soft studio lighting, camera-left" are different -- model tokenization may treat them differently, producing subtle inconsistencies across a batch.

3. **Cross-product batches over 30 images require explicit curation justification.** When the full matrix would produce more than 30 images, present the curated selection and explain why each excluded combination was dropped. Do not silently reduce the matrix without noting what was removed.

4. **Conduct a parameter sweep before any batch over 10 images.** The 4-8 test images required for a sweep are always cheaper than regenerating 15 images because the CFG was too high. This rule has no exception for "simple" batches.

5. **Seed strategy must be model-specific and documented.** Using a seed management approach designed for Stable Diffusion on a Midjourney batch (or vice versa) produces misleading expectations. State the model's specific seed behavior in the plan and adjust the strategy accordingly.

6. **DALL-E batches must account for stochastic output with 2-3 generations per variation.** Any DALL-E batch plan that assumes one generation per variation row is planning to fail. Budget 2-3 generations per row and include a mandatory selection step.

7. **Do not upscale until a selection pass is complete.** Upscaling costs real time and, in API contexts, real money. The selection pass is non-negotiable before upscaling, regardless of batch size.

8. **Every output file must be named according to the batch naming convention before delivery.** Delivering files named `grid_0043.png` from a batch plan is a failure of the plan. The naming convention must be applied to every file in the deliverable.

9. **Metadata CSV must be created before generation begins, not after.** An after-the-fact CSV built from memory is unreliable. Create the CSV headers at planning time, fill in each row at generation time.

10. **Combination batches require an outer-loop/inner-loop sort order in the matrix.** Sort by the slower-changing variable first (outer loop) and faster-changing variable second (inner loop). This makes the matrix readable, makes regeneration requests easy to locate, and produces a natural review order.

11. **Aspect ratio must be locked as a constant and documented.** An AR change between images in the same batch is a structural break -- all downstream uses (web layout, print layout, presentation decks) depend on consistent image dimensions. If multiple ARs are needed, treat each AR as a separate sub-batch.

12. **For batches over 20 images, always recommend a draft/select/upscale workflow -- never suggest generating at maximum quality for all images in the first pass.** Draft quality (lower step count, `--q 0.5` in Midjourney) reduces generation time by 40-60% for the discovery phase where most images will be rejected.

---

## Edge Cases

### Product catalog with appearance-consistent subject (same object, different backgrounds)
The product's appearance must remain identical across all images -- color, shape, finish, proportions. Background is the only variable. The challenge is that even with the same seed and prompt, AI models will alter product details between generations.

**Handling approach:**
- For Midjourney: Generate the best single product image first. Then use `--cref {image_url}` (character reference) with `--cw 100` to lock the product appearance as a constant visual anchor while changing the background description as the variable. Note that `--cref` is Midjourney v6.0+ only.
- For Stable Diffusion: Use ControlNet with a reference image. The Tile or Reference controlnet modes preserve appearance details. Set controlnet weight to 0.7-0.85 -- lower weights allow too much deviation, higher weights can distort the background.
- For DALL-E 3: Product consistency is structurally difficult. Recommend using DALL-E to generate background environments separately, then compositing the product via traditional photo editing. Document this hybrid approach in the batch plan.
- Always generate the "hero" product image (typically white studio background) first. That image becomes the reference for all subsequent variations.

### Very large batch (60-200 images) requiring automation
Manual generation at this scale is not viable -- at 2 minutes per image, 100 images = 3+ hours of manual interface work.

**Handling approach:**
- Recommend Stable Diffusion with the A1111 API or ComfyUI with an automation workflow. Both support programmatic prompt injection via JSON.
- For Midjourney at scale: The Midjourney API (available at API tier) supports batch submission. Alternatively, tools that interface with Midjourney's Discord API can automate submissions.
- For DALL-E 3 / GPT-image-1: OpenAI's image generation API supports programmatic batching. Build the prompt list as a JSON array and iterate with rate limiting (default: 50 requests/minute on Tier 1, 500/minute on Tier 3).
- The variation matrix must be exported as a CSV or JSON before automation begins -- the automation tool reads variable values from the file, not from manual input.
- For ComfyUI automation: Use the "Image Batch" node combined with a "Prompt from Text File" node. Seed management is handled by the "Increment" seed mode.
- Build in a 10-15% regeneration buffer in time estimates. Automated batches always produce some failed or low-quality outputs that need manual regeneration.

### Batch for multiple output platforms requiring different aspect ratios
A social media content batch may need the same image concept in 1:1 (Instagram grid), 9:16 (Instagram Stories/TikTok), and 16:9 (YouTube/Twitter). These cannot be treated as the same image at different crops -- composition must be designed for each ratio.

**Handling approach:**
- Treat each aspect ratio as a separate sub-batch with its own composition template. The 9:16 vertical template must place the subject in the lower-center third to leave headroom. The 16:9 horizontal template must center or rule-of-thirds the subject horizontally.
- For Midjourney, generate each AR variant separately: `--ar 1:1`, `--ar 9:16`, `--ar 16:9`. Use the same seed for all three AR variants of the same content -- Midjourney will adapt the composition to the ratio while maintaining thematic consistency.
- Document the sub-batch structure: `{batch-id}_1x1/`, `{batch-id}_9x16/`, `{batch-id}_16x9/`. Name the sub-batches consistently.
- Estimate generation count correctly: if the core batch has 20 concept images and 3 platform formats, the true batch size is 60 images.
- For SD/Flux: generate at native model resolution (typically 1024x1024 for SDXL), then use outpainting/canvas extension to create the 9:16 and 16:9 variants. This is more efficient than generating three separate batches.

### Style consistency across a batch when artistic style is a constant
Describing an artistic style in text is inherently ambiguous -- "impressionist oil painting" can produce dramatically different styles between images. In a batch, style drift between images is a common failure mode.

**Handling approach:**
- For Stable Diffusion: Use a style LoRA as the style constant. Apply the same LoRA at the same weight (typically 0.7-0.9) to every image in the batch. The LoRA enforces style consistency far more reliably than text description alone.
- For Midjourney: Generate one strong style reference image first using only the style description (no subject variable). Use that image as `--sref {url}` for the entire batch. `--sw` (style weight) of 50-100 provides good style adherence without overriding subject content.
- For both models: include a style-consistency check image -- an image from a previous approved batch -- at the start of each generation session. If the new images' style matches the check image, the style is consistent. If not, the model version may have updated or settings drifted.
- Never rely on style text alone for production batches. Always use a visual reference anchor.

### Iterative batch: User wants to extend or modify an existing completed batch
The user completed a 20-image batch last month and now wants to add 8 more images using the same template, or wants to re-run 5 specific images with a style change.

**Handling approach:**
- Locate the original batch's `metadata.csv` and `00_brief/` folder. The prompt template, seeds, and parameters must come from the original documented plan, not from memory.
- For an extension: add new matrix rows to the existing CSV. New images should follow the existing naming convention, incrementing the image_id from where the original batch ended.
- For a style modification re-run: create a new sub-batch folder alongside the original (`01_drafts_v2/`) rather than overwriting originals. The original drafts are the reference baseline.
- If the original batch was not properly documented (no CSV, no template file), begin the session with a "batch reconstruction" step -- derive the template from the existing images' apparent constants before generating new images.
- Seed carryover: if the original batch used seed 1001 and that seed produced good compositions, use the same seed for extensions. If extending with new variable values not in the original matrix, document the seed as "carried from original batch" in the CSV.

### Mixed-quality batch (some images excellent, some unusable) after full generation
After running a 24-image batch, 18 are excellent and 6 are unusable (wrong composition, style drift, model glitch).

**Handling approach:**
- Do not regenerate the entire batch. Identify only the failed rows in the matrix and document them with a "FAILED" flag in the metadata CSV.
- For each failed row: change the seed by +100 from the original (e.g., seed 1001 failed -- try seed 1101). Keep all other parameters identical. This isolates the regeneration to seed variation only.
- If seed change does not fix the issue: examine the failed prompts for a pattern. If all 6 failures share a common variable value, the issue is likely a problematic variable term that needs refinement. Return to Step 2 to modify that specific variable's text options.
- If failures are random (no pattern): the batch quality is acceptable. 18/24 (75%) usable rate is typical for complex AI generation batches. Flag the 18 selected images and proceed to upscaling.
- Never accept a batch with less than 60% usable rate without investigating root cause. A 40% failure rate indicates a structural prompt problem, not random model variation.

### Character expression or emotion variation batch (same character, different moods)
Maintaining character appearance across a mood variation batch is the hardest consistency challenge in batch generation.

**Handling approach:**
- This edge case borders on the `midjourney-consistency` skill territory. If the character's appearance is the primary constraint and the batch structure is secondary, redirect to `midjourney-consistency`.
- If the batch structure is primary (systematic mood matrix, organized output, large count), stay within this skill and apply these specific techniques:
- For Midjourney: Use `--cref {character_reference_url} --cw 80-100` to anchor appearance. Use mood as the text variable. Run the seed-comparison test: same seed, different mood text. If appearance drift is significant, lower the chaos parameter to 0 and ensure `--style raw` is active.
- For SD: Use an IP-Adapter with the character reference image at 0.7-0.85 weight, combined with a face DetailerFix to maintain facial consistency. The emotion is driven by the text prompt; the IP-Adapter holds appearance.
- For any model: generate a "neutral expression" reference image first. This is the visual anchor for the entire batch. Include it in the `00_brief/` folder as `character_reference.png`.

---

## Example

**Input:** "I need to create a set of 16 lifestyle images for a candle brand. We have 4 scent collections (Coastal Breeze, Alpine Forest, Warm Vanilla, Midnight Jasmine), and we want to show each collection in 4 different lifestyle settings that match its mood. These are for Instagram -- 1:1 format. Using Midjourney v6.1."

**Output:**

## Batch Generation Plan: Candle Brand Lifestyle Shoot

### Overview
| Field | Value |
|-------|-------|
| Batch ID | `candle-lifestyle-ig` |
| Total images | 16 (4 collections x 4 settings) |
| Batch type | Combination batch (cross-product, 2 variables) |
| Target model | Midjourney v6.1 |
| Quality tier | Production |
| Estimated generation time | ~2.5 min per image x 16 = ~40 minutes (generation only) + 20 min review and selection |
| Platform | Instagram feed (1:1) |

---

### Prompt Template

**Template:**
```
a glass pillar candle with {SCENT_COLOR} wax, {LIFESTYLE_SETTING}, soft warm candlelight glowing, product lifestyle photography, 45-degree camera angle, depth of field with sharp candle focus, cozy atmosphere, natural textures, film grain, muted tones, editorial magazine quality --ar 1:1 --v 6.1 --style raw --s 150 --q 1 --no text, watermark, label, logo, harsh shadows, overexposed
```

**Negative prompt (constant, appended to every prompt via `--no`):**
```
text, watermark, label, logo, harsh shadows, overexposed
```

**Constants:**
- Subject core: "a glass pillar candle"
- Camera: "45-degree camera angle, depth of field with sharp candle focus"
- Lighting: "soft warm candlelight glowing"
- Style: "product lifestyle photography, cozy atmosphere, natural textures, film grain, muted tones, editorial magazine quality"
- Parameters: `--ar 1:1 --v 6.1 --style raw --s 150 --q 1`

**Variables:**
| Variable Name | Placeholder | Value Options |
|---------------|-------------|---------------|
| Candle wax color | `{SCENT_COLOR}` | pale seafoam green, deep forest green, warm ivory cream, deep midnight purple |
| Lifestyle setting | `{LIFESTYLE_SETTING}` | (see matrix -- 4 setting descriptions, each matched to the scent collection) |

**Note on setting variable:** The lifestyle settings are curated per collection, not interchangeable. Coastal Breeze settings evoke ocean environments; Alpine Forest settings evoke woodland environments; etc. The combination matrix is intentional, not cross-product.

---

### Variation Matrix

| # | Collection | Scent Color | Lifestyle Setting | Seed | Full Prompt | Output Filename |
|---|------------|-------------|-------------------|------|-------------|----------------|
| 1 | Coastal Breeze | pale seafoam green wax | on a weathered driftwood shelf with sea glass and linen towels, ocean breeze cottage interior | 2200 | a glass pillar candle with pale seafoam green wax, on a weathered driftwood shelf with sea glass and linen towels, ocean breeze cottage interior, soft warm candlelight glowing, product lifestyle photography, 45-degree camera angle, depth of field with sharp candle focus, cozy atmosphere, natural textures, film grain, muted tones, editorial magazine quality --ar 1:1 --v 6.1 --style raw --s 150 --q 1 --no text, watermark, label, logo, harsh shadows, overexposed | candle-lifestyle-ig_coastal_driftwood_2200_d1.png |
| 2 | Coastal Breeze | pale seafoam green wax | beside an open window with sheer curtains and ocean view blur in background | 2200 | a glass pillar candle with pale seafoam green wax, beside an open window with sheer curtains and ocean view blur in background, soft warm candlelight glowing... [full prompt] | candle-lifestyle-ig_coastal_window_2200_d1.png |
| 3 | Coastal Breeze | pale seafoam green wax | on a sandy bathroom shelf with rolled white towels and pebbles | 2200 | [full prompt] | candle-lifestyle-ig_coastal_bathroom_2200_d1.png |
| 4 | Coastal Breeze | pale seafoam green wax | on a bleached wooden dining table with eucalyptus stems and white ceramic dishes | 2200 | [full prompt] | candle-lifestyle-ig_coastal_dining_2200_d1.png |
| 5 | Alpine Forest | deep forest green wax | on a rustic pine table with pine cones, dried herbs, and woven wool throw | 2200 | [full prompt] | candle-lifestyle-ig_alpine_pine-table_2200_d1.png |
| 6 | Alpine Forest | deep forest green wax | in a cozy reading nook with leather-bound books and a plaid wool blanket | 2200 | [full prompt] | candle-lifestyle-ig_alpine_reading-nook_2200_d1.png |
| 7 | Alpine Forest | deep forest green wax | on a stone hearth beside a crackling fireplace with birch logs | 2200 | [full prompt] | candle-lifestyle-ig_alpine_hearth_2200_d1.png |
| 8 | Alpine Forest | deep forest green wax | on a wooden windowsill with frost on the glass and snow-covered pines in the background blur | 2200 | [full prompt] | candle-lifestyle-ig_alpine_frosty-window_2200_d1.png |
| 9 | Warm Vanilla | warm ivory cream wax | on a marble kitchen counter with scattered vanilla beans and cinnamon sticks | 2200 | [full prompt] | candle-lifestyle-ig_vanilla_kitchen_2200_d1.png |
| 10 | Warm Vanilla | warm ivory cream wax | on a linen tablecloth with a slice of cake and golden cutlery | 2200 | [full prompt] | candle-lifestyle-ig_vanilla_table-setting_2200_d1.png |
| 11 | Warm Vanilla | warm ivory cream wax | beside a warm bath with rose petals and a folded robe in soft terracotta tones | 2200 | [full prompt] | candle-lifestyle-ig_vanilla_bath_2200_d1.png |
| 12 | Warm Vanilla | warm ivory cream wax | on a bedside table with cream linen bedding and a cup of tea in soft morning light | 2200 | [full prompt] | candle-lifestyle-ig_vanilla_bedside_2200_d1.png |
| 13 | Midnight Jasmine | deep midnight purple wax | on a velvet side table with scattered jasmine blossoms and a silk scarf | 2200 | [full prompt] | candle-lifestyle-ig_jasmine_velvet_2200_d1.png |
| 14 | Midnight Jasmine | deep midnight purple wax | in a dim bedroom with dark linen pillows and a crescent moon visible through a window | 2200 | [full prompt] | candle-lifestyle-ig_jasmine_bedroom_2200_d1.png |
| 15 | Midnight Jasmine | deep midnight purple wax | on a brass tray with dried botanicals and dark moody tiles in background | 2200 | [full prompt] | candle-lifestyle-ig_jasmine_brass-tray_2200_d1.png |
| 16 | Midnight Jasmine | deep midnight purple wax | on a stone balcony railing at night with city lights bokeh in the background blur | 2200 | [full prompt] | candle-lifestyle-ig_jasmine_balcony_2200_d1.png |

**Total combinations:** 16 (intentional curation -- settings are matched to collections, not cross-product)
**Excluded combinations:** Coastal Breeze + fireplace hearth (mismatched mood), Alpine Forest + bathtub (mismatched context), etc. Settings were designed to match each collection's emotional territory.

---

### Seed Strategy
- **Seed management approach:** Identical seed (2200) across all 16 images
- **Base seed:** 2200
- **Seed increment rule:** Same seed for all 16 to maximize compositional consistency -- all candles will have similar scale, placement, and depth-of-field behavior across the batch
- **Rationale:** Product images must feel like they belong to the same brand shoot. Consistent seed enforces consistent "photographer's eye." The variable environment text is sufficient to drive the setting change while the seed keeps the candle's presence stable.
- **Regeneration rule:** If a specific image fails (wrong composition, candle not prominent), regenerate that row with seed 2300 (increment by +100). Document new seed in metadata CSV.

---

### Locked Parameter Settings

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `--ar` | `1:1` | Instagram feed square format -- all 16 images must be square for grid cohesion |
| `--v` | `6.1` | Most current stable version; strong product photography rendering |
| `--style` | `raw` | Prevents Midjourney from adding unwanted artistic embellishment to product images |
| `--s` | `150` | Moderate stylize -- enough aesthetic polish for brand quality, not so high that product literalism is lost |
| `--q` | `1` | Full quality for production assets |
| `--no` | `text, watermark, label, logo, harsh shadows, overexposed` | Prevents common product photography failures |

**Pre-batch parameter sweep:**
- **Sweep axis:** `--s` (stylize)
- **Test values:** `--s 0`, `--s 100`, `--s 250`, `--s 500`
- **Test images:** Use rows #1 (Coastal/driftwood) and #13 (Jasmine/velvet) -- these represent the lightest and darkest color palettes in the batch
- **Decision rule:** Select the stylize value that produces the most realistic product photography aesthetic with visible film grain and natural light. Expected winner is `--s 100-250`. If `--s 0` is most realistic, use that. Lock the winner before running all 16.

---

### Output Organization

**Naming convention:** `candle-lifestyle-ig_{collection-short}_{setting-short}_{seed}_{version}.png`
- Collection short codes: `coastal`, `alpine`, `vanilla`, `jasmine`
- Setting short codes: `driftwood`, `window`, `bathroom`, `dining`, `pine-table`, `reading-nook`, `hearth`, `frosty-window`, `kitchen`, `table-setting`, `bath`, `bedside`, `velvet`, `bedroom`, `brass-tray`, `balcony`

**Folder structure:**
```
candle-lifestyle-ig/
  00_brief/
    batch-plan.md          # This document
    prompt-template.txt    # Template and variable list
    character_reference/   # (empty for this batch -- no cref used)
  01_drafts/               # All 16 first-pass generations
  02_selected/             # Best version per collection-setting combination
  03_upscaled/             # Midjourney "Upscale (Subtle)" versions of all 16 selected
  04_exports/              # Final 1080x1080px PNG files ready for Instagram
  metadata.csv
```

**Metadata CSV columns:**
```
image_id, collection, setting, seed, full_prompt, negative_prompt, ar, version, stylize, quality, style_mode, generation_timestamp, selected, upscaled, notes
```

---

### Workflow Sequence

1. **Pre-batch parameter sweep** -- Generate 8 test images (rows #1 and #13, at `--s 0/100/250/500`). Select winning stylize value. Time: ~20 minutes.

2. **Template validation** -- Verify that the constant text is producing consistent candle scale, angle, and lighting behavior across the two test images. If the Coastal Breeze image looks like a different "photographer" than the Midnight Jasmine image, tighten the constant text (add more specific lighting and angle language).

3. **Full batch generation** -- Generate all 16 images with locked settings. Generate collection-by-collection (all 4 Coastal first, then all 4 Alpine, etc.) to make review easier. Log each image to metadata.csv immediately after generation.

4. **Selection pass** -- Review all 16 drafts. Flag the best generation per row. Note: each row was generated only once, so if a row's result is unusable, regenerate with seed 2300 before proceeding. Target: 16/16 selected.

5. **Upscaling** -- Apply "Upscale (Subtle)" in Midjourney to all 16 selected images. Time: ~2x generation time = ~40 minutes.

6. **Export** -- Download all upscaled PNGs. Resize to 1080x1080px if needed (Midjourney 1:1 at default quality outputs at ~1024x1024 -- verify resolution meets Instagram's 1080px recommendation). Place in `04_exports/`. Deliver to brand team with metadata CSV.

---

### Reproduction Checklist
- [ ] Full prompt template documented in `00_brief/prompt-template.txt`
- [ ] All 16 variable value combinations enumerated in variation matrix
- [ ] All seeds recorded in metadata.csv at generation time
- [ ] All parameter settings documented (ar, version, style, stylize, quality, no)
- [ ] Folder structure created before generation begins
- [ ] Metadata CSV headers created before generation begins
- [ ] Pre-batch parameter sweep completed and winning `--s` value locked
- [ ] Template validation completed before full batch run
