---
name: stable-diffusion-prompting
description: |
  Crafts Stable Diffusion SDXL and Flux prompts with positive and negative prompt structure, CFG scale recommendations, sampler selection, resolution settings, and LoRA reference syntax.
  Use when the user asks to create a Stable Diffusion prompt, generate images with SDXL or Flux, write prompts for ComfyUI or Automatic1111, or optimize generation parameters.
  Do NOT use for Midjourney prompting (use midjourney-prompting), DALL-E prompting (use dalle-prompting), or translating prompts between models (use prompt-translation).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-image-generation design template"
  category: "design-creative"
  subcategory: "ai-image-generation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Stable Diffusion Prompting

## When to Use

**Use this skill when:**
- The user asks to create, write, or refine a prompt for Stable Diffusion (SD 1.5, SDXL 1.0, SDXL Turbo, Flux.1 Dev, Flux.1 Schnell, or Flux.1 Pro)
- The user wants to configure generation parameters -- CFG scale, sampler, steps, resolution, seed strategy -- for a specific output goal
- The user is working inside ComfyUI, Automatic1111 (A1111), SD.Next, InvokeAI, or Forge and needs UI-specific syntax or workflow guidance
- The user needs help structuring positive and negative prompts, applying attention weights, or debugging outputs that look wrong (too saturated, anatomically broken, wrong style, missing elements)
- The user wants to apply LoRAs, embeddings (textual inversion), or ControlNet presets within a generation pipeline
- The user is targeting a specific output class -- portrait, landscape, product shot, character sheet, texture map, concept art, architectural visualization -- and needs optimized parameters for that class
- The user wants a batch exploration strategy, an img2img refinement pass, or an upscaling pipeline

**Do NOT use when:**
- The user wants Midjourney-specific prompts or parameter syntax (use `midjourney-prompting` -- Midjourney uses stylize, chaos, and aspect ratio flags, not CFG/sampler/step combinations)
- The user wants DALL-E 3 or GPT-image-1 prompts (use `dalle-prompting` -- those models use natural descriptive paragraphs, not weighted tag chains)
- The user needs to translate a prompt from one model architecture to another without generating from scratch (use `prompt-translation`)
- The user wants to train a LoRA, DreamBooth model, or fine-tune any SD checkpoint (this is software/ML engineering; refer to ML training workflows)
- The user wants to build a ComfyUI workflow graph from scratch (use a ComfyUI workflow design skill -- this skill covers prompt and parameter content, not node graph construction)
- The user is asking about image editing with Photoshop AI features, Adobe Firefly, or Canva AI (different product domains entirely)
- The user's request involves generating sexual content depicting minors or content intended to non-consensually depict real identifiable people -- refuse the request outright

---

## Process

### Step 1: Identify the Target Model and UI

Before writing a single word of prompt, lock down the model family and interface. Prompt structure, parameter ranges, and even which fields exist differ significantly between models.

- **Confirm the model family:**
  - SD 1.5: Legacy 512x512 base, still valid for anime checkpoints (Anything-V5, Deliberate, DreamShaper). Supports textual inversion embeddings and all standard LoRAs.
  - SDXL 1.0 or SDXL 1.0 + Refiner: Native 1024px base. Requires SDXL-trained LoRAs and embeddings. Two-stage pipeline (base generates latent, refiner polishes detail).
  - SDXL Turbo: Distilled, 1-4 steps, CFG 0-2. Not suitable for complex scenes -- best for fast drafts.
  - Flux.1 Dev: Rectified flow transformer, not a U-Net. CFG 3-5. Natural language prompts work better than tag chains. Slower, highest quality.
  - Flux.1 Schnell: Distilled Flux, 4-8 steps, CFG 1-3. Fast drafts, reduced detail.
- **Confirm the UI:**
  - A1111/Forge: Uses `<lora:filename:weight>` syntax inside the positive prompt field. Has a separate negative prompt field. CFG, sampler, steps are sliders/dropdowns.
  - ComfyUI: Prompts live in CLIP Text Encode nodes. LoRAs are separate LoraLoader nodes -- no inline syntax. Flux workflows use FluxGuidance node instead of CFG.
  - InvokeAI: Has a unified prompt field with its own weight syntax `word+` and `word-` notation for emphasis.
- **If the model is unspecified:** Default to SDXL 1.0 for photorealism/concept art requests, and recommend Flux.1 Dev only if the user explicitly wants maximum quality and is willing to wait longer per generation.
- **Check for base checkpoint style:** Generic SDXL base differs from fine-tuned checkpoints like RealVisXL, JuggernautXL, or DreamShaper XL. Style-specific checkpoints change which quality boosters work and which negative terms are needed.

---

### Step 2: Define the Image Goal with Specificity

Generic prompts produce generic images. Extract concrete details before writing.

