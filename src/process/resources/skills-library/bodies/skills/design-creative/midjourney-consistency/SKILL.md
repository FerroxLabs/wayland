---
name: midjourney-consistency
description: |
  Produces Midjourney consistency strategies using character reference (--cref), style reference (--sref), seed locking, and multi-image coherence techniques for reproducible visual series.
  Use when the user asks to maintain character consistency, create a series of matching images, use --cref or --sref in Midjourney, or reproduce a specific visual style across multiple generations.
  Do NOT use for single-image Midjourney prompting (use midjourney-prompting), other model consistency (model-specific), or prompt translation (use prompt-translation).
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
# Midjourney Consistency

## When to Use

**Use this skill when:**
- User wants to generate a series of images featuring the same character (human, creature, mascot, or original character) appearing recognizably across multiple scenes, poses, or settings
- User explicitly asks about `--cref`, `--sref`, `--cw`, or `--sw` parameters, or asks how to "lock" a character's appearance in Midjourney
- User needs a visual identity system for a project -- storybook illustrations, comic panels, brand character sheets, game asset sets, social media series
- User has an approved reference image and wants to generate variations that stay true to it
- User asks about seed locking, `--seed`, or the envelope emoji workflow for reproducible generation
- User is generating a prompt set for an entire series (4+ images) and needs a unified strategy before starting
- User wants to blend or combine multiple reference images to define a unique hybrid style or character

**Do NOT use when:**
- User wants a single standalone Midjourney image with no series requirement -- use `midjourney-prompting` instead
- User is working in DALL-E 3, Stable Diffusion, Firefly, or any other image model -- parameters like `--cref` and `--sref` are Midjourney-exclusive; use model-specific guidance
- User wants to transfer a specific artist's visual style across subjects -- use `ai-image-style-transfer` for that workflow
- User wants to translate or adapt an existing prompt for a different model -- use `prompt-translation`
- User is asking about Midjourney's image blending feature (`/blend`) without a consistency goal -- that is a separate single-output operation
- User wants to animate or create video from a Midjourney character -- that requires a separate motion pipeline skill

---

## Process

### 1. Clarify the Consistency Goal Before Writing a Single Prompt

This is the most important step. Consistency failures almost always trace back to an unclear definition of what must stay constant. Ask the user to specify:

- **What type of consistency is needed:** Character consistency (same individual appearing across scenes), style consistency (same visual aesthetic applied to different subjects), or compound consistency (same character AND same style)
- **What the series is for:** Storybook, character sheet, brand asset, comic strip, game sprites, marketing campaign -- the use case determines acceptable drift tolerance and aspect ratio choices
- **Series scope:** How many images? 2-5 is straightforward; 6-12 requires a template system; 13+ requires staged generation with drift reviews between batches
- **What MUST stay constant vs. what CAN change:** Have the user explicitly name both. Face? Yes. Body type? Usually. Clothing? Depends. Pose? Changes. Background? Usually changes. Art medium? Usually stays.
- **Reference availability:** Does the user already have a Midjourney-generated reference image with a URL, or do they need to generate one first? Never skip this -- a missing reference is the most common setup failure
- **Midjourney version:** v6.1 or v7. Both support `--cref` and `--sref`. v7 has stronger character adherence by default but generates slightly differently. Confirm with the user which version they are using, or default to v6.1 as the safer documented baseline

---

### 2. Generate the Foundation Reference Image (If Needed)

If the user does not already have a reference image, the first output must be a reference generation prompt -- not the series prompts. The reference image is the anchor for everything that follows. A weak reference produces a weak series.

**Properties of an ideal character reference:**
- Subject is centered, filling at least 60% of the frame
- Clean, neutral background (light gray, white, or flat color) so the model isolates the character, not the environment
- Front-facing or 3/4 view -- never extreme profile (90°) for initial reference; extreme angles confuse face extraction
- Full-body or waist-up framing depending on how much body consistency matters
- No motion blur, no extreme foreshortening, no obstructions over the face
- Well-lit -- avoid dramatic chiaroscuro or heavy shadow on the face for the reference; save that for series images
- Consistent with the intended art style at `--s 200` to `--s 400` -- the reference and the series should share a stylize level

