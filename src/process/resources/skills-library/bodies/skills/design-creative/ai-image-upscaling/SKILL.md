---
name: ai-image-upscaling
description: |
  Produces AI image upscaling and detail enhancement specifications for Midjourney upscale variants, DALL-E edit mode, and Stable Diffusion img2img with model-specific parameters.
  Use when the user asks to upscale an AI-generated image, enhance detail, increase resolution, or improve quality of an existing AI image.
  Do NOT use for initial image generation (use model-specific prompting skills), style transfer (use ai-image-style-transfer), or prompt debugging (use ai-image-prompt-debugging).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-image-generation design checklist"
  category: "design-creative"
  subcategory: "ai-image-generation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# AI Image Upscaling

## When to Use

**Use this skill when:**
- The user has an existing AI-generated image (from Midjourney, DALL-E, Stable Diffusion, Flux, or similar models) and wants to increase its pixel dimensions
- The user needs to prepare an AI image for print at a specific DPI target (300 DPI for commercial print, 150 DPI for large format, 72-96 DPI for web)
- The user wants to enhance fine detail -- sharpening textures, recovering edge definition, or adding micro-detail -- without regenerating from scratch
- The user has a Midjourney grid (512x512 per cell) or unupscaled generation and needs to get to a usable working resolution
- The user wants to chain multiple upscaling passes (model-native upscale then external AI upscale then manual touchup) for maximum output quality
- The user has Stable Diffusion img2img capabilities and wants guidance on denoising strength, tile configuration, and upscaler model selection
- The user is comparing upscaling options (Real-ESRGAN vs. Topaz vs. SD HiRes Fix vs. Controlnet tile) and needs a concrete recommendation
- The user is targeting a specific deliverable resolution: social media crop, print file for a commercial printer, large-format banner, or product mockup

**Do NOT use when:**
- The user wants to generate a new image from a text prompt -- use the appropriate model-specific prompting skill instead
- The user wants to change the visual style of an image (adding painterly look, switching to anime aesthetic, applying color grading) -- use `ai-image-style-transfer`
- The user's image is not AI-generated but is a photograph or scanned artwork -- photographic upscaling has different tools and considerations outside this skill's scope
- The user's prompt is producing low-quality outputs and they want to fix the generation logic -- use `ai-image-prompt-debugging`
- The user wants to create a series of images with consistent character or style -- use `midjourney-consistency` or equivalent
- The user wants to remove specific objects, fill regions with new content, or inpaint large areas -- that is generative inpainting, not upscaling
- The user's core problem is aspect ratio or composition cropping rather than resolution increase -- outpainting skills apply instead

---

## Process

### Step 1: Assess the Source Image and Establish Requirements

Before selecting any method, gather the four critical variables that determine every downstream decision.

- **Source model and version:** Midjourney v5.2, v6, v6.1, or v7; DALL-E 2, DALL-E 3, or GPT-image-1; Stable Diffusion 1.5, SDXL 1.0, SDXL Turbo, SD 3.0, or Flux.1; each has different native resolutions and built-in upscale capabilities
- **Current pixel dimensions:** Ask the user to confirm exact width x height. Common native outputs: Midjourney grid cells are 512x512 (v4) or 512x512--1024x1024 (v5+); DALL-E 3 outputs 1024x1024, 1024x1792, or 1792x1024; SDXL native is 1024x1024 with optimal latent space at that resolution
- **Target use case:** Screen (social media at 1080x1080, 4K monitor at 3840x2160), print (300 DPI at stated physical dimensions), large format (150 DPI or even 100 DPI acceptable), or digital editorial (72-96 DPI at pixel dimensions matching layout)
- **Style category of the image:** Photorealistic, illustrative/painterly, anime/flat-color, graphic/typographic, abstract -- this determines which upscaler model and denoising setting to use
- **Acceptable deviation from original:** Some users want pixel-perfect upscaling (no new content added); others want enhancement with plausible new detail; establish this before touching a setting
- **Compute environment:** Does the user have access to Stable Diffusion locally (GPU VRAM: 6 GB, 8 GB, 12 GB, 24 GB or more), Automatic1111/ComfyUI, cloud inference, or only browser-based tools?

---

### Step 2: Calculate Target Pixel Dimensions

Never let the user proceed without a confirmed pixel target. Vague targets like "higher resolution" cause wasted iterations.

- **Print resolution formula:** Target pixels = physical dimension (inches) x DPI. A 16x20 inch print at 300 DPI requires 4800 x 6000 pixels. At 150 DPI (poster, viewed from 3+ feet), the same print needs only 2400 x 3000 pixels -- a 4x difference in total pixel count.
- **DPI thresholds by application:**
  - Commercial print (books, magazines, photo prints): 300 DPI minimum
  - Fine art Giclée print: 360-400 DPI (many printers use a 360 DPI grid)
  - Large format poster (viewed 1-3 feet): 150-200 DPI
  - Billboard and trade show graphics (viewed 6+ feet): 72-100 DPI
  - Retina screen display (72 PPI physical but 2x device ratio): 144 effective PPI
  - Standard web/social: 72-96 DPI at native pixel dimensions

- **Pixel dimension reference table:**

