---
name: prompt-translation
description: |
  Translates AI image generation prompts between Midjourney, DALL-E, and Stable Diffusion by mapping source structure to target syntax, identifying direct transfers, and noting model-specific alternatives.
  Use when the user asks to convert a prompt from one AI model to another, adapt a Midjourney prompt for Stable Diffusion, or translate between prompt formats.
  Do NOT use for creating prompts from scratch (use model-specific skills), debugging a single-model prompt (use ai-image-prompt-debugging), or style analysis (use ai-image-style-transfer).
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
# Prompt Translation

## When to Use

**Use this skill when:**
- The user provides an explicit prompt and asks to convert it from one AI image model to another (e.g., "convert this Midjourney prompt to Stable Diffusion")
- The user has a working prompt in one model and wants to achieve the same visual result using a different model they have access to
- The user asks how specific syntax elements from one model would be expressed in another model's format
- The user wants to run A/B comparisons of the same concept across multiple models and needs each prompt in native format
- The user has received a prompt from someone else written for a different model than what they are using
- The user explicitly asks for a multi-model version of a single concept, wanting a Midjourney version, SD version, and DALL-E version simultaneously
- The user asks what the equivalent of a specific parameter or technique is in another model

**Do NOT use when:**
- The user wants to create a new prompt from scratch -- use a model-specific prompting skill instead
- The user has a prompt that is not producing good results in its native model -- use `ai-image-prompt-debugging` first, then translate once the source prompt is working
- The user wants to reproduce a specific visual style or artist aesthetic across models -- use `ai-image-style-transfer` which handles style analysis separately from syntax translation
- The user wants to maintain character consistency within a single model across multiple generations -- use `midjourney-consistency` or an SD-specific character consistency skill
- The user is asking about model capabilities in the abstract (e.g., "which model is better for photorealism?") -- this is a model comparison question, not a translation task
- The source prompt is completely broken or produces garbage output -- translation of a broken prompt produces a broken translated prompt; fix the source first
- The user only has a reference image and wants to generate a prompt from it -- use an image-to-prompt reverse-engineering skill

---

## Process

### Step 1: Gather the Translation Requirements

Before translating, collect all necessary information:

- **Source prompt text:** Request the exact, complete prompt including all parameters, weights, and special syntax. Partial prompts produce incomplete translations.
- **Source model and version:** The model version matters significantly. Midjourney v5.2 vs v6.1 have different default aesthetics and parameter behavior. SD 1.5 vs SDXL vs SD3 have fundamentally different architectures that affect prompt sensitivity. DALL-E 2 vs DALL-E 3 process language very differently.
- **Target model and version:** Confirm whether the user is targeting SDXL, SD 1.5, SD3, ComfyUI with a specific checkpoint, or a fine-tuned model. The checkpoint matters for SD translations because fine-tuned models respond to different trigger words.
- **Priority intent:** Ask whether the user prioritizes (a) matching the visual output as closely as possible, or (b) adapting the concept for the target model's specific strengths. This determines how liberally to translate.
- **Available tools:** For SD targets, ask if the user has LoRA models, ControlNet, or IP-Adapter available. This determines how to handle non-transferable features like `--cref` or `--sref`.

If the source model is ambiguous, look for syntax clues: double colons `::` and double-dash parameters `--` indicate Midjourney; parenthetical weights `(term:1.2)` and separate negative prompt fields indicate Stable Diffusion; natural-language sentences without special syntax indicate DALL-E.

### Step 2: Parse the Source Prompt Into Semantic Components

Decompose the source prompt systematically. Do not begin translation until every component is catalogued.

**For Midjourney prompts, extract:**
- Primary subject and action (what is shown and what is happening)
- Setting and environment (location, time of day, weather, spatial context)
- Style directives (artistic medium, genre, era, aesthetic references like "blade runner atmosphere")
- Lighting descriptors (cinematic lighting, golden hour, neon, volumetric)
- Camera and lens terms (shot type like "close-up", lens focal length, film stock, depth of field)
- Color palette directives (muted tones, high contrast, specific color names)
- Parameters block: parse each `--param value` pair individually
- Multi-prompt segments: if `::` weights appear, list each segment and its numeric weight separately
- Exclusions from `--no`: treat each comma-separated term as a distinct exclusion

**For Stable Diffusion prompts, extract:**
- Positive prompt: separate quality booster tokens from content tokens. Quality boosters are terms like `masterpiece, best quality, 8k, ultra detailed` that have no meaning in other models
- Negative prompt: all tokens, noting which are quality-related (e.g., `worst quality, lowres`) vs. content-based (e.g., `cars, text`)
- Parenthetical weights: `(term:1.4)` -- note the term and the weight value separately
- Square bracket de-emphasis: `[term]` reduces weight to approximately 0.9 of normal
- BREAK tokens: each segment between BREAK markers is processed by a separate CLIP pass
- LoRA references: `<lora:filename:weight>` -- note the visual effect the LoRA achieves, not just the name
- Model-level settings: CFG scale, sampler name, step count, resolution, seed
- VAE specification if present: `vae:filename`