- **Subject:** Who or what is the primary subject? Push for specificity. "A woman" becomes "a 30-year-old woman with sharp cheekbones, deep-set green eyes, wearing a tailored charcoal blazer." The more tokens devoted to the primary subject, the more the model anchors on it.
- **Setting/environment:** Foreground, midground, background layers if relevant. "In a city" becomes "standing at the edge of a rain-slicked cobblestone street, neon signs reflected in puddles, a blurred crowd in the background."
- **Style and medium:** Separate the rendering style from the subject. Is this oil painting, hyper-realistic photography (35mm, 85mm lens, aperture f/1.8), watercolor, cel-shaded illustration, isometric 3D render, pixel art?
- **Lighting:** Lighting has more impact on mood than most other descriptors. Identify: direction (side light, rim light, overhead, three-point studio), quality (soft diffused, hard directional, volumetric, bioluminescent), and temperature (golden hour warm, moonlit cool, neon purple-cyan).
- **Composition intent:** Is this a close-up portrait, a Dutch angle action shot, a wide establishing shot, an over-the-shoulder perspective? Specify. "Close-up portrait, shallow depth of field" or "wide angle establishing shot, rule of thirds."
- **Color palette:** Dominant hues, saturation, contrast level. "Desaturated with a single accent of crimson" produces very different results than "vibrant jewel tones, deep blacks."
- **Output purpose:** Concept art for a game, a print-ready illustration, a quick draft for client approval, a reference image for further editing in Photoshop. This determines step count, resolution, and how much refinement to plan.

---

### Step 3: Construct the Positive Prompt

Prompt token order matters in SD/SDXL. The model gives more attention weight to early tokens. Front-load what matters most.

**Structural order for SDXL/SD 1.5:**

```
[quality boosters] > [subject + character details] > [action/pose] > [setting/background] > [style/medium] > [lighting] > [color palette] > [composition/camera] > [technical quality]
```

**Quality booster selection by output type:**

| Output Type          | Recommended Quality Boosters                                              |
|----------------------|---------------------------------------------------------------------------|
| Photorealistic       | `masterpiece, best quality, photorealistic, ultra-realistic, sharp focus, 8k uhd, high resolution` |
| Concept art          | `masterpiece, best quality, concept art, highly detailed, trending on artstation, matte painting` |
| Anime/illustration   | `masterpiece, best quality, highres, extremely detailed, beautiful detailed face, vibrant` |
| Product/commercial   | `masterpiece, best quality, product photography, studio lighting, white background, commercial photography` |
| Architecture/interior| `masterpiece, best quality, architectural visualization, photorealistic rendering, unreal engine 5, ambient occlusion` |

**Attention weight syntax (A1111/Forge):**
- `(term:1.3)` -- increases attention by 30%. Use for critical defining elements.
- `(term:0.7)` -- decreases attention by 30%. Use to include a term without letting it dominate.
- `((term))` without a number -- equivalent to approximately 1.21x (1.1 squared). Stacking works multiplicatively.
- Safe operating range: **0.5 to 1.5**. At 1.6+, you will see tiling, burn-in, or haloing artifacts. At below 0.4, the term often disappears from the output entirely.
- Do not over-weight more than 2-3 terms per prompt. Competing high weights cancel each other out and create chaotic outputs.

**InvokeAI emphasis syntax:**
- `word+` adds emphasis. Each `+` adds roughly 0.1 weight.
- `word-` reduces emphasis. Each `-` reduces roughly 0.1 weight.
- Example: `golden hair++` is approximately `(golden hair:1.2)` in A1111 syntax.

**CLIP token limit:** SDXL and SD 1.5 CLIP encoders have a 75-token hard limit per chunk. A1111 automatically chunks beyond 75 tokens but later chunks have slightly less influence. Keep the most important terms in the first 75 tokens. Count roughly: comma-separated tags average 2-3 tokens each. A 25-tag prompt is approximately 60-75 tokens.

**Flux prompting differences:**
- Flux uses a T5 XXL encoder (4096 token context) alongside CLIP-L. It reads full sentences and paragraphs naturally.
- Write Flux prompts as fluent sentences: "A cinematic close-up of a weather-beaten lighthouse keeper standing at the bow of a fishing boat, stormy grey sea behind him, rainwater dripping from the brim of his yellow sou'wester, Rembrandt lighting, photorealistic, shot on 50mm film."
- Tag chains (`masterpiece, best quality, 8k uhd`) are less effective in Flux -- they are trained on image descriptions, not danbooru tags. Natural descriptive language outperforms.
- Flux has much better native text rendering in images than SDXL. If text in the image is needed, Flux is the correct model choice.

---

### Step 4: Construct the Negative Prompt

Negative prompts tell the model what probability space to avoid. They are as important as positive prompts for SDXL and SD 1.5. Note: negative prompts have significantly reduced effect in Flux architectures.

**Universal base negative prompt (SDXL):**
```
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, deformed, ugly, duplicate, morbid, mutilated, extra limbs, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, out of frame
```

**Style-specific additions:**

| Desired Style          | Add These to Negative Prompt                                           |
|------------------------|------------------------------------------------------------------------|
| Photorealistic         | `cartoon, anime, illustration, painting, drawing, rendered, 3d render, cgi` |
| Anime/2D illustration  | `photorealistic, photograph, realistic, 3d render, blurry background`  |
| Clean digital art      | `noise, grain, film grain, dust, scratches, vignette, chromatic aberration` |
| Portrait (face focus)  | `deformed face, asymmetrical eyes, cross-eyed, disfigured face, bad teeth` |
| Landscape/concept art  | `people, person, human, figure` (if you want empty landscapes)         |
| Architecture           | `distorted perspective, impossible geometry, warped walls, melting structure` |