**Reference generation prompt formula:**
```
[character description in detail], [clothing and accessories], [pose: neutral, standing, facing camera], [expression: neutral or slight smile], against a plain [light gray/white/studio] background, [art style], full body view, clear character design, character sheet style --ar 2:3 --v 6.1 --s 250
```

Generate 4 variations (the default grid). Upscale the best result. This upscaled image URL becomes the `--cref` anchor.

**Properties of an ideal style reference:**
- The image exemplifies the intended aesthetic without a distracting complex subject
- Abstract textures, simple environments, or minimalist illustrations work better than busy scenes
- Color palette is clearly readable -- avoid muddy or desaturated references for `--sref`
- If using a character reference image as the style reference too (using the same URL for both `--cref` and `--sref`), use a lower `--sw` value (40-60) to prevent the style reference from fighting the character reference

---

### 3. Configure --cref (Character Reference)

**How character reference extraction works:**
Midjourney's `--cref` extracts the subject from the reference image and attempts to regenerate that character in the context described by the text prompt. It extracts facial features, body proportions, hair color and style, and general silhouette. It does NOT lock clothing or specific accessories by default -- those are controlled by text.

**Parameter syntax:**
```
[your prompt text] --cref [image URL] --cw [0-100]
```

**--cw (character weight) decision guide:**

| --cw Value | What Transfers | Best Use Case |
|---|---|---|
| 100 | Face + body + clothing style + general silhouette | When maximum fidelity to the reference is required; costume/character sheets |
| 80 | Face + body proportions + hair; clothing loosely follows | General series work -- recommended default for most narrative series |
| 50 | Face + body type; clothing and accessories follow the prompt | When the character changes outfits significantly between scenes |
| 0 | Face only; all other attributes follow the prompt | When only facial identity matters; wildly different settings or body transformations |

**Critical technique -- text reinforcement:**
`--cref` does not replace the text prompt's character description. The text prompt and the reference image work together. If the text prompt says nothing about the character, Midjourney has less constraint and drifts more. Include a condensed character description in EVERY prompt in the series, positioned at the start. Example:
```
female elf warrior, silver-white braided hair, emerald eyes, angular features, [scene text] --cref [URL] --cw 80
```

**Multiple character references:**
As of v6.1, Midjourney supports only one `--cref` URL per prompt. For multi-character scenes, use `--cref` for the primary character and achieve secondary character consistency through detailed text description. If secondary character consistency is mission-critical, generate each character separately and composite in post.

---

### 4. Configure --sref (Style Reference)

**How style reference extraction works:**
`--sref` extracts the color palette, rendering technique, texture quality, lighting mood, and compositional energy from the reference image. It does NOT extract specific subjects, faces, or characters from the reference image -- that is `--cref`'s job. This distinction matters: `--sref` sees HOW the image is made, not WHAT is in it.

**Parameter syntax:**
```
[your prompt text] --sref [image URL 1] [image URL 2] --sw [0-1000]
```

Note: `--sw` accepts values 0-1000, unlike `--cw` which is 0-100. This is a common user error.

**--sw (style weight) decision guide:**

| --sw Value | Effect | Best Use Case |
|---|---|---|
| 1000 | Maximum style fidelity; text prompt is heavily overridden | When recreating a very specific established visual identity |
| 500-700 | Strong style influence; subject still follows text prompt | When style consistency is the primary goal |
| 200-400 | Balanced -- style flavors the output without dominating | Most narrative and marketing series work |
| 100 | Light influence -- style suggests the aesthetic, prompt controls | When style is a secondary consideration |
| 0 | No style reference influence | Testing or troubleshooting |

**Default `--sw` value is 100**, which is deliberately understated. Users expecting `--sref` to override everything are surprised. Increase to 300-500 for meaningful visible consistency.

**Multi-URL style blending:**
Up to 5 `--sref` URLs can be provided. The model blends them. Weights can be assigned per URL:
```
--sref [URL1]::2 [URL2]::1
```
This gives URL1 twice the weight of URL2. Use this when combining a dominant style reference with a secondary color palette reference.