**For DALL-E prompts, extract:**
- The complete natural-language description as discrete conceptual units
- Embedded exclusions phrased as negations ("without any text", "not photorealistic")
- Style and medium references phrased as sentences
- Any implicit quality or rendering instructions embedded in sentence structure
- Size/format selection if specified in the API call (1024x1024, 1792x1024, 1024x1792)

**For Flux prompts, extract:**
- Flux responds best to natural-language descriptions closer to DALL-E than SD
- Flux does not use quality booster tokens -- these are counterproductive
- Note any LoRA references in Flux format (`<lora:name:weight>` in some implementations)
- T5 encoder context: Flux processes up to 256 tokens vs. CLIP's 77-token limit, so longer detailed prompts behave differently

### Step 3: Identify the Transfer Class of Each Component

Before writing the translation, classify every extracted component into one of three transfer classes:

**Direct Transfer** -- The concept translates 1:1 with minimal change to wording:
- Subject description, named objects, people, animals -- these work the same across all models
- Setting descriptions with standard vocabulary
- Basic color references
- Named art movements with broad cultural recognition (Impressionism, Art Deco, Bauhaus)
- Film references used as atmospheric shorthand (Blade Runner, Wes Anderson palette)

**Adapted Transfer** -- The concept must be expressed differently but the result should be close:
- Quality and detail level (each model has its own vocabulary for this)
- Aspect ratio (each model uses a different format)
- Stylization level (MJ's `--s` parameter, SD's CFG scale, DALL-E's adjectives all control a similar continuum)
- Negative content (phrased naturally in DALL-E, as a separate field in SD, as `--no` in MJ)
- Camera and technical photography terms (mostly direct, but some terms work better in some models)

**Approximate Transfer** -- No clean equivalent exists; the best-effort attempt will produce a related but different result:
- `--cref` (MJ character reference) -- no equivalent in DALL-E; SD approximates with IP-Adapter or ControlNet reference mode
- `--sref` (MJ style reference) -- no equivalent in DALL-E; SD approximates with style LoRA or img2img
- LoRA references (SD) -- no equivalent in MJ or DALL-E; must describe the visual effect in text
- `--chaos` (MJ randomness control) -- no equivalent; can suggest seeding strategies in SD
- `--style raw` (MJ) -- reduces MJ's aesthetic interpretation; no equivalent in DALL-E, partially approximated in SD via lower CFG
- DALL-E's text-in-image rendering -- far superior to SD/MJ; cannot be matched

**Non-Transferable** -- Feature is model-exclusive with no meaningful equivalent:
- MJ `--tile` (seamless tile generation) -- DALL-E has no equivalent; SD handles this with tiling settings outside the prompt
- SD LoRA activation keywords for very specific fine-tuned models -- no conceptual equivalent; must describe the visual output
- DALL-E's safety revision transparency -- a DALL-E behavioral feature, not a prompt feature
- MJ `--iw` (image weight in image prompting) -- no prompt-level equivalent in DALL-E or base SD

### Step 4: Apply the Model-to-Model Translation Matrix

Use these translation rules for each model pair:

**Midjourney -> Stable Diffusion:**

| MJ Element | SD Translation | Notes |
|---|---|---|
| Descriptive text | Keep core tags, remove connective prose | "a woman standing in a forest" becomes "woman, forest, standing" |
| `--ar 16:9` | Resolution 1344x768 (SDXL) or 768x432 (SD1.5) | SD uses pixel dimensions, not ratios |
| `--ar 2:3` | Resolution 832x1216 (SDXL) or 512x768 (SD1.5) | Stay close to native training resolutions |
| `--ar 1:1` | Resolution 1024x1024 (SDXL) or 512x512 (SD1.5) | SD1.5 native resolution is 512x512 |
| `--ar 4:3` | Resolution 1152x896 (SDXL) | |
| `--ar 3:2` | Resolution 1216x832 (SDXL) | |
| `--v 6.1` | SDXL 1.0 checkpoint | Most comparable output quality |
| `--v 5.2` | SDXL 1.0 or Juggernaut XL | |
| `--style raw` | Lower CFG (5.0-6.5), avoid quality boosters | raw mode suppresses MJ's aesthetic processing |
| `--s 0-100` | CFG 5-6 | Low stylize = more literal = lower CFG |
| `--s 100-300` | CFG 7 | Moderate stylize = balanced |
| `--s 300-1000` | CFG 8-10 | High stylize = more model influence = higher CFG |
| `--q 0.5` | Steps 15-20 | Low quality setting |
| `--q 1` | Steps 25-30 | Standard quality |
| `--q 2` | Steps 35-50 | High quality (diminishing returns above 50) |
| `--chaos N` | Vary seed; no direct parameter | Suggest generating 4+ variants |
| `--no [terms]` | Negative prompt: [terms] + standard quality negatives | Always add standard SD quality negatives |
| `--seed N` | Seed field: N | Direct transfer |
| `--cref [url]` | IP-Adapter or ControlNet reference | Non-prompt method; note for user |
| `--sref [url]` | Style LoRA or img2img with reference | Non-prompt method; note for user |
| MJ quality (implicit) | Add: masterpiece, best quality, highly detailed | SD requires explicit quality tokens |
| `subject::2 bg::1` | `(subject:1.4), background` | Convert MJ weight to SD emphasis weight |

**Midjourney -> DALL-E 3:**

| MJ Element | DALL-E Translation | Notes |
|---|---|---|
| Tag-based text | Expand to natural language sentences | DALL-E 3 uses GPT-4 preprocessing |
| `--ar 16:9` | Size: 1792x1024 | Only three sizes available |
| `--ar 9:16` | Size: 1024x1792 | |
| `--ar 1:1` | Size: 1024x1024 | |
| All other aspect ratios | Closest available size + describe framing | DALL-E has no custom resolution |
| `--no [terms]` | "without [terms]" or "avoid [terms]" | Embed in sentence structure |
| `--style raw` | "realistic interpretation, without artistic embellishment" | |
| `--s` values | Adjectives: "realistic" (low) or "highly stylized, artistic" (high) | No numeric equivalent |
| `--cref`, `--sref` | Describe the reference visually in 1-2 sentences | No equivalent feature |
| Quality boosters | Not needed; DALL-E 3 applies quality by default | Adding quality tokens is unnecessary |
| `subject::2 bg::1` | Lead sentence with subject, secondary clause for background | Sentence structure conveys emphasis |
| Camera terms | Keep -- DALL-E understands "shot on 85mm f/1.4, shallow depth of field" | Usually direct transfer |

**Stable Diffusion -> Midjourney:**

| SD Element | MJ Translation | Notes |
|---|---|---|
| Quality boosters (masterpiece, best quality) | Drop entirely | MJ applies quality automatically |
| `(term:1.2)` | term (first mention, or repeat for emphasis) | MJ has no inline weighting |
| `(term:1.5)` | `term::2` multi-prompt or describe more specifically | High weights need special handling |
| `[term]` (de-emphasis) | Move to `--no` or remove | MJ has limited de-emphasis |
| Negative prompt (quality) | Drop quality negatives entirely | MJ doesn't use quality negatives |
| Negative prompt (content) | `--no [content terms]` | Direct transfer |
| CFG 5-6 | `--style raw --s 50-100` | |
| CFG 7-8 | `--s 150-250` | |
| CFG 9-10 | `--s 400-600` | |
| Steps 20-25 | `--q 0.5` | |
| Steps 30-40 | (default, no param needed) | |
| Steps 50+ | `--q 2` | |
| BREAK token | Separate into multi-prompt segments with `::` | Approximate |
| LoRA visual effect | Describe the aesthetic in text terms | Must translate what the LoRA does visually |
| Resolution 1344x768 | `--ar 16:9` | |
| Resolution 1216x832 | `--ar 3:2` | |
| Resolution 832x1216 | `--ar 2:3` | |
| Resolution 1024x1024 | `--ar 1:1` | |

**Stable Diffusion -> DALL-E 3:**

| SD Element | DALL-E Translation | Notes |
|---|---|---|
| Tag list | Expand each tag cluster into a sentence | Group related tags into coherent phrases |
| Quality boosters | Drop all | DALL-E 3 does not respond to booster tokens |
| Parenthetical weights | Translate to adjective emphasis in prose | `(cinematic lighting:1.4)` -> "dramatically cinematic lighting" |
| Negative prompt | Embed exclusions naturally | "without low quality, without blurriness" |
| LoRA reference | Describe the visual effect in a sentence | |
| CFG/Steps/Sampler | No equivalent; these are runner settings | Note that DALL-E has no settable inference parameters |
| BREAK token | Use paragraph or sentence breaks for emphasis | |

**DALL-E -> Midjourney:**

| DALL-E Element | MJ Translation | Notes |
|---|---|---|
| Full sentences | Extract key noun-adjective pairs as comma-separated tags | Preserve most important 8-12 descriptors |
| Embedded exclusions | `--no [extracted terms]` | Extract negative phrases |
| "realistic" descriptions | Camera terms + `--style raw` | Photography language translates well |
| "without text/watermarks" | `--no text, watermark, signature` | |
| Size 1792x1024 | `--ar 16:9` | |
| Size 1024x1792 | `--ar 9:16` | |
| Size 1024x1024 | `--ar 1:1` | |

### Step 5: Handle Quality Booster Translation

Quality boosters require special attention because they are model-specific and carry no meaning outside their native context:

**SD quality boosters that MUST be dropped for MJ and DALL-E:**
`masterpiece, best quality, ultra detailed, 8k, ultra-high res, wallpaper, ultra realistic, photorealistic, hyperdetailed, intricate detail` -- these are CLIP token patterns learned from Danbooru/Civitai tagging conventions and have no effect in MJ or DALL-E

**SD negative quality boosters that MUST be dropped for MJ and DALL-E:**
`worst quality, low quality, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry` -- these are SD-specific artifacts

**MJ implicit quality that MUST be made explicit for SD:**
MJ v6.1 applies significant quality processing by default. When translating to SD, the following additions to the positive prompt compensate:
- Photorealistic target: add `photograph, (photorealistic:1.2), DSLR, film grain`
- Cinematic target: add `masterpiece, best quality, cinematic, highly detailed, sharp focus`
- Artistic/illustrated: add `masterpiece, best quality, professional artwork, detailed illustration`
- Fantasy/conceptual: add `masterpiece, best quality, highly detailed, intricate, epic`

**DALL-E 3 implicit quality:**
DALL-E 3's GPT-4 preprocessing automatically expands prompts and applies quality processing. Adding quality tokens is counterproductive and can confuse the preprocessing. Keep DALL-E prompts clean and descriptive.

### Step 6: Generate the SD Negative Prompt When Translating To SD

When the target model is any Stable Diffusion variant, always produce a complete negative prompt even if the source had none. Use this baseline, then add source-specific exclusions:

**SDXL standard negative baseline:**
`ugly, poorly drawn, extra limbs, deformed, disfigured, low quality, blurry, pixelated, watermark, text, signature, logo, jpeg artifacts, oversaturated`

**SD 1.5 standard negative baseline (more extensive because 1.5 produces more artifacts):**
`(worst quality:1.4), (low quality:1.4), (normal quality:1.3), lowres, bad anatomy, bad hands, (missing fingers:1.2), extra digit, fewer digits, cropped, jpeg artifacts, signature, watermark, username, blurry, artist name, text, logo, extra limbs, malformed limbs, out of frame, poorly drawn face, mutation, deformed`

**Append source-specific exclusions** (from MJ `--no` or DALL-E embedded exclusions) after the baseline.

**Style-specific negative additions:**
- Photorealistic subjects: also add `cartoon, anime, illustration, painting, sketch, 3d render, cgi`
- Anime/illustration: also add `photograph, realistic skin, 3d, photorealistic`
- Portraits: also add `(extra hands:1.2), (extra arms:1.2), (clone:1.2), (duplicate:1.2)`
- Architecture: also add `people, figures, distorted perspective, impossible geometry`

### Step 7: Write the Translated Prompt and Compile the Output

Write the full translated prompt using all decisions made in previous steps. Then produce the complete output in the format below. Check the translation against these quality standards:

- Does the translated prompt capture the primary subject identically?
- Does the translated prompt capture the setting and atmosphere?
- Is the aspect ratio translated to the correct format for the target model?
- Are quality settings adapted to the target model's conventions?
- Are all non-transferable elements documented?
- Is the SD negative prompt present and appropriate if target is SD?
- Is the DALL-E prompt written in natural, flowing sentences?
- Are MJ parameters all using `--` syntax and appropriate for the target version?
- Are expected visual differences noted so the user has realistic expectations?

---

## Output Format

```
## Prompt Translation: [Source Model vX.X] -> [Target Model vX.X]

### Source Prompt ([Source Model])
[exact source prompt with all parameters, formatted as a code block]

Settings: [list all source model settings]

---

### Translated Prompt ([Target Model])

**Positive Prompt:**
[translated prompt in target model format, formatted as a code block]

**Negative Prompt:** [SD only -- "N/A" for MJ and DALL-E]
[negative prompt as a code block, or N/A]

**Recommended Settings:**
[Model]: [checkpoint name or model version]
[Sampler/Format]: [sampler for SD, size for DALL-E, version for MJ]
[Steps]: [step count for SD, or N/A]
[CFG Scale]: [CFG value for SD, or N/A]
[Resolution/Size]: [pixel dimensions for SD, size selection for DALL-E, --ar for MJ]
[Seed]: [seed value or "random"]
[Additional]: [any LoRA, ControlNet, IP-Adapter, or other non-prompt recommendations]

---

### Translation Map

| Component | Source Text/Param | Target Text/Param | Transfer Class | Notes |
|---|---|---|---|---|
| Subject | [source] | [target] | Direct/Adapted/Approximate | |
| Setting | [source] | [target] | Direct/Adapted/Approximate | |
| Atmosphere/Style | [source] | [target] | Direct/Adapted/Approximate | |
| Lighting | [source] | [target] | Direct/Adapted/Approximate | |
| Camera/Composition | [source] | [target] | Direct/Adapted/Approximate | |
| Color Palette | [source] | [target] | Direct/Adapted/Approximate | |
| Aspect Ratio | [source param] | [target param/size] | Direct | |
| Quality Level | [source param or implicit] | [target param or tokens] | Adapted | |
| Stylization Level | [source param] | [target param] | Approximate | |
| Exclusions/Negatives | [source] | [target] | Direct/Adapted | |
| [Any additional rows needed] | | | | |

---

### Non-Transferable Elements

| Feature | Source Behavior | Target Alternative | Impact Level |
|---|---|---|---|
| [feature name] | [what it does in source] | [best alternative or "None available"] | High/Medium/Low |

(If no non-transferable elements exist, write: "All elements translated with Direct or Adapted transfer quality.")

---

### Expected Visual Differences

- **[Difference category]:** [specific description of how the output will differ and why]
- (Minimum 3 differences; skip only if models are highly similar in the relevant domain)

---

### Optimization Notes

- **[Target model-specific tip 1]:** [specific action with specific values or techniques]
- **[Target model-specific tip 2]:** [specific action with specific values or techniques]
- **[Target model-specific tip 3]:** [specific action or tool recommendation]
```

---

## Rules

1. **Never translate a broken source prompt.** If the source prompt contains obvious errors (malformed parameters, contradictory instructions, missing key information), flag them before translating. A bad source produces a bad translation. If the user wants debugging, redirect to `ai-image-prompt-debugging`.

2. **Quality booster tokens are model-specific and must never cross model boundaries.** SD's `masterpiece, best quality` have zero effect in Midjourney and negative effect in DALL-E 3 (the GPT-4 preprocessor may interpret them as literal description elements). Drop them entirely when translating out of SD. Add appropriate equivalents when translating into SD.

3. **Aspect ratio must be translated to exact pixel dimensions for SD.** Do not use ratios in SD prompts. Use SDXL-recommended resolutions: 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640 for landscape; 896x1152, 832x1216, 768x1344 for portrait. For SD 1.5, stay near multiples of 64 close to 512 total pixel budget (512x512, 768x512, 512x768, 768x768). Using non-native resolutions for a model produces artifacts and quality degradation.

4. **Document every non-transferable feature explicitly.** Do not silently drop `--cref`, `--sref`, LoRA references, or BREAK tokens. List each in the Non-Transferable Elements table. Provide the best available alternative with specific tool names (IP-Adapter, ControlNet Reference, img2img).

5. **SD targets always require a negative prompt.** Even if the source model had no exclusions, generate a negative prompt appropriate to the subject matter. Omitting a negative prompt in SD 1.5 especially will produce low-quality, artifact-prone output. The negative prompt is not optional.

6. **DALL-E 3 prompts must be written as natural, grammatically complete sentences.** DALL-E 3's preprocessing (GPT-4 based) interprets tag-style prompts as if they were lists of objects, losing compositional relationships. "woman, forest, sunlight, ethereal, mist" becomes unpredictable, while "A woman stands in a misty forest, with soft sunlight filtering through the trees, creating an ethereal atmosphere" produces consistent results.

7. **Preserve semantic intent, not literal syntax.** The goal is visual similarity in the target model, not word-for-word translation. A Midjourney multi-prompt `portrait of an astronaut::3 nebula background::1` is communicating emphasis hierarchy. In SD this becomes `(portrait of an astronaut:1.5), (nebula background:1.0)`. In DALL-E it becomes "A close-up portrait of an astronaut as the primary focus, with a colorful nebula visible in the background."

8. **When translating into Midjourney from SD, reduce prompt length aggressively.** MJ v6.1 works best with focused prompts of 20-60 words. SD prompts routinely run 80-200+ tokens. Identify the 8-12 most visually essential descriptors and use those. Excess descriptors in MJ cause the model to produce compositional confusion.

9. **CFG scale and `--s` parameter are not linearly equivalent.** Do not mechanically map MJ `--s` values to SD CFG values. The relationship is: low `--s` (0-100) corresponds to low model influence, similar to CFG 5-6 in SD. Mid `--s` (150-300) corresponds to CFG 7-8. High `--s` (400-1000) corresponds to CFG 8.5-10. However, SD's CFG controls adherence to the prompt, while MJ's `--s` controls aesthetic stylization. They control related but different things.

10. **When the source prompt exploits a model-unique capability, explicitly note the quality gap.** DALL-E 3 produces legible text in images; SD and MJ do not reliably. MJ's default aesthetic processing produces cinematic images without explicit effort; SD requires substantial prompting to match. SD LoRAs can produce extremely specific visual effects that cannot be matched by text alone in other models. Do not imply these gaps are bridgeable with text prompting -- be honest about the limitations and suggest workflow alternatives (ControlNet, img2img, ComfyUI pipelines) where appropriate.

---

## Edge Cases

### Very Short Source Prompts (Under 15 Words)
Short prompts behave very differently across models. Midjourney v6.1 responds well to terse, evocative prompts because it applies extensive default processing. "misty mountain temple at dawn" produces a beautiful, detailed MJ image. In SD, this prompt produces a flat, underdetailed result because SD requires explicit specification. When translating a short MJ prompt to SD: expand to at least 30-40 tokens by inferring appropriate style (realistic/painterly/cinematic based on subject matter), adding compositional detail (foreground, middle ground, background elements implied by the setting), quality boosters, and lighting specifics. When translating to DALL-E: expand to 2-3 descriptive sentences that specify mood, light, perspective, and atmosphere. Tell the user you are expanding the prompt and why.

### Multi-Prompt Syntax (MJ `::` Weights)
Midjourney's double-colon multi-prompt system splits the prompt into weighted segments that are processed semi-independently. `"golden samurai warrior::3 cherry blossom storm::2 dark void::0.5"` gives the warrior three times the compositional weight of the cherry blossoms and keeps the void minimal.

**Translating to SD:** Use parenthetical weight emphasis. The conversion formula is: MJ weight / max weight * 1.4 = SD weight. For the example: warrior gets `(golden samurai warrior:1.4)`, cherry blossoms get `(cherry blossom storm:1.0)`, and the void becomes `(dark void:0.5)` or moves to the negative prompt if weight is very low. SDXL interprets emphasis weights between 0.8 and 1.5 reliably; values outside this range produce artifacts.

**Translating to DALL-E:** Express the weight hierarchy through sentence structure and explicit language. Lead with the highest-weight element, use "dominated by" or "with secondary" framing: "A golden samurai warrior is the central focus, surrounded by a swirling storm of cherry blossoms, with dark void barely visible at the edges of the frame."

### LoRA References in SD Source Prompts
When a SD source prompt contains `<lora:filename:weight>` references, never simply drop them. Always:
1. Identify what the LoRA likely achieves visually (anime style, specific artist style, specific character, lighting technique, lens flare effect)
2. Describe that visual effect in text for the target model
3. Note in the Non-Transferable Elements table that the exact effect cannot be replicated without the LoRA
4. Suggest that for MJ, the user describe the style in words; for DALL-E, reference the style movement or aesthetic in a sentence
5. If the LoRA is a character LoRA, the user cannot achieve character consistency in MJ or DALL-E without reference image features (`--cref` or DALL-E's current technical limitations)

For example: `<lora:vanGogh_painting:0.8>` translates to "in the style of Vincent van Gogh, post-impressionist painting, impasto brushwork, swirling skies" in MJ and DALL-E. This is a reasonable approximation because van Gogh's style is well-represented in these models' training data. A custom trained LoRA for an original character has no equivalent and should be flagged as non-transferable with High impact.

### DALL-E 3 Prompt Revision Behavior
DALL-E 3 uses a GPT-4 preprocessing step that automatically revises the user's prompt before image generation. This means the actual prompt used internally may differ significantly from what the user submitted. When creating a DALL-E 3 translation:
- Write the prompt for the GPT-4 preprocessor, not just for image generation. This means natural, clear, unambiguous language works better than compressed technical description.
- Avoid conflicting instructions -- the preprocessor will arbitrate them in unpredictable ways.
- Avoid overly long prompts (over 400 characters) -- the preprocessor may summarize and lose details.
- The API `quality: "hd"` parameter adds an additional level of detail -- note this to the user as it does not appear in the prompt itself.
- For the `natural` vs `vivid` style parameter in the API: `vivid` produces more hyper-real, dramatic images; `natural` produces more subdued, realistic images. This partially corresponds to MJ's `--style raw` (use `natural`) vs default MJ aesthetic (use `vivid`).

### Translating Between Models for Same Photorealistic Subject
Photorealistic human portraiture behaves very differently across models:
- **MJ v6.1** produces polished, idealized faces by default. Very difficult to produce gritty or natural-looking portraits without `--style raw` and specific camera terms.
- **DALL-E 3** produces safe, somewhat generalized faces. Struggles with extreme age, extreme emotion, very specific ethnic features.
- **SD SDXL** with a portrait-fine-tuned checkpoint (Juggernaut XL, RealVisXL, DreamShaper XL) produces the most control and photorealism. But base SDXL struggles with faces.
When translating a photorealistic portrait across models, explicitly note which checkpoint or model variant is recommended for SD, because this significantly affects whether the translation will succeed. Base SDXL 1.0 is not the right target for photorealistic portraits. Always recommend a tested checkpoint variant (Juggernaut XL v9, RealVisXL V4, or similar) and include face-specific positive/negative prompt tokens (`close-up portrait, detailed eyes, realistic skin texture` positive; `(extra eyes:1.3), doll, plastic skin, oversmoothed` negative).

### Source Prompt Uses Non-Standard Aspect Ratios
MJ supports arbitrary aspect ratios like `--ar 7:4`, `--ar 21:9`, `--ar 9:2`. SD does not support arbitrary aspect ratios at the native resolution level -- deviating from the recommended SDXL resolutions causes quality degradation.

**Resolution selection logic for non-standard ratios targeting SDXL:**
- Calculate the decimal ratio (width/height) of the source
- Find the nearest SDXL recommended resolution: 1536x640 (2.4:1), 1344x768 (1.75:1), 1216x832 (1.46:1), 1152x896 (1.29:1), 1024x1024 (1:1), 896x1152 (0.78:1), 832x1216 (0.68:1), 768x1344 (0.57:1), 640x1536 (0.42:1)
- Use that resolution and note the rounding

**For DALL-E 3** with non-standard ratios: only three sizes exist (1024x1024, 1792x1024, 1024x1792). Suggest the closest match and note that significant cropping or compositional adjustment will occur at the edges.

### Translating Anime/Illustration Style Prompts
Anime-style SD prompts use Danbooru tagging conventions (`1girl, solo, long hair, looking at viewer, school uniform`) that are completely foreign to MJ and DALL-E. When translating:

**SD anime -> MJ:**
- Replace Danbooru tags with descriptive English: `1girl, solo` becomes "a young woman, solo portrait"
- Drop count tags (`1girl`, `2boys`) and use descriptive phrasing
- Add anime-specific style terms that MJ understands: "anime art style", "Studio Ghibli aesthetic", or specific artist names if the style warrants it
- The specific character/hair/eye color tags often translate directly: `blue eyes, long blonde hair` -- keep these
- Add `--niji 6` parameter if the user wants anime-specific output (MJ's niji model is purpose-built for anime)

**SD anime -> DALL-E:**
- Write as natural description with explicit anime medium declaration: "Anime-style illustration of..."
- DALL-E 3 has reasonable anime output but will not match SD's fine-tuned anime models

---

## Example

**User Input:** "Translate this Midjourney prompt to Stable Diffusion SDXL. I have ComfyUI with the Juggernaut XL v9 checkpoint and DPM++ 2M Karras. The prompt is: `a solitary lighthouse keeper watching an approaching storm, dramatic storm clouds, turbulent dark ocean, lighthouse beam cutting through fog, volumetric light, coastal rocks in foreground, painterly realism, Andrew Wyeth influenced --ar 3:2 --v 6.1 --s 250 --no cartoon, text, people --q 2`"

**Output:**

## Prompt Translation: Midjourney v6.1 -> Stable Diffusion SDXL (Juggernaut XL v9)

### Source Prompt (Midjourney v6.1)
```
a solitary lighthouse keeper watching an approaching storm, dramatic storm clouds, turbulent dark ocean, lighthouse beam cutting through fog, volumetric light, coastal rocks in foreground, painterly realism, Andrew Wyeth influenced --ar 3:2 --v 6.1 --s 250 --no cartoon, text, people --q 2
```

Settings: v6.1 | Aspect 3:2 | Stylize 250 (moderate-high) | Quality 2 | Exclusions: cartoon, text, people

---

### Translated Prompt (Stable Diffusion SDXL -- Juggernaut XL v9)

**Positive Prompt:**
```
masterpiece, best quality, highly detailed, a solitary lighthouse keeper standing on coastal rocks watching an approaching storm, dramatic storm clouds roiling overhead, turbulent dark churning ocean waves, lighthouse beam cutting through thick fog, volumetric god rays through storm mist, rugged coastal rocks in sharp foreground, painterly realism, Andrew Wyeth painting style, tempera paint texture, muted earth tones, grey-green palette, desaturated coastal atmosphere, cinematic composition, lone figure silhouette, desolate melancholy mood, oil painting texture, natural lighting, dramatic chiaroscuro, detailed weathered rock textures, angry sea foam, 8k uhd
```

**Negative Prompt:**
```
cartoon, anime, illustration style, text, watermark, signature, logo, people (besides keeper), crowds, sunny weather, cheerful, bright colors, smooth digital art, 3d render, cgi, (worst quality:1.4), (low quality:1.4), (normal quality:1.2), lowres, jpeg artifacts, blurry, overexposed, flat lighting, extra limbs, deformed hands, bad anatomy, plastic skin
```

**Recommended Settings:**
- Model: Juggernaut XL v9
- Sampler: DPM++ 2M Karras
- Steps: 40
- CFG Scale: 7.5
- Resolution: 1216x832 (3:2 -- SDXL native resolution)
- Seed: random (generate 4+ variants to find best composition)
- Additional: No LoRA required. Consider enabling Juggernaut XL's built-in detail enhancement if available. A painting-style LoRA at weight 0.4-0.5 (if you have one for Wyeth-style or oil painting) could reinforce the painterly quality.

---

### Translation Map

| Component | Source (MJ) | Target (SD) | Transfer Class | Notes |
|---|---|---|---|---|
| Subject | solitary lighthouse keeper watching storm | solitary lighthouse keeper standing on coastal rocks watching storm | Direct | Added "standing on coastal rocks" to anchor figure spatially |
| Setting -- sky | dramatic storm clouds | dramatic storm clouds roiling overhead | Direct | Added "roiling overhead" to reinforce vertical composition |
| Setting -- sea | turbulent dark ocean | turbulent dark churning ocean waves, angry sea foam | Direct | Extended for SD specificity |
| Lighting feature | lighthouse beam cutting through fog | lighthouse beam cutting through thick fog, volumetric god rays through storm mist | Direct | "God rays" is strong SD vocabulary for volumetric light |
| Foreground | coastal rocks in foreground | rugged coastal rocks in sharp foreground | Direct | "Sharp" added to reinforce foreground focus |
| Style | painterly realism | painterly realism, tempera paint texture, muted earth tones, oil painting texture | Adapted | MJ interprets style references; SD needs explicit texture vocabulary |
| Style reference | Andrew Wyeth influenced | Andrew Wyeth painting style, tempera paint texture, muted earth tones, grey-green palette | Adapted | Wyeth is in SDXL training data; added visual descriptors of Wyeth's signature style as reinforcement |
| Mood | (implicit in subject) | desolate melancholy mood, lone figure silhouette, desaturated coastal atmosphere | Adapted | Made implicit mood explicit for SD |
| Aspect ratio | --ar 3:2 | Resolution: 1216x832 | Direct | Exact SDXL native 3:2 resolution |
| Quality | --q 2 (high quality) | Steps: 40, masterpiece, best quality, 8k uhd | Adapted | --q 2 in MJ ~= 40+ steps + quality tokens in SD |
| Stylization | --s 250 (moderate-high) | CFG 7.5 | Approximate | --s 250 is moderate-high; CFG 7.5 gives model meaningful influence while staying prompt-adherent |
| Exclusion: cartoon | --no cartoon | Negative: cartoon, anime, illustration style | Direct | Expanded to cover related styles |
| Exclusion: text | --no text | Negative: text, watermark, signature, logo | Direct | |
| Exclusion: people | --no people | Negative: people (besides keeper), crowds | Adapted | Clarified intent -- exclude crowds, not the keeper |
| MJ implicit quality | (built into MJ v6.1 default) | masterpiece, best quality, highly detailed, 8k uhd | Adapted | Required addition for SD |

---

### Non-Transferable Elements

| Feature | Source Behavior | Target Alternative | Impact Level |
|---|---|---|---|
| MJ default aesthetic processing | MJ v6.1 applies cinematic, gallery-quality processing automatically | Juggernaut XL v9 provides similar automatic enhancement; quality boosters in positive prompt reinforce this | Low -- Juggernaut XL compensates well |
| --s 250 stylization control | Precise control over how much MJ's aesthetic interpretation overrides literal prompt | CFG 7.5 is a close approximation but controls prompt adherence, not aesthetic stylization specifically | Medium -- visual quality similar but mechanism differs |
| MJ's Wyeth interpretation | MJ v6.1 has nuanced understanding of named artist styles | SDXL + Juggernaut XL has reasonable Wyeth knowledge but benefits from additional descriptive reinforcement | Low -- well-known artist, covered adequately |

---

### Expected Visual Differences

- **Painterly texture:** MJ v6.1 produces a more refined, finished painterly quality by default. Juggernaut XL will produce strong results but may exhibit slightly more photographic sharpness even with painterly instructions. If the result looks too photographic, increase painting vocabulary: add `loose brushwork, visible paint texture, impasto` to positive, and add `photograph, DSLR, sharp focus` to the negative prompt.
- **Figure rendering:** MJ v6.1 handles small figures in large landscapes gracefully. In SD, a small figure in a large scene can lose detail or produce anatomical issues at this resolution. The lighthouse keeper may be less detailed than in MJ. If figure quality matters, consider generating at 1536x1024 and cropping, or using a higher detail step count (45-50).
- **Fog and volumetric light:** This is an area where MJ v6.1 currently excels over base SDXL. The lighthouse beam through fog in MJ tends to be luminous and atmospheric. In SDXL, the same concept may produce a more literal, less luminous result. The terms "volumetric god rays through storm mist" and "cinematic chiaroscuro" are included to push toward that quality, but expect some degradation in atmospheric subtlety. Using the Juggernaut XL v9 checkpoint (vs. base SDXL) significantly mitigates this.
- **Color palette:** MJ with --s 250 will apply its own aesthetic color processing, which may warm or cool the palette beyond what the prompt specifies. SDXL with CFG 7.5 will more literally follow the "muted earth tones, grey-green palette" instructions -- this may actually produce a more accurate Wyeth-like palette.

---

### Optimization Notes

- **LoRA enhancement:** If you have access to an oil painting, watercolor, or classical realism LoRA for SDXL, apply it at weight 0.45-0.55. This reinforces the painterly quality more reliably than text tokens alone. Do not exceed 0.6 or the model's photographic quality foundation from Juggernaut XL will be overridden.
- **Hires fix:** Juggernaut XL v9 benefits strongly from Hires Fix at 1.5x scale with 15-20 denoising steps using DPM++ 2M Karras. This will sharpen the lighthouse beam, rock textures, and figure detail substantially. Apply after a successful base generation.
- **CFG experimentation:** If the first results feel too literal and lack painterly interpretation, drop CFG to 6.5. If they feel too abstracted and lose the Wyeth quality, increase to 8.0. The sweet spot for painterly-realism in Juggernaut XL tends to be CFG 7.0-8.0.
- **Composition control:** The lighthouse, figure, and ocean must coexist in a 3:2 frame. If SD places the lighthouse awkwardly, add compositional tokens: `lighthouse in middle distance, figure in left foreground, ocean filling right side` or try ControlNet Depth if precise composition control is required.