**Textual inversion embeddings for negatives (A1111):**
- `EasyNegative` -- a popular embedding that encodes common defect patterns in a single token, equivalent to 30-40 individual negative terms.
- `FastNegativeV2`, `ng_deepnegative_v1_75t` -- similar negative embeddings targeting anatomy defects.
- Usage: simply include the embedding filename as a token in the negative prompt field: `EasyNegative, lowres, bad anatomy...`
- These only work if the embedding file is installed. Never recommend them without noting they require local installation.

**CFG scale and negative prompt interaction:** At low CFG (3-5), negative prompts have less impact. If you set CFG to 4 and the negative prompt is not working, raising CFG to 7 is often more effective than lengthening the negative prompt.

---

### Step 5: Select and Justify Generation Parameters

Every parameter choice has a specific reason. Document the reasoning, not just the value.

**CFG Scale (Classifier-Free Guidance):**

| CFG Value | Effect                                      | Recommended For                                |
|-----------|---------------------------------------------|------------------------------------------------|
| 1-2       | Nearly unconditioned, dreamlike             | SDXL Turbo, Flux Schnell distilled models      |
| 3-5       | Creative, loose -- model interprets freely  | Flux.1 Dev, abstract art, mood-first work      |
| 5-7       | Balanced (sweet spot for most SDXL work)    | Concept art, portraits, landscapes, general use|
| 7-9       | Strong prompt adherence, reduced creativity | Character sheets, specific compositions         |
| 10-15     | Very literal, colors may over-saturate      | Exact scene reconstruction, technical prompts  |
| 15+       | Artifacts likely, over-contrasty            | Avoid unless intentionally stylized            |

**Sampler selection and performance profile:**

| Sampler              | Optimal Steps | Speed    | Characteristics                                        |
|----------------------|---------------|----------|--------------------------------------------------------|
| DPM++ 2M Karras      | 20-30         | Fast     | Reliable convergence, excellent for general use        |
| DPM++ 2M SDE Karras  | 20-30         | Medium   | Adds stochasticity, better texture and skin detail     |
| DPM++ 3M SDE Karras  | 20-30         | Medium   | Slightly higher quality than 2M SDE, newer            |
| Euler a              | 20-40         | Fast     | Smooth, less noisy, good for landscapes and soft styles |
| Euler                | 20-40         | Fast     | More deterministic than Euler a, good for reproducibility |
| DDIM                 | 30-50         | Medium   | Highly consistent across seeds, best for inpainting   |
| PLMS                 | 30-50         | Medium   | Legacy, similar to DDIM but less sharp                 |
| LCM (Latent Consistency)| 4-8        | Very Fast| Distilled for speed, requires LCM LoRA, reduced quality |
| DPM++ 2S a Karras    | 20-30         | Medium   | Good for portraits with intricate skin texture         |
| Restart              | 20-30         | Slow     | High quality, avoids local minima, worth it for finals |

**Resolution guidelines:**

*SDXL native training resolutions (stay within 1MP total):*

| Aspect Ratio | Resolution      | Use Case                          |
|--------------|-----------------|-----------------------------------|
| 1:1 square   | 1024 x 1024     | Portraits, logos, icons, thumbnails|
| 3:2 landscape| 1216 x 832      | Standard photography, concept art |
| 4:3 landscape| 1152 x 896      | Monitor wallpaper, presentation   |
| 16:9 wide    | 1344 x 768      | Game backgrounds, cinematic       |
| 2:3 portrait | 832 x 1216      | Character art, posters, vertical  |
| 9:16 vertical| 768 x 1344      | Mobile wallpaper, social content  |

Going above 1MP in a single SDXL pass generates repetition artifacts -- the model tiles at high resolution because it was not trained on those sizes. Use SD Upscale or Ultimate SD Upscale for final large resolutions.

*SD 1.5 native resolution:* 512x512 (square) and 512x768 (portrait). Generating at 768x768 works but may show compositing seams. Use highres fix at 1.5-2x scale.

*Flux.1 Dev resolution:* More flexible than SDXL. Can handle up to 1536x1536 natively. Standard recommendations: 1024x1024 for portraits, 1360x768 for widescreen.

**Steps:**

| Quality Tier    | Steps  | Notes                                                    |
|-----------------|--------|----------------------------------------------------------|
| Speed draft     | 10-15  | Fast iteration. Useful for composition testing.          |
| Standard        | 25-30  | Good balance for most outputs.                          |
| Production      | 35-50  | Diminishing returns after 50. Worth it for print quality.|
| Flux.1 Dev      | 20-30  | Flux needs fewer steps than U-Net models.               |
| Flux.1 Schnell  | 4-8    | Distilled -- adding more steps beyond 8 wastes time.    |
| LCM LoRA        | 4-8    | Distilled consistency model, same principle as Schnell. |

**Seed management:**
- Use `-1` (random) for initial batch exploration.
- Once a good composition is found, lock the seed and iterate on the prompt.
- Fixed seed + same prompt = reproducible result. Fixed seed + minor prompt change = controlled variation.
- "Variation seed" (A1111 feature): allows interpolating between two seeds for subtle composition variants without rerolling entirely.

---

### Step 6: Apply LoRAs, Embeddings, and ControlNet (If Applicable)