| Print Size | 300 DPI | 150 DPI | 100 DPI |
|---|---|---|---|
| 4x6 in | 1200 x 1800 | 600 x 900 | 400 x 600 |
| 5x7 in | 1500 x 2100 | 750 x 1050 | 500 x 700 |
| 8x10 in | 2400 x 3000 | 1200 x 1500 | 800 x 1000 |
| 11x14 in | 3300 x 4200 | 1650 x 2100 | 1100 x 1400 |
| 16x20 in | 4800 x 6000 | 2400 x 3000 | 1600 x 2000 |
| 18x24 in | 5400 x 7200 | 2700 x 3600 | 1800 x 2400 |
| 24x36 in | 7200 x 10800 | 3600 x 5400 | 2400 x 3600 |
| A4 (8.27x11.69 in) | 2480 x 3508 | 1240 x 1754 | 827 x 1169 |
| A3 (11.69x16.54 in) | 3508 x 4961 | 1754 x 2480 | 1169 x 1654 |

- **Determine scale factor:** Divide the target dimension by the source dimension. A 1024x1024 source targeting 4800x6000 requires 4.69x horizontal and 5.86x vertical -- this is an uneven scale that requires a crop decision. Always flag when source and target aspect ratios differ significantly.
- **Identify the practical ceiling:** Beyond 8x upscale from the original, any AI upscaler is largely synthesizing new content rather than recovering existing detail. At 2x-4x, the upscaler is interpolating and enhancing real content. At 4x-8x, it is guided hallucination. At 8x+, it is essentially generation. Set expectations accordingly.

---

### Step 3: Select the Upscaling Method by Source Model

The source model determines which native tools are available. Always use the native tool first, then chain external upscalers.

#### Midjourney Upscaling (v5.2, v6, v6.1, v7)

- **Grid output resolution:** v5.2 grids are 2048x2048 total (four 1024x512 ish cells depending on aspect ratio). v6 and v6.1 grids are 2048x2048 total (512x512 per cell at 1:1). v7 grids maintain the same grid structure but with improved base detail.
- **U1-U4 base upscale (first click):** Generates a single image at ~1024x1024 (1:1) or proportionally scaled for non-square. This is the starting point for all further upscaling.
- **Upscale (Subtle):** Increases to ~2048x2048 at 1:1. Uses a conservative detail-preserving interpolation with minimal hallucination. Preservation score is high. Color and composition remain nearly identical to the selected grid cell. Best for: graphic art, logos, character consistency, illustrations with deliberate style, any case where "no surprises" matters.
- **Upscale (Creative):** Increases to ~2048x2048 at 1:1. Runs a secondary diffusion pass informed by the original, adding plausible new micro-detail (pores in skin, individual strands of hair, fabric weave texture). Best for: photorealistic portraits, landscapes, detailed objects where the extra synthesis reads as genuine enhancement. Risk: can introduce incorrect detail (extra fingers, distorted text, changed patterns).
- **Vary (Strong) vs. Vary (Subtle):** These are variation tools, not upscalers -- do not conflate with the upscale buttons. Vary generates new compositions; upscale increases resolution of existing composition.
- **Redo upscale:** Midjourney allows regenerating the upscale pass. If the first Creative upscale introduced an artifact, re-running it will produce a different result from the same base. Use this before resorting to external repair.
- **Native resolution ceiling:** 2048x2048 (or proportional). For anything beyond this, Midjourney images must be exported as PNG and processed externally.

#### DALL-E / GPT-image-1 Upscaling

- **DALL-E 3 native resolution limits:** 1024x1024, 1024x1792, 1792x1024. No built-in upscale button exists. There is no equivalent of Midjourney's U-buttons.
- **Edit/inpainting as a quality enhancement tool:** DALL-E 3 and GPT-image-1 support edit mode where you provide an image, a mask, and a prompt. You can regenerate soft or blurry regions while keeping others intact. This is not true upscaling but is the primary native enhancement path.
- **Re-prompting at maximum resolution:** For DALL-E, the highest-quality path is to request the image again at the largest supported size with a prompt that reinforces detail: "extremely detailed, sharp focus, professional photograph, high resolution" and matching the original prompt closely. Accept that the result will differ compositionally.
- **GPT-image-1 specifics:** Supports 1024x1024 as the standard output. Edit mode enables localized regeneration. Use the same mask-and-prompt technique for weak areas.
- **Effective path for DALL-E images needing print resolution:** Export at 1024x1024, then apply Real-ESRGAN x4plus for a 4096x4096 output, then optionally a second 2x pass for 8192x8192. This provides 300 DPI quality up to approximately 13x13 inches.
- **Do not attempt to "prompt-upscale" DALL-E by asking for "the same image but at 8K":** The model generates a new image at the same fixed resolutions regardless of resolution language in the prompt.

#### Stable Diffusion Upscaling

SD has the richest upscaling toolkit. Choose the method based on available VRAM, desired control, and style of image.