**Text style descriptors as reinforcement:**
Always include text style descriptors even when using `--sref`. Style drift increases when style is only carried by the reference URL. Combine both:
```
watercolor illustration, soft edges, muted earth tones, loose brushwork --sref [URL] --sw 400
```

---

### 5. Configure Seed Locking and the Envelope Workflow

**How seeds work in Midjourney:**
Every generation starts from a numerical seed that initializes the random noise field. Using the same seed with an identical or near-identical prompt produces structurally similar outputs. Seeds do not guarantee identical results -- changing even one word in the prompt changes the output even with the same seed. Seeds are a consistency floor, not a ceiling.

**When seed locking is most valuable:**
- Creating variations of a single image (same character, slight prompt change, nearly identical composition)
- Testing whether a prompt change causes meaningful visual drift before committing
- Producing "takes" of the same scene that need to feel compositionally related

**The envelope emoji workflow:**
1. Generate an image grid (4 images)
2. React to the grid message in the Midjourney Discord with the envelope emoji (✉️)
3. Midjourney sends a DM with the seed number for that grid
4. Use `--seed [number]` in subsequent prompts to anchor from that starting point

**Seed locking combined with --cref and --sref:**
The strongest consistency stack is: consistent text + `--cref` + `--sref` + `--seed` + consistent `--s` (stylize) value. This is appropriate for high-fidelity series work. For more compositional variety across a series, drop `--seed` and rely on `--cref` + `--sref` + text.

**--chaos interaction:**
`--chaos [0-100]` controls variation within a single grid. For consistency work, always explicitly set `--chaos 0` (or omit it, as 0 is default). Never leave `--chaos` at elevated values when generating a consistency series.

---

### 6. Build the Prompt Template System

Every image in the series should be generated from a template with clearly labeled constant and variable sections. This prevents accidental drift from prompt rewording.

**Template structure:**
```
[CONSTANT: character descriptor], [VARIABLE: scene and action], [CONSTANT: style descriptor] --cref [URL] --cw [value] --sref [URL] --sw [value] --ar [ratio] --v [version] --s [value]
```

**Constant section rules:**
- Write the constant text once and copy-paste it into every prompt. Do not retype it.
- Include: character name or descriptor, key physical identifiers (hair color, eye color, defining features), and core style terms
- Limit the constant section to 30-50 tokens. Overly long constant sections can dilute variable text influence.
- Word order matters. "silver-white braided hair, emerald eyes" and "emerald eyes, silver-white braided hair" produce slightly different emphasis. Pick one order and never change it.

**Variable section rules:**
- The variable section describes ONLY what changes in this specific image
- Include: scene location, time of day, action/pose, camera angle, any scene-specific lighting
- Avoid using adjectives in the variable section that contradict the constant section
- Do not add style terms to the variable section -- all style terms belong in the constant section

**Parameter consistency:**
All images in a series must share the same `--ar`, `--v`, `--s`, and model version. Changing any of these mid-series causes immediately visible inconsistency.

---

### 7. Build the Series Prompt Set and Drift Management Plan

Generate the series in order from simplest to most complex composition. Starting with a dramatic or complex scene as image #1 often produces a reference that is hard to replicate.

**Batch generation strategy:**
- Generate 2-4 images per prompt (standard grid)
- Review for drift before proceeding to the next prompt in the series
- If drift appears, apply the troubleshooting protocol (see Rules and Edge Cases) before continuing
- For series of 10+, divide into batches of 4. After each batch, select the best output as a "mid-series reference check" image and visually compare to the original reference

**Drift early-warning signs:**
- Eye color shifts (most common)
- Hair length changes (second most common)
- Body proportions change (height, build)
- Skin tone shifts in different lighting conditions
- Art style becomes looser or tighter than reference