These extensions modulate the model's behavior in targeted ways. Each has distinct usage patterns.

**LoRA (Low-Rank Adaptation):**

*A1111/Forge inline syntax:*
```
<lora:filename_without_extension:weight>
```
Example: `<lora:add_detail:0.7>, <lora:lighting_style_v3:0.6>`

*ComfyUI:* LoRAs are added as LoraLoader nodes in the graph -- never inline in the text. The node takes the checkpoint, CLIP, and outputs modified versions of both. Stack multiple LoraLoader nodes in series.

*Weight guidelines:*

| Weight Range | Effect                                         |
|--------------|------------------------------------------------|
| 0.3-0.5      | Subtle texture or style suggestion             |
| 0.5-0.7      | Noticeable influence, good for blending styles |
| 0.7-0.9      | Dominant style shaping                        |
| 0.9-1.0      | Full character/style capture                  |
| 1.0+         | Often causes oversaturation, artifacting       |

*Total combined LoRA weight budget:* Keep the sum of all active LoRA weights at or below 1.8. Two LoRAs at 0.8 each (total 1.6) is usually safe. Three at 0.8 each (total 2.4) will likely artifact or merge incoherently.

*Trigger words:* Many LoRAs require a trigger word to activate. Check the LoRA's documentation/model card. A style LoRA for "ohwx woman" style requires the token `ohwx` in the positive prompt. Forgetting trigger words means the LoRA loads but does not activate.

**Textual Inversion (Embeddings):**
- Embeddings encode a concept in a learned token. Usage: simply type the filename as a word in your prompt.
- Positive embedding example: `dreamlikeV1, (subject), ...` -- adds the style encoded in that embedding.
- Negative embedding example: `EasyNegative, lowres, bad anatomy...` -- blocks defects encoded in that embedding.
- Embeddings must be placed in the `embeddings/` folder and loaded by the model's CLIP -- SD 1.5 embeddings do not work in SDXL and vice versa.

**ControlNet:**
- ControlNet conditions generation on a reference image (pose, depth, edges, segmentation).
- Common presets and use cases:
  - `Canny` -- edge map conditioning. Good for preserving hard shapes from a reference.
  - `Depth` (MiDaS or Zoe) -- preserves 3D spatial layout.
  - `OpenPose` -- preserves human body pose from a reference image.
  - `Lineart` -- good for colorizing sketches.
  - `IP-Adapter` -- transfers the style or face from a reference image into the generation.
  - `Tile` -- used for upscaling; adds detail while preserving large structure.
- ControlNet weight: 0.5-0.8 is recommended. At 1.0+, it can override prompt entirely. At below 0.3, it has minimal effect.
- When using ControlNet, reduce the number of weighted terms in the prompt -- ControlNet is handling composition, so the prompt should focus on style, lighting, and color.

---

### Step 7: Build the Refinement and Upscaling Pipeline

A production workflow does not end at first-pass generation. Plan the refinement pipeline.

**SDXL Refiner pass:**
- The SDXL Refiner is a separate checkpoint that polishes the SDXL Base output.
- Workflow: Base generates full denoising from step 0-80% noise level, Refiner takes over for the final 20%.
- In A1111, set the "Refiner" field to the refiner checkpoint and "Switch at" to 0.8.
- Adding more steps to the refiner beyond 20% (0.2) is wasteful -- it processes the clean latent and yields no improvement.

**Highres fix (for SDXL or SD 1.5 output enlargement):**
- `Highres Fix` in A1111 runs the image through an upscaler then does an img2img pass at lower denoising to add detail.
- Upscaler options: `R-ESRGAN 4x+` for photorealistic content, `R-ESRGAN 4x+ Anime6B` for anime, `LDSR` for maximum quality at the cost of extreme time.
- Highres fix denoising strength: 0.35-0.45 for subtle enhancement. 0.5-0.6 starts adding new details. 0.7+ will change the composition.
- Scale factor: 1.5x is safe for composition preservation. 2x introduces more variation.

**Img2img refinement denoising guide:**

| Denoising Strength | Change Level                                              |
|-------------------|----------------------------------------------------------|
| 0.1-0.2           | Minor noise removal, barely visible change               |
| 0.3-0.4           | Texture refinement, maintains composition exactly        |
| 0.4-0.6           | Moderate changes, style shift, element adjustment        |
| 0.6-0.8           | Major changes, new elements may appear, pose may shift   |
| 0.8-1.0           | Near-total regeneration, only vague structure preserved  |

**Tiled upscaling (Ultimate SD Upscale extension):**
- Upscale to 2x or 4x by processing tiles independently.
- Tile size: 512x512 for SD 1.5, 768x768 or 1024x1024 for SDXL.
- Tile overlap: 32-64px to prevent seam lines. At 0 overlap, tile borders are visible.
- Denoising: 0.2-0.35 for photorealism, 0.3-0.45 for illustration (needs more added detail).

---

### Step 8: Compile the Final Generation Specification

Assemble every element into the structured output format. Include rationale for each parameter so the user understands what to adjust when results are imperfect.