**Method 1: SD img2img with resolution scaling**
- Load the original image into img2img
- Set the target resolution (e.g., 2x the original: 1024 to 2048, or 1024 to 2048x1365 for non-square)
- Denoising strength controls the balance between preservation and regeneration:
  - 0.10-0.20: Near-lossless upscale. Adds minimal new detail. Safe for any image. Output will be slightly sharper than pure interpolation.
  - 0.20-0.35: Low-detail enhancement. The sweet spot for most upscaling tasks. Adds believable micro-texture without altering composition.
  - 0.35-0.50: Moderate regeneration. Useful for photorealistic images where you want enhanced skin texture, fabric detail, or foliage complexity. Risk of minor compositional shifts.
  - 0.50-0.65: High regeneration. Significant new content. Elements may shift position. Use only when original has major quality defects to repair.
  - 0.65+: Near-full regeneration. Effectively a new image guided by the original. Not upscaling -- use img2img variation skills instead.
- Always use the same checkpoint model and LoRAs that generated the original image if known. Mismatched models introduce style drift even at low denoising.
- Prompt should match the original generation prompt. Include detail-encouraging suffixes: "masterpiece, best quality, ultra-detailed, 8k uhd, sharp focus" for photorealistic; "linework, clean lines, sharp" for illustration.
- Negative prompt should include: "blurry, soft focus, low quality, jpeg artifacts, compression artifacts, upscaling artifacts, haloing"
- CFG scale: keep same as original (typically 7.0 for SD 1.5, 4.0-7.0 for SDXL). Do not increase CFG to try to force more detail -- this introduces saturation artifacts.
- Sampler: DPM++ 2M Karras or DPM++ SDE Karras work well for upscaling at 20-30 steps. DDIM at 50 steps is effective for lower denoising (<0.3). Do not use Euler a above 0.4 denoising -- it is too stochastic.

**Method 2: SD Upscale (Tiled) / Ultimate SD Upscale (Automatic1111 script)**
- Breaks the image into tiles (512x512 or 768x768 default), runs img2img on each tile with overlap, then stitches
- Allows upscaling to 4x-8x without VRAM constraints -- a 6 GB GPU can process individual tiles regardless of final image size
- Key parameters:
  - Tile size: 512 (SDXL should use 768 or 1024 tiles)
  - Tile overlap: 64 pixels minimum, 128 pixels recommended. Below 64 produces visible seam lines.
  - Seam fix method: "Half tile offset pass" (best quality, slowest) or "Band pass" (faster, slightly visible seams at high denoising)
  - Denoising: 0.20-0.35 for consistency. Higher denoising creates tile-to-tile inconsistency because each tile is an independent diffusion process -- adjacent tiles will have subtly different lighting or texture interpretations.
- Ultimate SD Upscale (community script) is significantly better than the stock SD Upscale: it adds seam-fixing passes, better tile overlap handling, and target resolution input by pixel count rather than multiplier.

**Method 3: Built-in AI upscalers (Extras tab in Automatic1111)**
- These are pure upscaler networks -- no diffusion, no prompt, just learned upscaling
- Run directly without VRAM constraints (they use much less memory than diffusion)
- Comparison table:

| Upscaler | Scale | Best For | Notes |
|---|---|---|---|
| Real-ESRGAN 4x+ | 2x-4x | Photorealistic general | Fastest, highest quality for photos |
| Real-ESRGAN 4x+ Anime6B | 2x-4x | Anime, flat illustration, vector-like | Reduces halftone, preserves clean lines |
| ESRGAN 4x | 2x-4x | Older photorealistic images | Legacy, generally worse than Real-ESRGAN |
| SwinIR 4x | 2x-4x | General, sharper edges than ESRGAN | Slightly slower, good for text and graphics |
| BSRGAN 4x | 2x-4x | Compressed or noisy sources | Strong denoising, smooths some fine detail |
| LDSR | 2x-4x | Maximum quality, slow | 100-200x slower, marginally better for faces |
| R-ESRGAN General WDN 4x | 2x-4x | Compressed web images | Handles JPEG block artifacts well |
| 4x-UltraSharp | 2x-4x | Photorealistic ultra detail | Community model, excellent for faces/detail |
| 4x-Remacri | 2x-4x | Mixed media, moderate detail | Good all-rounder community model |

- For maximum quality, apply 2x Real-ESRGAN twice rather than one 4x pass. The two-pass approach produces slightly better edge quality at the cost of processing time.
- Chain upscalers: Real-ESRGAN 2x, then SwinIR 2x for hybrid quality (sharpness from SwinIR, smoothness from ESRGAN).

**Method 4: HiRes Fix (Automatic1111 / ComfyUI)**
- Built into the txt2img pipeline -- not a post-processing step but a two-stage generation
- First pass generates at a low resolution (512x512 or 768x768), then HiRes Fix runs an upscale + img2img pass to the final resolution
- Best when you control the original generation: set HiRes fix from the start to avoid running a separate upscale step
- HiRes upscaler choices: Latent (Bicubic) is a good default; using a Real-ESRGAN network as the HiRes upscaler produces better edge detail
- HiRes denoising: 0.5-0.7 is the typical range (higher than post-processing img2img because it is part of the generation loop)
- Steps for HiRes pass: 15-25 is sufficient. It does not need to match the first pass step count.