**Drift intervention ladder:**
1. First drift: Increase `--cw` by 20. Add more specific text about the drifted feature.
2. Persistent drift: Regenerate the reference image using the same prompt but upscale a different grid variation. Try the new URL.
3. Severe drift: Reduce the scene complexity in the variable section. The model has limited attention -- complex scenes compete with character attention.
4. Irrecoverable drift: Use Midjourney's Vary (Region) tool to inpaint the specific feature that drifted.

---

### 8. Document and Deliver the Complete Consistency Strategy

Compile all decisions into the output format. The user should be able to copy-paste every prompt directly from the output. Include:
- The reference generation prompt (if needed)
- The complete template with all parameters
- Every series prompt with its variable section filled in
- Explicit troubleshooting instructions keyed to specific failure modes for this series

---

## Output Format

```
## Consistency Strategy: [Series Name]

### Series Overview
- **Use case:** [storybook / character sheet / marketing series / game asset / comic strip]
- **Character consistency:** [Yes/No -- describe what is locked]
- **Style consistency:** [Yes/No -- describe the aesthetic]
- **Series size:** [number] images
- **Midjourney version:** v[6.1 / 7]
- **Aspect ratio:** [--ar value] -- rationale: [why this ratio for this use case]
- **Stylize value:** --s [value] -- rationale: [why this strength]

---

### Step 1: Reference Image Generation

**Character Reference Prompt:**
```
[full generation prompt for the reference image, including all parameters]
```
**Instructions:** Generate this prompt. Select the best result from the 4-image grid. Upscale it. Copy the upscaled image URL. This URL is [CREF_URL] in all subsequent prompts.

**Style Reference:**
- [If using the same image as style reference: "Use [CREF_URL] also as --sref at --sw [value]"]
- [If using a separate style reference: provide that generation prompt as well]

---

### Step 2: Consistency Parameters

| Parameter | Value | Rationale |
|---|---|---|
| --cref | [CREF_URL] | Character anchor |
| --cw | [0-100] | [Explain the choice -- e.g., "80 preserves face and body, allows outfit change"] |
| --sref | [SREF_URL] | Style anchor |
| --sw | [0-1000] | [Explain the choice] |
| --seed | [number or "obtain after first generation"] | [Explain if locking or not] |
| --ar | [ratio] | [Why this ratio] |
| --v | [version] | [Why this version] |
| --s | [value] | [Stylize rationale] |
| --chaos | 0 | Locked for consistency |

---

### Step 3: Prompt Template

**Constant section (copy-paste unchanged into every prompt):**
```
[constant character descriptor and style terms -- 30-50 tokens max]
```

**Full prompt template:**
```
[CONSTANT], [VARIABLE], [CONSTANT STYLE] --cref [CREF_URL] --cw [value] --sref [SREF_URL] --sw [value] --ar [ratio] --v [version] --s [value] --chaos 0
```

---

### Step 4: Series Prompts

| # | Scene | Full Variable Text | Key Consistency Risk | Full Prompt |
|---|---|---|---|---|
| 1 | [scene name] | [variable text for this image] | [what is most likely to drift in this scene] | [complete copy-pasteable prompt] |
| 2 | [scene name] | [variable text for this image] | [key risk] | [complete prompt] |
| 3 | [scene name] | [variable text for this image] | [key risk] | [complete prompt] |
| 4 | [scene name] | [variable text for this image] | [key risk] | [complete prompt] |

---

### Step 5: Drift Management Protocol

**If [specific visual element] drifts:**
- Immediate fix: [specific parameter or text change]
- Escalation: [next step if immediate fix fails]

**If art style inconsistency appears between images:**
- Immediate fix: [specific intervention]
- Escalation: [next step]

**If composition or framing becomes inconsistent:**
- Immediate fix: [specific intervention]
- Escalation: [next step]

**Generation order:** Generate prompts in this sequence for minimum drift risk: [list order]
```

---

## Rules

1. **Never start a series without a finalized reference image URL.** Building a series on an unfinalized reference is the single most common cause of mid-series reconstruction. The reference image must be upscaled before any series prompt is written.

2. **--cw and --sw have different scales.** `--cw` accepts 0-100. `--sw` accepts 0-1000. Mixing these up (e.g., `--sw 80` when you mean `--sw 800`) produces either negligibly weak or no visible style effect. Always double-check scale.