- Every parameter must appear in the spec -- never leave CFG, sampler, or resolution unspecified.
- Write the iteration strategy with concrete "if X happens, change Y" logic, not vague guidance.
- If LoRAs were recommended, list trigger words explicitly.
- If the request is for Flux, omit the negative prompt weight note and flag that traditional negative prompts may be ineffective.
- If the output is for ComfyUI, note that LoRA syntax differs and offer to describe the node setup.

---

## Output Format

```markdown
## Stable Diffusion Generation Spec

### Target Configuration
- **Model Family:** [SD 1.5 / SDXL 1.0 / SDXL + Refiner / Flux.1 Dev / Flux.1 Schnell]
- **Base Checkpoint:** [specific checkpoint name if specified, e.g., RealVisXL V4, JuggernautXL, DreamShaper XL]
- **UI/Frontend:** [A1111 / ComfyUI / Forge / InvokeAI / unspecified]

### Generation Parameters
| Parameter      | Value                     | Reason                                                |
|----------------|---------------------------|-------------------------------------------------------|
| Sampler        | [sampler name]            | [1-sentence rationale]                               |
| Steps          | [number]                  | [1-sentence rationale]                               |
| CFG Scale      | [number]                  | [1-sentence rationale]                               |
| Resolution     | [width x height]          | [aspect ratio and MP rationale]                      |
| Seed           | [random / fixed number]   | [exploration vs. locked iteration]                   |
| Batch Size     | [number]                  | [why this many for first pass]                       |

### Positive Prompt
```
[Full positive prompt. Quality boosters first, then subject, setting, style, lighting, color, composition, technical detail. Attention weights applied to key terms. LoRA references inline if A1111.]
```
**Token estimate:** ~[X] tokens ([Y]% of 75-token first chunk)

### Negative Prompt
```
[Full negative prompt. Universal base + style-specific additions. Negative embeddings noted if recommended.]
```
**Note:** [Any model-specific notes, e.g., "Negative prompt has reduced effect in Flux.1 Dev -- raise CFG to 4-5 if unwanted elements persist"]

### LoRAs and Embeddings
| Name                 | Type       | Weight | Trigger Word    | Purpose                             |
|----------------------|------------|--------|-----------------|-------------------------------------|
| [lora_filename]      | LoRA       | [0.X]  | [word or none]  | [what style/character it contributes]|
| [embedding_name]     | TI Embed   | N/A    | [token name]    | [positive or negative role]         |

### Refinement Pipeline
- **Pass 1:** [Base generation at listed parameters]
- **Pass 2 (if applicable):** [Refiner, Highres Fix, or img2img -- specify denoising strength and purpose]
- **Upscale (if applicable):** [Upscaler name, scale factor, tile size, denoising strength]

### Iteration Strategy
| Result Issue                     | Adjustment                                                          |
|----------------------------------|---------------------------------------------------------------------|
| [specific visual problem, e.g., "lighting too flat"]  | [specific parameter or prompt change, e.g., "add (rim lighting:1.3), raise CFG by 1"] |
| [second issue]                   | [second adjustment]                                                 |
| [third issue]                    | [third adjustment]                                                  |

### Prompt Variants
1. **[Variant name]:** Change [specific terms] to [specific alternatives]. Adjust [parameter] from [X] to [Y]. Expected effect: [description].
2. **[Variant name]:** Change [specific terms] to [specific alternatives]. Expected effect: [description].
```

---

## Rules

1. **Front-load the positive prompt for SD 1.5 and SDXL.** CLIP tokenization gives higher attention weight to early tokens. Quality boosters and the primary subject must appear before the 25th token. Moving "masterpiece, best quality" to the end of a 40-tag prompt measurably degrades output quality.

2. **Never omit the negative prompt for SDXL or SD 1.5.** Even a minimal negative prompt ("lowres, bad anatomy, worst quality, low quality") significantly improves hand, face, and composition quality. The model's training distribution includes these defect patterns and needs explicit guidance to avoid them. The only exception is Flux, where negative prompts have reduced architectural effect.

3. **Never exceed 1MP resolution in a single SDXL generation pass without highres fix.** SDXL was trained on ~1MP images. At 1536x1024 (1.57MP) with no highres fix, expect visible tiling artifacts where the model repeats sub-regions. Use highres fix or Ultimate SD Upscale for larger outputs.

4. **Attention weights must stay between 0.5 and 1.5.** Values below 0.5 often vanish from the output. Values above 1.5 cause burn-in, haloing, and color contamination. Never suggest `(term:2.0)` or higher. If something is not appearing at 1.3, investigate token placement (move it earlier) or add it to the negative prompt as an "avoid the opposite" technique rather than raising weight further.

5. **Match LoRAs to the correct base model architecture.** SD 1.5 LoRAs loaded into SDXL will cause errors or produce nonsense outputs. SDXL LoRAs loaded into SD 1.5 similarly fail. Flux requires Flux-specific adapters (often packaged differently than standard LoRAs). Always confirm LoRA-to-base-model compatibility.

6. **Specify trigger words for every LoRA recommendation.** A LoRA that requires "ohwx" or "sks style" as a trigger token will not activate without it. Generic style LoRAs may work without triggers, but character and concept LoRAs almost always require them. Note "check model card for trigger word" when unknown.