**Method 5: ControlNet Tile for Upscaling**
- Uses the ControlNet Tile preprocessor, which treats the image as a tiled control signal for a new generation
- Works at full diffusion strength (0.7-1.0 denoising) while still preserving overall composition because the tile map locks spatial structure
- Better than pure img2img at high denoising because tile conditioning reduces drift
- Set ControlNet Tile weight: 0.55-0.75. Lower allows more creative enhancement; higher enforces structure.
- Use with Real-ESRGAN pre-upscale: run Real-ESRGAN 2x first, then ControlNet Tile img2img at 0.4-0.6 denoising for the quality enhancement pass
- This pipeline is the current best-practice for photorealistic enhancement with maximum detail recovery

---

### Step 4: Build the Upscaling Pipeline

Translate the method selection into a concrete sequence of operations with specific settings at each step.

- **Single-step pipeline (screen display, moderate upscale):** Use when target is 2x the source and quality requirements are non-critical
  - Midjourney: Upscale Subtle → export PNG → done
  - DALL-E: Export at max resolution → Real-ESRGAN 4x → resize down to target → done
  - SD: HiRes Fix at generation time or Real-ESRGAN Extras tab → done

- **Two-step pipeline (print under 11x14, 4x scale):** Use for most print deliverables
  - Step 1: Native model upscale (MJ Subtle or Creative, SD HiRes Fix, DALL-E export)
  - Step 2: Real-ESRGAN x4plus or 4x-UltraSharp to target resolution
  - Optionally: Sharpening pass in image editor (Unsharp Mask: Radius 0.5-1.0 px, Amount 50-80%, Threshold 2)

- **Three-step pipeline (large format, 6x-8x scale, maximum quality):**
  - Step 1: Native model upscale to model ceiling
  - Step 2: Real-ESRGAN 4x to intermediate resolution
  - Step 3: SD img2img with ControlNet Tile at denoising 0.3-0.45 for final detail enhancement
  - Step 4 (optional): Manual repair of persistent artifacts in post

- **Chaining scale factor:** Document the cumulative scale at each step. Starting from 1024 px: after MJ Subtle = 2048 px (2x), after Real-ESRGAN 4x = 8192 px (8x total from original). The 8x total is the practical ceiling -- beyond here, additional steps degrade quality regardless of technique.

- **Match model to style at every step:** If the image is an anime illustration, every SD pass should use an anime-specialized checkpoint and the Real-ESRGAN Anime6B model, not the photorealistic equivalents. Cross-style model mismatch is the single most common cause of degraded upscale quality.

---

### Step 5: Specify All Settings Precisely

Document every parameter so the user can reproduce the result exactly.

- **For SD img2img:** Checkpoint name and hash, VAE in use (use the matched VAE -- a wrong VAE will introduce color shifts), LoRA names and weights if any were used in original, sampler, step count, CFG, denoising strength, seed (-1 for random or fixed seed from original), image dimensions, prompt, negative prompt
- **For external upscalers:** Model name and version (Real-ESRGAN_x4plus vs. Real-ESRGAN_x4plus_anime6B), scale factor, output format (PNG for lossless intermediate steps, TIFF for print delivery, JPEG 90-95 quality only for final web delivery)
- **For Midjourney:** The U-button number used (U1-U4), whether Subtle or Creative was selected, the job ID if the user needs to share or reproduce
- **Output format at each step:** Always use lossless (PNG or TIFF) for intermediate files. Only apply lossy compression (JPEG) at the very final delivery step, and never below quality 90 for print, never below quality 80 for web.

---

### Step 6: Define the Quality Verification Process

Automated upscaling frequently introduces artifacts. Specify exactly what to check.

- **Haloing:** Bright or dark outline artifact around high-contrast edges (e.g., dark hair against light sky). Caused by oversharpening or aggressive upscaler settings. Fix: reduce upscaler sharpness weight or apply median filter locally.
- **Tiling seams:** Visible grid lines or abrupt texture changes at regular intervals. Caused by insufficient tile overlap in tiled upscaling. Fix: increase overlap to 128 px or enable "seam fix" in Ultimate SD Upscale.
- **Texture plasticization:** Skin or fabric looks unnaturally smooth and waxy. Caused by ESRGAN over-smoothing at 4x in a single pass. Fix: use two 2x passes instead of one 4x pass, or add a mild grain layer in post.
- **Detail hallucination:** Fingers, eyes, text, or repeating patterns show incorrect geometry added by the upscaler's diffusion pass. Caused by high denoising strength in img2img or aggressive Creative upscale in Midjourney. Fix: reduce denoising strength, or use inpainting to correct specific areas.
- **Color shift:** Hue or saturation changes between source and upscaled version. Caused by VAE mismatch in SD or color profile handling. Fix: do a color match adjustment layer in post (match source color distribution to upscaled).
- **JPEG blocking amplification:** Block artifacts from JPEG compression of the source get enhanced by the upscaler. Fix: apply a light deblocking filter or BSRGAN before the main upscale pass.
- **Verification workflow:** Compare at 100% zoom (actual pixels), at print preview scale, and with a side-by-side difference overlay if available.

---

### Step 7: Deliver the Specification and Manage Expectations

Communicate limitations clearly alongside the technical plan.