3. **The text prompt must describe the character even when --cref is active.** `--cref` without text character description produces more drift than `--cref` with redundant text description. Redundancy is a feature here, not a mistake.

4. **Word order in the constant section must be identical across all prompts.** Midjourney's attention mechanism weights earlier tokens more heavily. "silver hair, green eyes" and "green eyes, silver hair" place emphasis differently. Write the constant section once and copy-paste -- never retype.

5. **--s (stylize) must be identical across all images in a series.** Changing stylize mid-series shifts the rendering approach noticeably -- lower values look more photographic, higher values more artistic. Fix it before starting and do not adjust.

6. **--sref default weight (--sw 100) is almost always too low for visible consistency.** Users who set `--sref` without specifying `--sw` and then complain that the style reference "isn't working" are almost always hitting this issue. Default to `--sw 300` as a starting point and calibrate from there.

7. **Seed locking without --cref is not character consistency.** Seeds produce structural similarity in composition and layout, not facial or character fidelity. Never describe seed locking as a character consistency method on its own.

8. **Never use more than 2 --sref URLs in a production series prompt.** Three or more style references produce muddy, averaged aesthetics that are hard to predict or troubleshoot. If blending multiple styles is desired, create a pre-blended reference image first using Midjourney's `/blend` command, then use that single blended result as the `--sref`.

9. **--chaos must be 0 for consistency series work.** Any nonzero `--chaos` value increases variation between the 4 grid images, actively working against series consistency. It is not harmful in single-image generation but is counterproductive in series generation.

10. **Generate the simplest, clearest composition in the series first, not last.** The first successful result anchors the user's expectations and provides a mid-series drift comparison baseline. Saving the dramatic or complex composition for later means the user has an established visual to compare against rather than no reference.

---

## Edge Cases

### Significant Costume Changes Between Scenes (e.g., formal armor to swimwear to street clothes)
Clothing is weakly locked at `--cw 80-100` because the model infers appropriate clothing from the scene context unless told otherwise. When costume changes are intentional and significant, lower `--cw` to 50 or 0 (face-only mode). Describe the new costume explicitly in the variable section. The face and body proportions will still anchor the character identity. Test the most extreme costume change first -- if the face holds at `--cw 50`, all less extreme changes will also hold. If face fidelity degrades, rebuild the workflow at `--cw 70` with explicit facial description in the constant section.

### Matching an Existing Non-Midjourney Image (Photo, Illustration, or Other AI Model Output)
Upload the external image to a web host or Discord and use its URL as the `--cref` or `--sref` reference. For character reference from a photograph: the model extracts the face successfully but may struggle with illustrated or stylized source images -- test at `--cw 80` first. For style reference from a human artist's work or a photograph: set `--sw 400-600` to overcome the tendency toward Midjourney's native aesthetic. Add matching text style descriptors aggressively. Note that photorealistic source images used as `--sref` will pull Midjourney toward hyperrealism -- intentional if desired, accidental if not. Some highly stylized non-Midjourney art styles (e.g., anime, pixel art, ukiyo-e) are underrepresented in `--sref` extraction and may need text descriptors to fully compensate.

### Long Series (12+ Images) for Storybooks, Comics, or Game Assets
Generate in staged batches of 4-6. After each batch, select the most on-model image as a "checkpoint reference." Consider whether to update the `--cref` URL to a more recent on-model image mid-series (risky -- creates continuity discontinuity) or maintain the original reference throughout (safer -- consistent anchor). For 20+ image projects, build a prompt library document before starting any generation: one row per image, all prompts written, all parameters filled. Generate systematically. Introduce variation only through the variable section, never through parameter tweaks. For storybooks specifically, maintain consistent `--ar` (typically 3:4 or 4:3 for page layout) across all images. For comic strips, `--ar 16:9` per panel or `--ar 1:1` for square panel formats.