7. **Total combined LoRA weight must not exceed 1.8.** When multiple LoRAs are stacked, their effects compound. Two strong LoRAs at 0.9 each (1.8 total) push the model's attention distribution to its limits. Adding a third at even 0.5 (total 2.3) typically produces merged, incoherent features. For style-blending with 3+ LoRAs, reduce each to 0.4-0.5.

8. **CFG scale must be model-family-specific.** SDXL sweet spot is 5-8. SD 1.5 fine-tuned checkpoints often prefer 4-7 (they are more sensitive than base). Flux.1 Dev works at 3-5 and artifacts above 6. Flux.1 Schnell and SDXL Turbo should use CFG 1-2 (they are distilled models where higher CFG opposes the distillation). Specifying CFG 7 for Flux Schnell will produce overcontrasted, degraded outputs.

9. **Provide concrete, conditional iteration guidance -- not generic advice.** Instead of "adjust the prompt if results are not good," specify: "If the face is deformed, add `(perfect facial features:1.2), beautiful eyes` to the positive prompt and `asymmetrical face, distorted face` to the negative. If those don't resolve, reduce CFG by 1 or switch sampler from DPM++ 2M to DPM++ SDE Karras." Generic iteration advice leaves the user stuck.

10. **Distinguish A1111 syntax from ComfyUI syntax explicitly.** LoRA inline syntax (`<lora:name:weight>`) works in A1111 and Forge but not in ComfyUI -- ComfyUI users need a LoraLoader node description instead. InvokeAI uses its own `term+` emphasis notation. Giving A1111 syntax to a ComfyUI user wastes their time and causes confusion. Always confirm or ask about the UI.

---

## Edge Cases

### Flux.1 Dev and Flux.1 Schnell: Different Architecture, Different Rules
Flux uses a Rectified Flow Diffusion Transformer, not a U-Net. Several standard SD assumptions break:
- Write natural language sentences, not danbooru tag chains. "A determined female astronaut in a worn spacesuit walking across a red Martian desert, dramatic low sun behind her, long shadow, photorealistic, cinematic" outperforms the equivalent tag list.
- Negative prompts have minimal effect due to architecture. If unwanted content appears in Flux, your only tools are: reword the positive prompt to explicitly exclude the element ("empty background, no people, devoid of any human figures"), or raise CFG by 0.5-1 increments.
- Flux uses a FluxGuidance node in ComfyUI instead of the standard CFG slider. In A1111/Forge Flux integrations, the CFG slider maps to guidance scale but may behave differently than SDXL.
- Schnell is a distilled 4-step model. Running it at 20 steps wastes compute and may introduce artifacts from over-denoising an already-converged latent.
- Flux has significantly better native prompt adherence and text rendering than SDXL -- complex multi-element scenes are handled more coherently. Use Flux when the user needs text visible in the image.