- State the fidelity level: a 2x upscale of a clean source has very high fidelity to the original. A 4x upscale adds synthesized detail. An 8x upscale is largely speculative reconstruction and results will diverge from the original.
- For print: always recommend requesting a physical proof from the print shop before a production run. Screen preview at 100% zoom represents print quality at the viewing distance where the number of screen pixels equals the print pixels. A 3000x4000 pixel image displayed full screen on a 1080p monitor is showing approximately 2.8x upscale -- if it looks sharp on screen at that scale, it will look sharp at 300 DPI for the print size.
- For delivery to external parties: confirm file format requirements. Commercial printers typically want TIFF or PDF at 300 DPI with embedded color profile (sRGB for digital print, Adobe RGB or CMYK for offset). Do not deliver JPEG for print.
- Note regeneration as an alternative: if the source image is under 512x512 and the quality is already poor, upscaling will amplify the flaws. In these cases, recommend regenerating the image at the source model's maximum resolution and treating upscaling as the second step, not the repair tool.

---

## Output Format

```
## AI Image Upscaling Specification

### Source Analysis
- **Source model and version:** [e.g., Midjourney v6.1, SD XL 1.0, DALL-E 3]
- **Current dimensions:** [width x height px]
- **Current estimated DPI at intended output size:** [calculated value]
- **Image style category:** [photorealistic / illustrative / anime / graphic / abstract]
- **Quality defects in source:** [e.g., soft edges, JPEG artifacts, low base detail, none]
- **Original prompt (if available):** [or "unknown"]

### Target Requirements
- **Intended use:** [screen / commercial print / large format / editorial]
- **Physical output size (if print):** [W x H inches/mm]
- **Required DPI:** [300 / 200 / 150 / 96 / other]
- **Target pixel dimensions:** [width x height px]
- **Required scale factor:** [e.g., 2.0x, 4.0x, 5.8x]
- **Aspect ratio note:** [matched / source crop required -- specify which dimension to crop]

### Recommended Pipeline

| Step | Method | Tool | Key Settings | Input Resolution | Output Resolution |
|------|--------|------|-------------|-----------------|-------------------|
| 1 | [e.g., Native MJ Upscale] | [Midjourney] | [Subtle] | [1024x1024] | [2048x2048] |
| 2 | [e.g., AI Upscaler] | [Real-ESRGAN] | [4x+, PNG] | [2048x2048] | [8192x8192] |
| 3 | [e.g., Detail Enhancement] | [SD img2img] | [denoise 0.30, ControlNet Tile 0.65] | [8192x8192] | [8192x8192] |
| 4 | [e.g., Final resize] | [Image editor] | [Bicubic, target DPI] | [8192x8192] | [target px] |

### Step-by-Step Settings

**Step 1: [Method Name]**
[Detailed settings for this step]
- Setting A: [value]
- Setting B: [value]
- Expected output: [description]

**Step 2: [Method Name]**
[Detailed settings for this step]
- Setting A: [value]
- Setting B: [value]
- Expected output: [description]

[Continue for each step]

### Stable Diffusion Parameters (if applicable)
- **Checkpoint:** [model name]
- **VAE:** [vae name or "baked in"]
- **Sampler:** [e.g., DPM++ 2M Karras]
- **Steps:** [number]
- **CFG Scale:** [value]
- **Denoising Strength:** [value]
- **Prompt:** [text]
- **Negative Prompt:** [text]
- **Seed:** [value or -1]
- **ControlNet:** [model, weight, preprocessor if applicable]

### Midjourney Parameters (if applicable)
- **Grid cell selected:** U[1/2/3/4]
- **Upscale type:** Subtle / Creative
- **Current job resolution:** [value]
- **Post-export tool:** [external upscaler if required]

### Output File Specifications
- **Intermediate file format:** PNG (lossless, all steps except final)
- **Final delivery format:** [TIFF at 300 DPI / PNG / JPEG 90+ / PDF]
- **Color profile:** [sRGB / Adobe RGB / CMYK -- specify only for print]
- **Final pixel dimensions:** [width x height]
- **Final file size estimate:** [approximate MB]

### Quality Verification Checklist
- [ ] No halo or ringing artifacts at high-contrast edges
- [ ] No tiling seam artifacts at regular intervals
- [ ] Textures natural (not plastic/waxy smoothing from ESRGAN over-smoothing)
- [ ] Text and fine typography remain legible (if applicable)
- [ ] Face and hand anatomy correct (no hallucinated digits or distorted features)
- [ ] Color/saturation matches original (no VAE or profile shift)
- [ ] Repeating patterns (fabric, tile, foliage) remain coherent
- [ ] Viewed at 100% zoom and at intended display/print scale
- [ ] Aspect ratio and crop reviewed for composition

### Limitations and Expectations
- **Fidelity level:** [High (2x) / Moderate (4x) / Speculative (6x+)]
- **Known risks for this image:** [specific to this image's style and content]
- **Alternative if quality is insufficient:** [e.g., regenerate at source model max resolution]
- **Proof recommendation:** [physical proof before print run / screen proof at 100% zoom]
```

---

## Rules

1. **Never upscale from a JPEG source without deblocking first.** JPEG block artifacts at 8x8 pixel boundaries will be amplified by every upscaling method. Apply BSRGAN or the Real-ESRGAN WDN model for deblocking as the first step when the source is JPEG, especially under quality 90.