### Multiple Characters That Must Be Consistent With Each Other in Shared Scenes
Midjourney supports one `--cref` URL per prompt. For two-character scenes, designate a primary character for `--cref` and achieve secondary character consistency through highly specific text description alone. For three or more characters, consider whether compositing (generating characters separately and combining in external software) is more appropriate than multi-character prompting. Alternatively, for character pairs that always appear together, generate a reference image showing BOTH characters clearly in frame and use that two-character image as the single `--cref`. The model extracts both characters from a single reference more successfully than managing two separate references. Test this approach with `--cw 80` first.

### Style Consistency Without Any Reference Image (Text-Only Approach)
When no reference image is available, build a style descriptor block of 8-12 specific terms covering: art medium (oil painting, ink illustration, digital concept art), color temperature (warm golden tones, cool blue-gray palette), texture quality (rough brushwork, clean lines, soft edges), lighting approach (flat diffuse light, dramatic directional shadows), and compositional energy (dynamic, balanced, intimate). Use this block identically in every prompt. Add `--s 350-500` to amplify the stylize parameter's aesthetic commitment. This approach produces 60-75% of the visual consistency of `--sref` but degrades on subtle qualities like specific color relationships and textural nuance. Upgrade to `--sref` as soon as a suitable reference image is generated or located.

### Character Needs to Age, Transform, or Change Significantly Across the Series
Standard `--cref` at `--cw 80` holds the character at their reference-image state. For age progression (child to adult, young to old), use `--cw 0` (face-only mode) and describe age state explicitly in the variable section -- "same woman, aged 70, silver hair, deep wrinkles, same eyes." The facial structure anchors identity while text controls the age expression. For non-human transformations (human to werewolf, normal to armored), lower `--cw` progressively as the transformation increases. At full transformation (entirely non-human), `--cref` may provide minimal benefit -- lean on text and `--sref` for style continuity instead.

### Vary (Region) as a Drift Repair Tool
When a single element drifts in an otherwise acceptable image (wrong eye color, slightly different nose, one arm too long), do not regenerate the full image. Use Midjourney's Vary (Region) / inpainting tool: select only the drifted region, write a repair prompt describing the correct feature explicitly, and generate a targeted fix. This preserves 90%+ of the image while correcting one element. For recurring drift of the same feature across multiple images, the issue is systemic (the text prompt or `--cw` value is insufficient) and warrants fixing the template rather than inpainting every image individually.

---

## Example

**Input:** "I need 4 Midjourney images of the same fantasy elf warrior character in different settings: an enchanted forest, a grand castle throne room, a busy market, and a battlefield. The art style should be painterly fantasy illustration. I don't have a reference image yet."

---

**Output:**

## Consistency Strategy: Fantasy Elf Warrior Series

### Series Overview
- **Use case:** Fantasy illustration series (storybook or portfolio)
- **Character consistency:** Yes -- same elf (face, hair color and style, body type, ear shape, eye color)
- **Style consistency:** Yes -- painterly fantasy illustration, rich colors, natural lighting
- **Series size:** 4 images
- **Midjourney version:** v6.1
- **Aspect ratio:** --ar 3:2 -- rationale: landscape orientation suits environmental storytelling scenes
- **Stylize value:** --s 300 -- rationale: strong enough for painterly aesthetic without overriding character clarity

---

### Step 1: Reference Image Generation

**Character Reference Prompt:**
```
/imagine female elf warrior, pointed ears, silver-white braided hair falling to shoulders, emerald green eyes, high cheekbones, light olive skin, lean athletic build, wearing segmented leather armor with silver trim and green gemstone clasp, neutral standing pose facing camera, arms relaxed at sides, neutral expression, against a plain light gray studio background, full body view from head to toe, detailed fantasy character design, painterly illustration style --ar 2:3 --v 6.1 --s 300 --chaos 0
```

**Instructions:** Run this prompt. A 2:3 portrait ratio is used here specifically for reference clarity -- it is different from the 3:2 series ratio, and that is intentional. Select the grid variation where the face, ears, and hair are clearest and most appealing. Upscale it using U1-U4. Copy the URL of the upscaled image. This is `[CREF_URL]` for all subsequent prompts.