### Inpainting: Preserving Structure While Changing Targeted Regions
- Use DDIM or Euler for inpainting -- stochastic samplers (DPM++ SDE) introduce too much variation in the unmasked region.
- Mask padding: 16-32px. Zero padding leaves hard edges at mask borders. Excessive padding bleeds into surrounding areas.
- Denoising strength for inpainting: 0.4-0.6 for element addition (adding an object that wasn't there), 0.2-0.35 for color/texture changes (changing a blue shirt to red), 0.7-0.85 for complete region replacement.
- For face restoration specifically: run ADetailer extension (A1111) rather than manual inpainting. It auto-detects and inpaints faces with a dedicated face-fix model.
- Inpainting prompt: include the full original scene context, not just what you want in the masked area. The model needs context from the unmasked region to blend correctly.

### Anatomical Defects (Bad Hands, Deformed Faces, Extra Limbs)
This is the most common complaint from intermediate users. Systematic approach:
- Hands: Add to positive prompt `(beautiful hands:1.2), (perfect fingers:1.2), detailed fingers`. Add to negative `extra fingers, missing fingers, fused fingers, bad hands, deformed hands`. If still failing, use ControlNet OpenPose with a reference hand pose, or use ADetailer with a hand-specific model.
- Faces: Use `(beautiful detailed face:1.2), (perfect facial features:1.2)` in positive. Add `asymmetrical eyes, crossed eyes, deformed face, ugly face, disfigured face` to negative. For portraits, set resolution to portrait ratio (832x1216 for SDXL) so the face occupies the center of the frame and gets full resolution attention.
- Extra limbs: A symptom of compositing multiple people or complex action poses. Solutions: simplify the scene to one subject, use ControlNet OpenPose to constrain body structure, or use ADetailer for targeted correction.
- If defects persist despite prompt changes: lower CFG by 1 (less literal following allows the model more freedom to correct), or switch from DPM++ 2M to DPM++ SDE Karras (the stochastic component helps escape anatomy failure modes).

### Character Consistency Across Multiple Generations
SD models do not natively maintain character consistency between separate generations. Production workflows use:
- **IP-Adapter + Face ID:** Takes a reference face image and conditions future generations to maintain that face. Requires IP-Adapter Face ID extension. Weight 0.7-0.85 for strong face consistency.
- **Character LoRA:** If you have a custom-trained character LoRA (from DreamBooth or LyCORIS training), this is the most reliable method. Requires having the training data and running a training job.
- **Consistent seed with slight prompt variation:** Locking the seed and making small prompt changes produces similar compositions but is not true consistency -- clothing, background, lighting will vary.
- **ControlNet Reference:** Reference mode conditions the generation on color and style from a reference image without strict pose copying. Useful for style consistency, less reliable for face consistency.
- Inform users that perfect character consistency without IP-Adapter or a trained LoRA is not achievable with prompting alone.

### Very Long or Complex Scene Prompts (Token Overflow)
When a prompt requires more than 75 tokens (approximately 30-35 comma-separated tags), plan the token budget intentionally:
- The first CLIP chunk (tokens 1-75) has full attention weight. Prioritize: quality boosters + primary subject + most critical style elements.
- The second chunk (tokens 76-150) carries approximately 80% of the first chunk's influence in practice.
- Third chunk and beyond: noticeably reduced influence. These are best for optional flavor details.
- If a term is essential but falls in chunk 2 or 3: duplicate it in chunk 1 at reduced weight or restructure the prompt to move it earlier.
- A1111 allows "BREAK" keyword to force a new attention context: `subject description, BREAK, background description, BREAK, style terms`. This prevents long background descriptions from diluting subject attention.

### Batch Exploration vs. Production Generation Strategy
Users often treat all generations the same way, wasting significant compute on unnecessary high-step, high-resolution runs before they have found a good composition:
- **Stage 1 -- Composition exploration:** 512x512 (or 768x768), 15-20 steps, CFG 6, batch of 8, random seeds. Goal: identify 1-2 seed/composition pairs worth developing.
- **Stage 2 -- Quality confirmation:** Winning seed at full SDXL resolution (1024x1024 or target aspect ratio), 30 steps, refine prompt based on Stage 1 observations. Generate 2-4 images.
- **Stage 3 -- Production pass:** 35-45 steps, SDXL Refiner pass, Highres Fix at 1.5x with 0.35 denoising. Single or double generation only.
- **Stage 4 -- Post-processing:** Export to img2img at very low denoising (0.15-0.2) for minor touch-ups, or to external tools for face/hand correction.
- Recommend this staged pipeline whenever the user asks for a "high quality" or "production-ready" image. Attempting Stage 3 without Stage 1-2 typically wastes 5-10 generations discovering composition issues.

### Style Clashing Between Base Checkpoint and LoRAs
Fine-tuned checkpoints have strong internal style biases. Loading a LoRA trained on a different style creates competition:
- Example: Loading an anime-style LoRA at 0.8 into RealVisXL (a photorealistic checkpoint) will produce a confused hybrid with neither style executing well.
- Resolution: Either lower the LoRA weight to 0.4-0.5 for subtle influence, or match the checkpoint to the LoRA's training base (use an anime checkpoint with an anime LoRA).
- The same principle applies to ControlNet -- using a depth map from a photorealistic scene as conditioning in an anime-focused workflow produces geometric distortions.
- When checkpoint style and LoRA style conflict strongly, the checkpoint usually "wins" at low LoRA weights. Raise the LoRA weight until the desired style emerges, watching for artifacts.

---

## Example

**Input:** "I need an SDXL prompt for a cinematic portrait of a fictional samurai warrior woman. She should look battle-worn, intense, rain-soaked. I'm using Automatic1111 with a realistic SDXL checkpoint (RealVisXL V4). I want it as close to a film still as possible. High quality output."

**Output:**

---

## Stable Diffusion Generation Spec

### Target Configuration
- **Model Family:** SDXL 1.0
- **Base Checkpoint:** RealVisXL V4 (photorealistic fine-tune -- skews toward cinematic realism, prefers moderate CFG)
- **UI/Frontend:** Automatic1111

### Generation Parameters
| Parameter    | Value             | Reason                                                                          |
|--------------|-------------------|---------------------------------------------------------------------------------|
| Sampler      | DPM++ 2M SDE Karras | Stochastic variant adds micro-texture to skin and rain detail that 2M Karras can miss |
| Steps        | 35                | RealVisXL benefits from slightly higher steps for skin and fabric detail; 30 is minimum, 35 hits the quality plateau |
| CFG Scale    | 6.5               | RealVisXL is a fine-tuned checkpoint -- slightly below standard SDXL CFG of 7 to avoid color over-saturation from the tuned model |
| Resolution   | 832 x 1216        | 2:3 portrait orientation keeps the face large and well-resolved within SDXL's 1MP budget (1.01MP) |
| Seed         | Random (-1)       | First pass batch of 4 to identify best facial composition; lock seed for refinement |
| Batch Size   | 4                 | Enough variation to find a compelling pose and lighting angle without wasting compute |

### Positive Prompt
```
masterpiece, best quality, photorealistic, ultra-realistic, (cinematic film still:1.2), (RAW photo, shot on 85mm lens, f/1.8 aperture:1.1), 1woman, japanese female samurai warrior, late 20s, sharp determined eyes, weathered face with a small scar on her cheek, soaking wet hair plastered to face, battle-worn lamellar armor with dents and scratches, katana held at her side, rain pouring down, standing in a ruined feudal japanese village at night, dramatic (rim lighting:1.3), (cold blue and amber color contrast:1.2), backlit by fire in the distance, steam rising from wet ground, intense cinematic atmosphere, shallow depth of field, foreground rain bokeh, (highly detailed face:1.2), ultra-detailed skin texture, (gritty realistic:1.1)
```
**Token estimate:** ~68 tokens (approximately 90% of first 75-token CLIP chunk -- all critical terms are within the first chunk)

### Negative Prompt
```
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, deformed, ugly, duplicate, morbid, mutilated, extra limbs, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, cartoon, anime, illustration, painting, drawing, cgi, 3d render, plastic skin, smooth skin, over-processed, digital art style, symmetrical lighting, flat lighting, overexposed, underexposed, cheerful expression, smiling, clean armor, pristine armor, fantasy armor, western armor, plate armor
```

**Note:** Negative terms include style exclusions (`cartoon, anime, cgi`) and subject-specific exclusions (`smiling, clean armor, pristine armor`) to keep the battle-worn tone. `western armor` and `plate armor` are excluded to prevent SDXL from defaulting to European knight aesthetics.

### LoRAs and Embeddings
| Name              | Type       | Weight | Trigger Word  | Purpose                                                   |
|-------------------|------------|--------|---------------|-----------------------------------------------------------|
| None required     | --         | --     | --            | RealVisXL V4 handles cinematic photorealism without LoRA for this subject |
| *(Optional)* add_detail | LoRA | 0.5    | none          | Generic detail enhancer; adds micro-texture to skin and fabric if base result lacks fine detail |
| *(Optional)* FilmVelvia | LoRA | 0.4    | none          | Adds cinematic film grain and color grading resembling high-ASA film stock -- use if the image feels too clean/digital |

*If adding LoRAs, combined weight is 0.9 -- well within the safe threshold.*

### Refinement Pipeline
- **Pass 1:** Base SDXL generation at listed parameters. Review batch of 4 for: correct facial intensity and scar detail, rain visibility, rim lighting angle, and armor wear detail. Select best seed.
- **Pass 2 -- SDXL Refiner:** Load SDXL Refiner checkpoint in A1111's Refiner field. Set "Switch at" to 0.8 (refiner handles final 20% of denoising). This sharpens rain droplet detail and skin texture that the base model leaves slightly soft. Keep same seed and prompt.
- **Pass 3 -- Highres Fix:** Enable Highres Fix at 1.5x scale (832x1216 → 1248x1824), R-ESRGAN 4x+ upscaler, denoising strength 0.4. This adds fine rain streak detail and armor texture at higher resolution. Denoising at 0.4 is intentional -- slightly above typical to add rain and fabric micro-detail.
- **Pass 4 (Optional) -- ADetailer:** Run ADetailer face detection pass with `(determined eyes:1.2), (sharp detailed eyes:1.2), scar on cheek, wet face, rain drops on skin` in the ADetailer prompt. Denoising 0.35. This corrects any remaining facial softness without regenerating the composition.

### Iteration Strategy
| Result Issue                                          | Adjustment                                                                                                  |
|-------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| Armor looks too fantasy/clean                         | Add `(battle damage:1.3), (scratched armor:1.2), (dented metal:1.2)` to positive. Add `pristine, ornate decorative armor, embossed` to negative. |
| Lighting is flat, no rim light visible                | Increase `(rim lighting:1.5)` in positive. Add `(backlit:1.2), (strong directional light:1.1)`. Lower CFG by 0.5 to give model more compositional freedom. |
| Face looks generic rather than intensely determined   | Add `(clenched jaw:1.2), (fierce gaze:1.3), (narrowed eyes:1.1)` to positive. Add `gentle expression, relaxed face, soft eyes` to negative. Run ADetailer pass. |
| Rain is not visible enough                            | Add `(heavy rain, visible rain streaks:1.3), (rain drops on armor surface:1.2)` to positive. Switch sampler to DPM++ 3M SDE Karras -- the additional stochasticity helps with dynamic elements like rain. |
| Image looks too digital, not filmic                   | Add the FilmVelvia LoRA at 0.4 weight. Add `(film grain:1.1), (analog photography:1.1)` to positive. Add `digital art, clean render, oversaturated` to negative. |
| Scar on cheek is missing from output                  | Move `(small scar on her cheek:1.3)` to appear in the first 30 tokens of the positive prompt (before the armor and environment description). It is being pushed out of the primary attention window. |

### Prompt Variants

1. **Daytime version -- post-battle in smoke:** Replace `night` with `smoky daylight after battle, ash falling like snow`. Change `cold blue and amber color contrast` to `(warm sepia tones:1.1), dusty atmosphere`. Adjust CFG to 7 (daylight scenes need more prompt adherence for bright highlights).

2. **Extreme close-up portrait -- face only:** Change resolution to 1024x1024 (square, more resolution budget on the face). Remove environment and background details from the positive prompt. Add `extreme close-up portrait, face fills frame, tight crop`. Add ControlNet Tile at weight 0.6 pointed at a seed from Variant 1 to lock facial features while regenerating at higher fidelity.

3. **Combat action shot -- full body:** Change resolution to 1344x768 (16:9, more horizontal space for motion). Add `(dynamic action pose:1.2), (katana raised overhead:1.1), (rain spray from sword impact:1.2), full body shot, wide angle`. Raise CFG to 7.5 (full-body action needs stronger prompt adherence to maintain correct anatomy and weapon position). Add `(correct anatomy:1.2)` to positive and strengthen negative with `deformed body, incorrect proportions, extra limbs`.