2. **Denoising strength above 0.50 is not upscaling -- it is regeneration.** Beyond 0.50, SD img2img introduces compositional changes, not just detail enhancement. Never recommend values above 0.50 for upscaling without explicitly flagging that the result will deviate from the original.

3. **Always specify lossless PNG or TIFF for intermediate steps.** Applying JPEG compression between pipeline steps compounds quality loss. Every re-save as JPEG re-introduces blocking artifacts. JPEG is only acceptable at the final delivery step.

4. **Tile overlap must be 64 pixels minimum; 128 is strongly preferred.** Tiled upscaling with less than 64 px overlap produces a visible grid pattern across the image. This is the most common beginner mistake with Ultimate SD Upscale and cannot be fixed post-hoc.

5. **Match the upscaler model to the image style -- this is not optional.** Real-ESRGAN x4plus on an anime illustration introduces a photorealistic texture overlay that destroys the art style. Real-ESRGAN Anime6B on a photorealistic portrait produces an uncanny illustration effect. Mismatched upscaler models produce worse results than simple bicubic interpolation.

6. **Use the same checkpoint and VAE in every SD pass.** A VAE mismatch between the original generation and the upscaling pass introduces color saturation shifts, particularly in shadows and highlights. If the original VAE is unknown, use the VAE associated with the checkpoint being used for the upscale pass consistently.

7. **The 8x total scale factor is the practical quality ceiling.** From 512 px to 4096 px (8x) is achievable with good multi-step pipelines. From 512 px to 8192 px (16x) is largely synthetic hallucination. Always calculate the total scale factor from the original unupscaled source, not from the current intermediate resolution.

8. **Print delivery files must have an embedded color profile.** Delivering a TIFF or PNG without an embedded sRGB or Adobe RGB profile to a commercial printer will result in unpredictable color reproduction. Always embed the profile at the final export step.

9. **Calculate required pixel dimensions before starting any upscaling pipeline.** Upscaling to "as high as possible" without a target is wasteful and often produces files far larger than the printer's system can handle. 300 DPI at an 8x10 print is 2400x3000 px -- a 24 MB PNG, well within all workflows. At the same DPI for a 36x48 poster, the file is 432 MB and may exceed standard print submission limits.

10. **Midjourney Creative upscale can introduce anatomical errors at high-detail enhancement.** Faces, hands, and text are the highest-risk areas. If the original image contains these elements and they are correct, always try Subtle first. Creative is appropriate only when the original detail in those areas is already damaged or unacceptably soft.

---

## Edge Cases

### Very Small or Heavily Degraded Source (under 256x256, or JPEG quality under 70)

A 256x256 source contains only 65,536 pixels of information. A 4x upscale to 1024x1024 produces 1,048,576 pixels -- 94% of which must be synthesized. The result cannot be reliable regardless of the upscaler used. Handling:
- First, attempt to regenerate the image at the source model's maximum resolution using the same prompt. This is always better than upscaling a small source.
- If the source must be used as-is (the exact composition is irreproducible), apply Real-ESRGAN at 2x maximum per pass, with multiple conservative passes rather than one aggressive pass.
- For JPEG quality below 70: apply BSRGAN or Real-ESRGAN WDN first. This removes blocking artifacts before the detail upscaling pass. Without this step, the upscaler will faithfully reproduce and enlarge the JPEG block grid.
- Accept that the output will be soft and have moderate hallucination of fine detail. State this explicitly so the user does not expect a 1024x1024 with original fidelity.

### Image Contains Critical Typography or Logos

Text is processed character-by-character by diffusion models -- the model has no understanding that a pixel cluster represents a letter. Upscaling at any denoising above 0.20 in SD img2img risks introducing character mutations (serifs that change, letter spacing that shifts, numerals that invert). Handling:
- For Midjourney: always use Upscale Subtle. Never use Creative on images where text accuracy is required.
- For SD img2img: set denoising to 0.10-0.15 maximum. Use a pure upscaler (Real-ESRGAN via Extras tab) rather than diffusion img2img.
- For logos: use the pure upscaler path only (Real-ESRGAN SwinIR). Zero diffusion. Add "sharp text, crisp typography" to the prompt if any diffusion pass is unavoidable but mask the text region with inpainting masked areas set to "original" (invert mask) to protect it.
- Best practice: reconstruct text and logos as vector overlays in a post-processing step (Illustrator, Inkscape) rather than relying on upscaling to preserve them. Upscaled raster text at print resolution is always inferior to properly typeset vector text placed on top of the upscaled background.

### Tiled Upscaling Producing Inconsistent Lighting Across Tiles

When Ultimate SD Upscale processes at denoising 0.35+, each tile undergoes an independent diffusion pass. Areas near a window might receive different lighting interpretation in adjacent tiles, producing a patchwork appearance. Handling:
- Reduce denoising to 0.20-0.25. This is the primary fix. Below 0.25, tiles are sufficiently constrained by the source to remain consistent.
- Increase tile overlap to 192 or 256 pixels. Larger overlap means the seam-fix pass has more context to blend between tiles.
- Enable "Half tile offset pass" in Ultimate SD Upscale -- this runs a second offset tiling pass and averages the results, dramatically reducing tile inconsistency.
- Check that the image prompt does not include highly spatially specific language ("light from left", "shadows falling right") that might interact differently with each tile.
- For images with highly directional light (dramatic sunset, single spotlight), consider ControlNet Tile instead of tiled img2img -- the tile conditioning maintains directional consistency better than raw denoising.