**Style Reference:** Use `[CREF_URL]` also as the `--sref` anchor. Setting `--sw 300` pulls the painterly illustration quality into every scene without letting the reference fight itself. Because the same URL serves both functions, keep `--sw` at 300 or below to prevent the style extraction from pulling unwanted character-specific composition elements into non-character areas of the frame.

---

### Step 2: Consistency Parameters

| Parameter | Value | Rationale |
|---|---|---|
| --cref | [CREF_URL] | Character anchor -- face, body, hair, proportions |
| --cw | 80 | Preserves face, hair, and body type; allows outfit adaptation per scene |
| --sref | [CREF_URL] | Style anchor -- extracts painterly fantasy aesthetic from reference |
| --sw | 300 | Strong enough for visible style consistency; low enough not to fight --cref |
| --seed | Obtain after Image 1 | React to Image 1 grid with ✉️ -- use seed for Images 2-4 for structural similarity |
| --ar | 3:2 | Landscape for all 4 scene images |
| --v | 6.1 | Stable, well-documented --cref behavior |
| --s | 300 | Consistent painterly rendering strength across all images |
| --chaos | 0 | Locked -- no within-grid variation allowed |

---

### Step 3: Prompt Template

**Constant section (copy-paste unchanged into every prompt -- do not retype):**
```
female elf warrior, pointed ears, silver-white braided hair, emerald green eyes, high cheekbones, lean athletic build, painterly fantasy illustration, rich saturated colors, detailed brushwork
```

**Full prompt template:**
```
female elf warrior, pointed ears, silver-white braided hair, emerald green eyes, high cheekbones, lean athletic build, [VARIABLE SCENE AND ACTION TEXT], painterly fantasy illustration, rich saturated colors, detailed brushwork --cref [CREF_URL] --cw 80 --sref [CREF_URL] --sw 300 --ar 3:2 --v 6.1 --s 300 --chaos 0
```

---

### Step 4: Series Prompts

**Image 1 -- Enchanted Forest**

Key consistency risk: Dappled green lighting may cause a green cast on skin and hair, making silver hair appear greenish-silver. If this occurs, add "natural skin tones, silver hair unaffected by ambient light" to the constant section for subsequent prompts.

```
/imagine female elf warrior, pointed ears, silver-white braided hair, emerald green eyes, high cheekbones, lean athletic build, standing in an ancient enchanted forest, enormous moss-covered oak trees with glowing runes carved into bark, shafts of golden dappled sunlight breaking through a dense leafy canopy, holding a recurve bow loosely at her side, alert watchful expression, medium shot from slightly below eye level, warm green and gold ambient light, lush ferns and glowing mushrooms at ground level, painterly fantasy illustration, rich saturated colors, detailed brushwork --cref [CREF_URL] --cw 80 --sref [CREF_URL] --sw 300 --ar 3:2 --v 6.1 --s 300 --chaos 0
```

After generating Image 1, react with ✉️ to get the seed. Add `--seed [number]` to Images 2, 3, and 4.

---

**Image 2 -- Grand Castle Throne Room**

Key consistency risk: Stone interior and torchlight create warm orange light that may shift skin tone. The formal armor mentioned in the variable section may conflict with `--cw 80` pulling leather armor from the reference. If armor conflict appears, lower `--cw` to 60 and describe the formal armor more explicitly.

```
/imagine female elf warrior, pointed ears, silver-white braided hair, emerald green eyes, high cheekbones, lean athletic build, standing before a grand stone throne in a medieval fantasy castle throne room, tall stained glass windows casting multicolored light across a marble floor, wearing polished silver plate armor with a flowing crimson cape, standing at attention with one hand on the pommel of a sheathed longsword, regal composed expression, long shot showing full figure and grand architectural space, torchlight and stained glass ambient lighting, crimson and gold banners on stone columns, painterly fantasy illustration, rich saturated colors, detailed brushwork --cref [CREF_URL] --cw 80 --sref [CREF_URL] --sw 300 --seed [SEED] --ar 3:2 --v 6.1 --s 300 --chaos 0
```

---

**Image 3 -- Busy Market**