### Aspect Ratio Mismatch Between Source and Target

A 1:1 square AI image being prepared for a 16:9 landscape print (or 2:3 portrait print) requires a crop decision that significantly affects composition. Handling:
- Calculate the pixel crop required: for a 1024x1024 source targeting a 16:9 format at 1920x1080, you must crop the source to 1024x576 (removing 224 pixels from top/bottom), losing 27.7% of the image height.
- Present the user with the crop preview before upscaling. There is no point upscaling to maximum quality if the user will reject the composition crop.
- If the crop removes a critical element: suggest Midjourney's outpainting (pan tool) to extend the canvas before upscaling, or SD inpainting/outpainting to synthesize new content at the edges.
- For SD, use the aspect-locked outpaint first, then upscale the extended image. Upscaling then cropping loses quality; extending then upscaling preserves maximum resolution in the final crop.
- When the source image has relevant content near the edges, always flag this to the user explicitly. Do not silently assume center-crop is acceptable.

### Batch Upscaling 20+ Images for Consistent Series

Batch processing introduces the risk of inconsistent settings producing visible variation across a series. Handling:
- Define and lock all settings before processing: same checkpoint, same VAE, same denoising, same upscaler model, same tile size, same overlap. Document these in a processing log.
- Test on exactly 3 representative images before committing to the full batch: one with faces, one with complex background, one with text if applicable. Verify all checklist criteria on these three before batching.
- Use SD batch img2img with a fixed seed offset of 0 or a consistent increment. Random seeds across a batch will produce variable enhancement -- some images will gain more detail, some will change slightly. For consistency, use seed = -1 (random) only if visual style variation is acceptable.
- Real-ESRGAN command-line (realesrgan-ncnn-vulkan) handles true batch processing: `./realesrgan-ncnn-vulkan -i input_folder/ -o output_folder/ -n realesrgan-x4plus -f png`. This processes all images in the folder with identical settings.
- For Midjourney batch upscaling (manually clicking U buttons): note that Midjourney does not have a built-in batch upscale. Use the Midjourney web gallery bulk download to get all grid images, then run an external batch upscaler. You cannot bulk-click U buttons programmatically.
- Store the original source files in a separate archive folder. Never process in place. If a setting was wrong, you need the originals to reprocess.

### Extreme Resolution Target (24x36 inches at 300 DPI = 7200x10800 px)

This target represents 77.8 megapixels. A typical SD VRAM-constrained environment cannot generate or img2img at this resolution in a single pass. The pipeline must be tiled. Handling:
- Start from the highest quality intermediate available (Midjourney 2048x2048 Creative upscale, or SD at maximum native resolution)
- Apply Real-ESRGAN 4x to reach 8192x8192 (67 MP -- still under target at 100 DPI)
- Apply a second Real-ESRGAN 2x pass to reach 16384x16384 (268 MP -- well above target)
- Downscale to 7200x10800 using Bicubic Sharper (Photoshop) or Lanczos (ImageMagick) -- downscaling from above-target resolution is much better than attempting to exactly match the target, because it averages pixels and removes upscaling artifacts
- This approach ("overshoot and downscale") is preferred for extreme print resolutions over attempting to hit the target exactly
- Final file will be ~220 MB as TIFF. Confirm the print shop's maximum file size. Some large-format printers accept up to 2 GB TIFF; others max at 300 MB.
- At 24x36 poster viewing distance (typically 4-6 feet), 150 DPI is perceptually equivalent to 300 DPI for most observers. Consider whether 3600x5400 px meets the client's actual requirement before investing in the 300 DPI pipeline.

### ControlNet Tile Producing Style Drift at High Denoising

When ControlNet Tile is used at denoising 0.5+ to aggressively enhance detail, the diffusion model's prior can override the tile conditioning and introduce style drift -- particularly visible as the image taking on the stylistic characteristics of the checkpoint's dominant training data (often anime faces on photorealistic portraits, or photorealistic texture on illustration-style images). Handling:
- Reduce ControlNet Tile weight to 0.8-1.0 (counterintuitively, higher weight locks the tile conditioning more tightly, preventing drift)
- Reduce denoising to 0.35-0.45 maximum when using ControlNet Tile
- Verify the checkpoint is appropriate for the image style. If the source is photorealistic, use a photorealistic checkpoint (not DreamShaper or similar mixed-style models that will blend styles unpredictably)
- Add style-reinforcing terms to the prompt: for photorealistic, "photorealism, photography, DSLR"; for illustration, "illustration, art, painting" -- this biases the diffusion toward preserving the intended aesthetic
- If drift still occurs, use a pure upscaler (Real-ESRGAN) for the resolution increase and accept that detail enhancement will be limited to what the upscaler can provide, without diffusion enhancement

---

## Example