Key consistency risk: Crowded scene with many background figures may dilute the model's attention on the main character, causing feature softening. If the character's features become less distinct, reduce background crowd detail by changing "bustling crowd of diverse fantasy merchants and townsfolk" to "a few scattered merchants in background." Also, casual clothing requested here is the largest departure from the reference armor -- if `--cw 80` still pulls armor elements, lower to `--cw 50`.

```
/imagine female elf warrior, pointed ears, silver-white braided hair, emerald green eyes, high cheekbones, lean athletic build, walking through a vibrant outdoor fantasy market at midday, colorful merchant stalls selling herbs and scrolls and enchanted trinkets, wearing a simple linen traveling shirt and dark trousers with a leather belt and short dagger at hip, browsing a stall displaying glowing blue potions, relaxed curious expression, medium shot from eye level, warm afternoon sunlight, bustling crowd of diverse fantasy merchants and townsfolk in background, painterly fantasy illustration, rich saturated colors, detailed brushwork --cref [CREF_URL] --cw 80 --sref [CREF_URL] --sw 300 --seed [SEED] --ar 3:2 --v 6.1 --s 300 --chaos 0
```

---

**Image 4 -- Battlefield**

Key consistency risk: Dramatic stormy backlighting is the highest drift risk in the series. Strong directional back-lighting reduces facial detail. Use "clearly visible face despite dramatic lighting, three-quarter side lighting" to ensure the face is not entirely silhouetted. Smoke and chaos in the scene description increases background complexity -- if character features degrade, simplify the battlefield background description.

```
/imagine female elf warrior, pointed ears, silver-white braided hair, emerald green eyes, high cheekbones, lean athletic build, standing on a hilltop overlooking a massive fantasy battle, stormy dark sky with dramatic breaks of golden light through storm clouds, wearing battle-worn leather armor splattered with mud, wielding a glowing emerald-bladed longsword raised overhead, fierce determined expression, clearly visible face despite dramatic lighting, three-quarter side lighting on face, wide shot showing character against epic battle panorama with distant armies clashing, smoke and magical explosions in background, painterly fantasy illustration, rich saturated colors, detailed brushwork --cref [CREF_URL] --cw 80 --sref [CREF_URL] --sw 300 --seed [SEED] --ar 3:2 --v 6.1 --s 300 --chaos 0
```

---

### Step 5: Drift Management Protocol

**If face changes between images (most common drift):**
- Immediate fix: Increase `--cw` to 100. Add to the constant section: "high cheekbones, small straight nose, full lips, large emerald eyes widely spaced." More specificity in text description is the fastest fix.
- Escalation: If face still drifts at `--cw 100`, regenerate the character reference image. Upscale a different grid variation from the original reference prompt. Try the new URL.

**If hair color shifts (silver to white or blond):**
- Immediate fix: Add "silver-white hair, not yellow, not blonde, not white, cool metallic silver" to the constant section. Negative color reinforcement in text is effective for color-specific drift.
- Escalation: Increase `--sw` to 500 so the style reference's color palette exerts stronger influence.

**If art style becomes inconsistent between images:**
- Immediate fix: Confirm `--s 300` is identical across all prompts. Increase `--sw` to 450. Add "consistent painterly technique, same illustration style throughout" to end of constant section.
- Escalation: Generate a dedicated style reference image using the best-looking image from the series so far. Use this new URL as `--sref` instead of the original character reference.

**If costume elements from the reference bleed into scenes where they should not appear:**
- Immediate fix: Lower `--cw` to 60. Describe the intended costume more explicitly and earlier in the variable section.
- Escalation: Lower to `--cw 50` and add a negative prompt describing the unwanted element: `--no leather armor` (for the castle throne room scene, for example).

**Generation order for minimum drift risk:** Image 1 (Forest) → Image 2 (Castle) → Image 3 (Market) → Image 4 (Battlefield). Begin with the scene that most closely matches the reference image's neutral background and lighting (forest has the closest ambient light to the studio reference). Build toward increasing lighting drama. Validate character fidelity at each step before proceeding.