**User Input:** "I have a Midjourney v6.1 image of a detailed fantasy forest scene -- 1024x1024 -- and I need to print it at 18x24 inches for a gallery show. The art director wants 300 DPI. The style is painterly and illustrative, no faces or text. How do I upscale it?"

---

## AI Image Upscaling Specification

### Source Analysis
- **Source model and version:** Midjourney v6.1
- **Current dimensions:** 1024 x 1024 px
- **Current estimated DPI at 18x24 inches:** 56.9 DPI (1024 ÷ 18 inches) -- far below 300 DPI requirement
- **Image style category:** Painterly / illustrative -- foliage, atmospheric perspective, textured brushwork
- **Quality defects in source:** None noted -- this is the base Midjourney generation before native upscale
- **Original prompt:** Not provided -- will assume unknown for SD pass; reconstruct detail cues from style

### Target Requirements
- **Intended use:** Gallery print (commercial art print, fine art context)
- **Physical output size:** 18 x 24 inches
- **Required DPI:** 300 (art director requirement; note: 200 DPI would be perceptually equivalent at arm's length, but client specification is 300 DPI)
- **Target pixel dimensions:** 5400 x 7200 px (18 x 300 = 5400; 24 x 300 = 7200)
- **Required scale factor:** 5.27x horizontal, 7.03x vertical
- **Aspect ratio note:** Source is 1:1 square. Target is 3:4 portrait. Cropping required -- source will need to be cropped or extended vertically by approximately 333 pixels (33%) to match 3:4 at the same width. Discuss crop vs. outpaint with user before proceeding.

> **Action required before upscaling:** The source is 1:1 (square) and the print target is 3:4 portrait (18x24). Upscaling the square image to 5400x5400 yields an 18x18 inch print at 300 DPI -- 6 inches short of the 24-inch height. Confirm one of the following with the user:
> 1. Crop the final print to 18x18 (center crop, square format) -- no outpainting needed
> 2. Extend the canvas vertically using Midjourney's pan/outpaint tool before upscaling, adding approximately 341 px of forest scene at top or bottom (or split 170 above, 171 below) to reach 1024x1365 (3:4 ratio)
> 3. Accept moderate upscaling distortion by stretching the square to 3:4 -- this is not recommended as it will visually distort the proportions of trees and foliage

**Proceeding with Option 2 (outpaint first) as recommended. If user cannot outpaint, Option 1 (square crop) is the fallback.**

### Recommended Pipeline

| Step | Method | Tool | Key Settings | Input Resolution | Output Resolution |
|------|--------|------|-------------|-----------------|-------------------|
| 1 | Midjourney Native Upscale | Midjourney | Upscale (Subtle) | 1024 x 1024 | 2048 x 2048 |
| 2 | Pre-upscale outpaint (if 3:4 target) | Midjourney Pan | Extend bottom by ~680 px to reach 2048 x 2730 | 2048 x 2048 | 2048 x 2730 |
| 3 | AI Upscaler Pass 1 | Real-ESRGAN | Anime6B x4, PNG output | 2048 x 2730 | 8192 x 10920 |
| 4 | Downscale to target | Image Editor | Lanczos / Bicubic Sharper | 8192 x 10920 | 5400 x 7200 |
| 5 | Output sharpening | Image Editor | Unsharp Mask: 0.7 px radius, 65% amount, threshold 3 | 5400 x 7200 | 5400 x 7200 |

**Total scale factor from original 1024x1024 to final 5400x5400 area: 5.27x -- well within the reliable 2x-6x quality range for a multi-step pipeline.**

---

### Step-by-Step Settings

**Step 1: Midjourney Upscale (Subtle)**
- In the Midjourney Discord or web interface, locate the original generation job
- Click the U button corresponding to the grid cell you selected (U1-U4)
- After the initial upscale completes (reaching ~1024x1024), click **Upscale (Subtle)**
- Subtle is chosen over Creative because:
  - The painterly/illustrative style has deliberate brushwork texture that Creative may "improve away" by adding photorealistic detail
  - Foliage in Creative upscale can gain unwanted realistic texture that clashes with the painterly aesthetic
  - No faces or complex anatomy in this image, so Creative's main advantage (improved facial detail) does not apply
- Expected output: 2048 x 2048 PNG, sharp version of the original composition
- Save as PNG (Midjourney exports PNG by default -- do not convert to JPEG at this step)

**Step 2: Outpaint to 3:4 aspect ratio (skip if accepting square crop)**
- Use Midjourney's Pan tool (directional arrows below the upscaled image) to extend the bottom edge downward
- Amount needed: to go from 2048x2048 to 2048x2730, extend downward by approximately 682 pixels (~33% of original height)
- In Midjourney, pan generates one full panel extension -- the result will be approximately 2048 x 2730 after the downward pan
- Prompt for the pan extension: use the original image prompt and add "forest floor, roots, undergrowth, atmospheric mist, painterly illustration" to encourage cohesive extension
- Review the pan result -- if the forest floor extension looks inconsistent, run the pan again (Midjourney generates 4 variations; select the most cohesive)
- Save the selected pan result as PNG

**Step 3: Real-ESRGAN AI Upscale x4**
- Tool options:
  - **Automatic1111 (Extras tab):** Load
