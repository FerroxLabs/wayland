---
name: photo-editing-workflow
description: |
  Produces a priority-ordered photo editing sequence covering white balance,
  exposure, highlight/shadow recovery, color grading, local adjustments,
  sharpening, and export settings for the intended output medium. Applicable
  to any RAW processor or photo editor.
  Use when the user asks about photo editing, post-processing, color
  correction, or exporting photos for print or web.
  Do NOT use for audio editing (use audio-editing-guide), video production
  (use video-script-writing), or pre-shoot camera settings (use
  exposure-triangle).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "photography checklist template"
  category: "design-creative"
  subcategory: "photography"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Photo Editing Workflow

## When to Use

**Use this skill when the user:**
- Asks how to edit, post-process, retouch, or develop a photograph from RAW or JPEG format
- Wants a step-by-step editing sequence for a specific genre -- portrait, landscape, product, wedding, street, food, architecture, real estate, or fine art
- Needs guidance on color correction, white balance calibration, tone mapping, or exposure balancing
- Asks about exporting photos for a specific output medium -- Instagram, print-on-demand, gallery fine art print, e-commerce product listing, client delivery, or stock photography submission
- Wants to build a repeatable editing workflow for batch consistency across an entire shoot or client project
- Asks about color grading techniques such as teal-and-orange, matte film look, cross-processing, or cinematic grade
- Needs help recovering a technically flawed image -- overexposed, underexposed, severe color cast, motion blur, or high ISO noise
- Asks about output sharpening strategies, noise reduction thresholds, or print-vs-screen color space decisions

**Do NOT use this skill when:**
- The user needs pre-shoot camera settings, metering, or ISO/aperture/shutter strategy -- use `exposure-triangle`
- The user needs audio post-production, podcast mixing, or music mastering -- use `audio-editing-guide`
- The user is writing a video script, assembling a film, or editing video footage -- use `video-script-writing`
- The user is asking about prompt engineering for AI-generated images -- this workflow applies to photography, not generative outputs
- The user is asking about graphic design, typography, or illustration composition -- these require a design layout skill, not a photo editing workflow
- The user is asking about scanning film negatives or slide digitization -- film scanning has its own density, grain, and profile workflow that diverges significantly from digital RAW processing

---

## Process

### Step 1: Gather Editing Context Before Making Any Recommendation

Before prescribing a single adjustment, collect the following information. Every workflow decision -- from white balance method to export sharpening -- changes based on these inputs. Do not assume defaults.

- **Photo genre:** Portrait (studio, outdoor, golden hour, environmental), landscape (golden hour, blue hour, midday, night), product (e-commerce, lifestyle), event (wedding, concert, sports), architectural, food, street, or fine art
- **File format:** RAW (any variant -- CR2, CR3, NEF, ARW, RAF, DNG, RW2) or JPEG. This is the single most important technical constraint -- RAW affords 3-5 stops of recovery latitude; JPEG affords approximately 0.5-1 stop. Never promise the same recovery capability for both.
- **Capture conditions:** Lighting type (natural daylight, golden/blue hour, overcast, mixed indoor-outdoor, flash, continuous LED, fluorescent, sodium vapor), time of day, and whether the scene has high dynamic range (bright sky + dark foreground, windows in interior shots)
- **Desired look:** True-to-life/documentary, warm and film-like, cool and clean, high-contrast dramatic, matte/faded/film emulation, desaturated editorial, cinematic teal-and-orange, or client-defined reference
- **Output medium:** Web/social media, Instagram (feed, Reels cover, Stories), client delivery, stock photography platform, print at a specific size and substrate (glossy, matte, metallic, canvas, fine art cotton rag), portfolio website, e-commerce product listing
- **Batch or single:** One hero image or a shoot of 200+ frames requiring consistent look. Batch work changes the strategy -- per-image perfection is sacrificed for cohesion.
- **Intended display brightness:** Instagram and web content is often viewed on bright phone screens. Print is viewed under reflected light. Calibrated monitor work is viewed under D50 or D65 standardized conditions. A photo that looks perfect on an uncalibrated laptop will print too dark.

---

### Step 2: Set White Balance -- The Foundation of Every Subsequent Adjustment

White balance is a multiplier that scales the red, green, and blue channels before any other processing occurs. Correcting it first prevents every downstream adjustment from compensating for an invisible color cast.

- **Kelvin reference points:** Candle flame 1800K -- Tungsten/incandescent 2800-3200K -- Sunrise/sunset 3500-4500K -- Daylight (midday sun) 5200-5600K -- Flash/electronic strobe 5500-6000K -- Overcast sky 6500-7000K -- Open shade (blue sky overhead) 7500-8500K. These are starting targets, not absolutes -- every scene is different.
- **Tint axis (green-magenta):** Green casts come from fluorescent lights, LED panels with poor color rendering, and foliage-reflected fill light. Magenta casts come from early morning pink skies, mixed flash-daylight situations, and some artificial sources. The tint slider corrects the axis perpendicular to color temperature.
- **Eyedropper / gray card method:** Click on a known neutral -- a white shirt in shade (not direct sun, which is warm), a gray card, white foam core, concrete, or a gray sky. This is the most accurate method when a neutral reference was captured in frame.
- **Skin tone verification:** After setting white balance, verify skin tones in the HSL Luminance panel. Skin tones (all ethnicities) should fall on the orange-to-yellow channel, not red or green. If skin registers heavily in the red channel, the white balance is too warm or the tint is too magenta.
- **Per-shoot calibration:** If a gray card or ColorChecker was photographed under the same light, use its neutrals to create a custom profile. Apply that profile as the baseline for the entire shoot -- this is the professional standard for product photography, portrait studios, and food photography where color accuracy is contractual.
- **White balance and mood:** For intentionally warm images (golden hour portraits, film emulation), it is correct to set white balance deliberately warmer than neutral -- 6000-7000K instead of the technically accurate 5500K. Document the creative intent so the client does not request "correction."

---

### Step 3: Set Exposure and Establish the Histogram

Exposure adjustment sets the overall brightness before any tonal detail work. The target is a histogram that reads the full tonal range without clipping, with the subject placed on the correct tonal region.

- **Histogram interpretation:** Left edge = pure black (0,0,0). Right edge = pure white (255,255,255). For a well-exposed portrait, the main subject's skin tones should cluster in the right-center of the histogram (zone 6-7 of the Ansel Adams zone system). For a high-key image, the histogram shifts right. For a dark, moody image, it shifts left.
- **Clipping indicators:** Activate the highlight/shadow clipping preview in your processor. Red highlight clipping in a RAW file can often be recovered (within 1-2 stops) -- but only if at least one of the R, G, B channels retains data. Pure white (all three channels blown) is unrecoverable regardless of format. Blue shadow clipping indicates crushed blacks that will lose detail and show banding in gradients.
- **Exposure increments:** Work in 0.3-stop increments. A change of 1.0 full stop is dramatic and visible. More than 1.5 stops of push in shadows introduces visible noise. More than 2 stops of pull in highlights introduces gray muddiness.
- **RAW vs. JPEG latitude:** RAW files with 14-bit depth contain 3-5 stops of latitude above and below the metered exposure. JPEG files have already applied the camera's tone curve and discarded out-of-range data -- treat them as final unless adjustments are minor (within 0.5 stops either direction).
- **Middle gray placement:** Use the 18% gray target value -- in an 8-bit sRGB space, 18% gray sits at approximately RGB 119,119,119. If metering off a gray card, that value should sit at mid-histogram after white balance is set.

---

### Step 4: Recover Highlights and Shadows -- Expand the Tonal Range

After global exposure is set, use tonal range controls to push detail back into bright and dark areas without affecting the overall brightness.

- **Highlights slider:** Pulls down only the upper tonal region (approximately zones 8-10). A value of -40 to -70 is typical for outdoor scenes with bright skies. Pulling below -80 creates a muddy gray sky that looks processed -- stop before the sky loses its color and luminosity. The highlights slider is selective: it targets bright areas without affecting midtones.
- **Shadows slider:** Lifts only the lower tonal region (approximately zones 1-3). A value of +20 to +50 is typical for faces in backlit scenes. Above +60-70, the image develops a flat, HDR-composite appearance. Shadow recovery also introduces noise because digital shadows contain less signal -- always balance shadow lifting with noise reduction.
- **Whites slider:** Sets the white point explicitly. Hold Alt/Option while dragging -- the first pixels to turn white in the overlay are your brightest point. For a portrait, the white point should be specular highlights (catchlights, jewelry) -- not skin. For a product photo, the white background should be pure white (255) but the product itself should not clip.
- **Blacks slider:** Sets the black point. Hold Alt/Option while dragging -- first pixels to turn black in the overlay are your darkest point. Pushing blacks negative (-20 to -40) increases contrast and depth without affecting midtones. For a flat, faded look, set blacks to 0 or positive values -- this lifts the floor and prevents true black.
- **Tone curve interaction:** After setting the four tonal sliders, examine the histogram. If the tonal distribution looks natural, a tone curve overlay may not be needed. If the image looks flat or lacks contrast in the midtones, apply a gentle S-curve: lift at 75% luminance, pull down at 25% luminance. Keep the S-curve subtle -- each point moved by 10 units is a significant contrast change.
- **HDR tone mapping:** For high dynamic range scenes (15+ stops of range, such as interior real estate with windows), the standard sliders are insufficient. Apply highlights at -100, shadows at +100, then pull whites and blacks to re-establish the full range. This is the starting point -- not the finish.

---

### Step 5: Apply Color Grading -- Create the Visual Mood

Color grading is the creative layer that transforms a technically correct image into a stylized, intentional piece. Apply it after the tonal foundation is established.

- **Contrast slider vs. tone curve:** The contrast slider applies a fixed S-curve centered on the midpoint. The tone curve allows custom placement of contrast. For precision, use the curve. For quick work, the slider set to +10 to +25 adds enough punch without harshness.
- **Vibrance vs. saturation decision:** Vibrance uses a perceptual algorithm that protects already-saturated hues and skin tones. Saturation applies an equal multiplier to all hues. For portraits: use vibrance only (+10 to +20), never saturation. For landscapes: vibrance +15 to +25, saturation +5 to +10 to boost skies and foliage. For product: saturation boost should be verified against a physical reference of the product to ensure color accuracy is maintained.
- **HSL panel -- the precision tool:** The Hue, Saturation, and Luminance panel gives per-channel control. Key adjustments by genre:
  - Portraits: Orange hue -5 to -10 (shifts orange toward yellow -- golden skin, not orange fake-tan). Orange saturation -10 to -15 (prevents the face from being the most saturated element). Orange luminance +10 to +15 (brightens skin tonality without affecting exposure).
  - Landscapes: Blue saturation +10 to +20 (rich sky). Blue luminance -10 to -20 (deepens sky without darkening the whole image). Green hue +5 to +15 (shifts foliage from yellow-green to natural green). Aqua/teal saturation -10 to -20 (reduces the cyan color cast common in overcast daylight).
  - Teal-and-orange grade: Shift green hue toward teal (aqua). Shift orange hue slightly toward yellow-orange. Reduce green saturation. Lift orange luminance. This creates the blockbuster film look.
  - Matte/film emulation: Lift the black point on the tone curve (drag the bottom-left corner of the curve up to approximately 15-25 on the output axis). Add a slight warm tint to shadows via split toning. Reduce overall saturation -5 to -15 and desaturate oranges.
- **Split toning / color grading panel:** The standard cinematic technique is warm highlights + cool shadows. Highlights hue 30-50 (gold/peach), saturation 10-20. Shadows hue 200-230 (blue/teal), saturation 8-15. The balance slider pushes the transition point -- push toward highlights (+20 to +40) to affect more of the image with the shadow color; push toward shadows to keep color grading subtle.
- **Camera profiles and presets:** Apply before tonal adjustments if using a calibrated camera profile (e.g., Adobe Standard, Camera Standard, Camera Portrait, or a custom DCP profile). Profiles change the starting raw interpretation. Do not apply a look preset after full manual adjustments -- it will fight the work already done. If using a preset as a starting point, apply at 30-50% opacity and manually override each slider as needed.

---

### Step 6: Apply Local Adjustments -- Direct the Viewer's Eye

Global adjustments affect the entire image uniformly. Local adjustments override them in specific regions. They are the difference between a technically correct image and a compelling photograph.

- **Graduated filter (linear gradient):** The standard tool for landscape sky control. Apply from the top of the frame down to the horizon. Reduce exposure -0.5 to -1.0, pull highlights -30 to -50, add slight clarity -10 to +10 (negative clarity softens clouds, positive clarity adds texture). For dramatic skies, add a subtle blue-to-purple color shift in the shadow toning of the gradient.
- **Radial filter (elliptical mask):** Used to create off-center vignettes, brighten subjects, or simulate the narrow depth of field effect of a fast prime lens. Place the center of the radial filter on the subject. Invert the mask so the interior (subject) is affected. Boost exposure +0.2 to +0.4, clarity +10, add slight warmth to temperature. The exterior (background) can be separately adjusted for darkening.
- **Brush adjustments -- specific use cases:**
  - Eyes: +0.3 to +0.5 exposure, +20 to +30 clarity, +15 to +25 sharpness. Use a small brush at 50% flow for natural results. Avoid over-brightening -- the whites of eyes should not be pure white (RGB 255).
  - Teeth: Use the Teeth Whitening preset or manually set: reduce yellows saturation -30 to -50, boost luminance in yellows +10 to +20, add +0.2 exposure. Be conservative -- bright white teeth look processed and unnatural.
  - Skin smoothing: Negative clarity (-20 to -30) on skin areas only, avoiding the eyes, lips, and hair. Clarity reduction reduces microcontrast and mimics the effect of a diffusion filter. It is not frequency-separation retouching -- for commercial portrait retouching, that requires pixel-level work in a full editor.
  - Background darkening: Use a brush to reduce exposure -0.3 to -0.5 on bright areas behind the subject that compete for attention.
- **Luminosity masking (advanced):** Available in dedicated plug-ins and some processors. Creates masks based on the luminosity value of individual pixels -- for example, masking only the bright sky without affecting the horizon trees. Precision far exceeds a graduated filter for complex, irregular horizon lines. For landscape editing, this is the professional standard.
- **Vignette:** Apply post-crop vignette with feathering set to 80-90%. Amount -10 to -25 for a subtle draw toward the center. Roundness +20 to +40 pushes the vignette from oval toward rectangular, which suits wide rectangular crops. The midpoint slider (set to 40-55) controls how far the vignette intrudes toward the center.
- **Dodge and burn (pixel-level):** In a full layer-based editor, create a 50% gray layer in Overlay blending mode. Paint white with a low-opacity soft brush (3-8% opacity) to dodge (lighten). Paint black to burn (darken). This is non-destructive and the professional retouching standard. Build up gradually -- never burn or dodge more than 10-15% in a single pass on the same area.

---

### Step 7: Sharpen and Reduce Noise -- Optimize for Perceived Detail

Sharpening and noise reduction are applied after all tonal and color adjustments because sharpening amplifies all details -- including noise and color artifacts. They are applied globally here and overridden with output sharpening at export.

- **Capture sharpening purpose:** RAW files are inherently soft due to the demosaicing algorithm and, often, a low-pass filter over the sensor. Capture sharpening restores the sharpness the scene actually had -- it is corrective, not creative.
- **Sharpening parameters:**
  - Amount: 40-60 for portraits (skin should not show pore-level texture at full sharpening). 60-80 for landscapes and architecture (fine detail in foliage, brickwork, and rock texture benefits from more sharpening). 80-100 for product and food photography where fine texture (fabric weave, food texture) is the subject.
  - Radius: 0.8-1.0 for fine-textured subjects (skin, fabric). 1.0-1.4 for subjects with larger, well-defined edges (architecture, mountain ridgelines). A radius above 1.5 creates halos visible at 100% zoom.
  - Detail: 25-40 for portraits (suppresses texture sharpening in favor of edge sharpening). 50-75 for landscapes (sharpens fine leaf, grass, and rock detail).
  - Masking: This is the most important and most misused sharpening parameter. Hold Alt/Option while dragging -- the preview shows a black-and-white edge map. Drag to the right until smooth areas (sky, skin, out-of-focus backgrounds) turn entirely black. Only white areas receive sharpening. For portraits, masking at 60-80 is typical. For architecture, masking at 20-40 is typical (most surfaces have edges worth sharpening).
- **Noise reduction types:**
  - Luminance noise: Appears as grain-like variation in tone. Visible in shadow areas, smooth surfaces (skin, sky, walls), and high-ISO captures. Reduce in steps -- 20 is a starting point. Move up to 40-50 for obvious noise. Above 60-70, the image becomes waxy and detail is lost.
  - Color noise: Appears as multicolored speckling (red, green, blue dots) most visible at 100% zoom in shadow areas. Always apply a minimum of 20-25 color noise reduction even on clean images -- this eliminates micro color artifacts from the demosaicing process. Heavy color noise (high ISO night photography) may require 50-70.
  - Detail slider in noise reduction: Higher detail values preserve fine texture at the cost of noisier results. Lower values create smoother results at the cost of softness. Set at 50-60 as a balance point.
  - Sharpening-to-noise trade-off: Every 10 units of luminance noise reduction requires approximately 5-10 additional units of capture sharpening to maintain perceived sharpness. Adjust them together, not independently.
- **AI/machine learning noise reduction (Denoise):** Modern RAW processors include AI-based noise reduction that analyzes the full image rather than applying a uniform blur. For high-ISO captures (ISO 6400+), AI denoise produces results that retain fine detail while eliminating noise at a quality level that manual luminance noise reduction cannot match. Apply AI denoise as the first noise step, then reduce the manual luminance slider to avoid double-processing.

---

### Step 8: Export for the Intended Output Medium

Export settings are not one-size-fits-all. The wrong color space, resolution, or output sharpening setting can make a perfect edit look wrong in its final context.

**Export Settings by Output Medium:**

| Output Medium | Format | Color Space | PPI | Longest Edge / Dimensions | JPEG Quality | Output Sharpening |
|---|---|---|---|---|---|---|
| Instagram feed (1:1 square) | JPEG | sRGB | 72 | 1080 x 1080 px | 85-90% | Screen, Standard |
| Instagram feed (4:5 portrait) | JPEG | sRGB | 72 | 1080 x 1350 px | 85-90% | Screen, Standard |
| Instagram Stories / Reels cover | JPEG | sRGB | 72 | 1080 x 1920 px | 85-90% | Screen, Standard |
| Web / portfolio website | JPEG | sRGB | 72 | 2400-3000 px long edge | 85% | Screen, Standard |
| Email delivery to client | JPEG | sRGB | 72 | 2048-3000 px long edge | 90-95% | Screen, Standard |
| Full-resolution client delivery | JPEG | sRGB | 300 | Full resolution (no resize) | 95-100% | Screen, Standard |
| Professional print (photo lab) | JPEG or TIFF | sRGB (most labs) | 300 | Actual print dimensions at 300 ppi | 95-100% (JPEG) | Matte or Glossy (match substrate) |
| Fine art inkjet print (cotton rag) | TIFF 16-bit | Adobe RGB | 300-360 | Actual dimensions at 300 ppi | Lossless | Matte, High |
| Stock photography submission | JPEG | sRGB | 300 | Full resolution (minimum 4MP) | 95-100% | Screen, Standard |
| E-commerce product listing | JPEG | sRGB | 72 | 2000 x 2000 px (square) | 85% | Screen, Standard |
| Billboard / large format print | TIFF | Adobe RGB | 100-150 ppi at actual size | Actual dimensions | Lossless | Matte or Satin, High |

- **sRGB vs. Adobe RGB decision rule:** Use sRGB for all screen output. Use Adobe RGB for print output that will be soft-proofed and printed by a print service that explicitly supports Adobe RGB (fine art labs, professional photo labs). ProPhoto RGB is a working color space -- do not export delivery files in ProPhoto RGB; only use it as an internal working space. If unsure whether a print lab supports Adobe RGB, export sRGB -- it is always safe, and the gamut difference is usually invisible in standard viewing conditions.
- **Output sharpening logic:** Screen output is viewed at 72 ppi on displays ranging from 96 to 458 ppi (retina). Standard output sharpening compensates for downsampling. Glossy print substrates (metallic, lustre, glossy) retain sharpness well -- apply standard sharpening. Matte and textured substrates (canvas, fine art cotton rag) absorb ink and diffuse sharpness -- apply high sharpening to compensate.
- **File naming for traceability:** Use a consistent convention: `[client-or-project]-[shoot-date]-[original-file-number]-[version].jpg`. Example: `smith-wedding-20241012-DSC04711-edit.jpg`. The original file number preserves the link back to the RAW file. Never rename RAW files -- only the exported deliverable.
- **Metadata embedding:** Before export, embed copyright metadata. Include photographer name, contact info, copyright year, and usage rights in the IPTC fields. For client delivery, embed a usage license description. For stock submission, fill in all required keyword and caption fields.

---

## Output Format

```
## Photo Editing Workflow: [Genre / Project Name]

**Photo Type:** [portrait | landscape | product | event | food | architectural | street]
**File Format:** [RAW (format: CR3 / NEF / ARW / DNG / other) | JPEG]
**Capture Conditions:** [lighting type, time of day, dynamic range challenge if any]
**Desired Look:** [natural | warm-film | cool-clean | high-contrast-dramatic | matte-faded | cinematic | client reference]
**Output Medium:** [specific platform/print specification]
**Batch or Single:** [single hero image | batch of N frames]

---

### Editing Sequence (apply strictly in this order)

#### Step 1: White Balance
- Method: [eyedropper on neutral / Kelvin manual / auto / camera profile]
- Temperature: [K value, e.g., 5800K] -- rationale: [why this value for this scene]
- Tint: [+ toward magenta | -- toward green | value, e.g., +5]
- Verification check: [what to look for in skin tones / neutrals]

#### Step 2: Exposure
- Adjustment: [+X.X stops | --X.X stops]
- Histogram target: [describe where the majority of data should sit]
- Clipping status: [highlights status | shadow status]

#### Step 3: Highlights, Shadows, Whites, Blacks
- Highlights: [value -- rationale]
- Shadows: [value -- rationale]
- Whites: [value -- rationale]
- Blacks: [value -- rationale]
- Tone curve: [S-curve description | custom point placement | none needed]

#### Step 4: Color Grading
- Contrast: [value]
- Vibrance: [value] -- Saturation: [value]
- HSL adjustments:
  - [Channel 1 -- Hue: X | Saturation: X | Luminance: X | rationale]
  - [Channel 2 -- Hue: X | Saturation: X | Luminance: X | rationale]
  - [Additional channels as needed]
- Split toning:
  - Highlights: Hue [X], Saturation [X] -- color name/description
  - Shadows: Hue [X], Saturation [X] -- color name/description
  - Balance: [value, positive = toward highlights, negative = toward shadows]
- Camera profile / preset base: [if applicable, name and opacity]

#### Step 5: Local Adjustments
- [Adjustment 1]: Tool [graduated filter | radial filter | brush], Area [description], Settings [specific values]
- [Adjustment 2]: Tool [graduated filter | radial filter | brush], Area [description], Settings [specific values]
- [Adjustment 3 if needed]: Tool, Area, Settings
- Vignette: Amount [X], Feather [X], Midpoint [X], Roundness [X]

#### Step 6: Sharpening and Noise Reduction
- Capture sharpening: Amount [X], Radius [X], Detail [X], Masking [X]
- Luminance noise reduction: [value] -- Detail [X]
- Color noise reduction: [value]
- AI denoise: [applied / not needed -- rationale]
- Sharpening-noise balance note: [describe the trade-off made]

#### Step 7: Export
| Parameter | Value | Rationale |
|---|---|---|
| Format | JPEG / TIFF | [reason] |
| Color space | sRGB / Adobe RGB | [reason] |
| PPI | [value] | [reason] |
| Longest edge / dimensions | [value] | [reason] |
| JPEG quality | [value] | [reason] |
| Output sharpening | [screen / matte / glossy -- standard / high] | [reason] |
| File naming | [convention] | [reason] |

---

### Key Decisions and Rationale
- [Decision 1: what was prioritized and why]
- [Decision 2: what was intentionally not done and why]
- [Decision 3: genre-specific technique applied]

### Batch Application Notes (if applicable)
- Sync settings: [list which settings to sync across batch]
- Per-image overrides: [list which settings to adjust per image]
- Consistency check: [what to compare across frames to verify batch cohesion]
```

---

## Rules

1. **Always edit in strict sequence: white balance → exposure → highlights/shadows → color grading → local adjustments → sharpening → export.** Any reordering creates cascading errors. Adjusting color grading before exposure means you are grading the wrong brightness. Sharpening before noise reduction amplifies color noise into sharp speckled artifacts.

2. **Never promise highlight recovery from JPEG files.** JPEG files apply an in-camera tone curve and clip highlights during capture -- those tonal values are gone. RAW files retain 1-2 stops of recoverable highlight detail above the metered exposure because the raw sensor data has not been processed yet. State this explicitly when the user provides a JPEG.

3. **Noise reduction and sharpening are inversely coupled -- always adjust them together.** Every 10 units of luminance noise reduction softens detail and requires a compensating increase in sharpening amount or detail slider. Tuning one without considering the other produces either noisy-sharp or smooth-soft results -- neither is optimal.

4. **Specify every HSL adjustment by exact channel, direction, and value -- never use vague language like "adjust the colors."** "Reduce orange saturation by 15 to prevent skin from over-saturating" is actionable. "Adjust skin tones in the HSL panel" is not.

5. **Export color space must match the output medium and print lab capabilities.** sRGB is the safe universal choice. Adobe RGB is only appropriate for print workflows with a color-managed pipeline from edit to print. Exporting in ProPhoto RGB for screen or web delivery is a critical error -- uncalibrated displays will render ProPhoto RGB files with severely wrong colors.

6. **Shadow recovery above +50 introduces visible noise and requires explicit noise reduction guidance.** Do not recommend lifting shadows without also specifying a luminance noise reduction value. Shadow areas have the lowest signal-to-noise ratio in digital sensors. Lifting them amplifies read noise, thermal noise, and quantization noise.

7. **Capture sharpening masking is the most impactful and most overlooked sharpening control.** Always specify a masking value. For portraits, masking below 50 will sharpen skin texture aggressively and make pores visible. For architectural images, masking above 60 will leave mortar lines and brickwork unsharpened.

8. **Output sharpening is separate from capture sharpening and must be applied at export time, not during editing.** Capture sharpening corrects sensor softness. Output sharpening compensates for the image resampling that occurs when resizing for output. Skipping output sharpening makes web images look slightly soft and makes matte print images look noticeably unsharp.

9. **White balance adjustment on a JPEG is imprecise and destructive.** JPEGs store the image in a compressed luminance+chroma format. Large white balance shifts on a JPEG introduce hue shifts, compression artifacts, and banding in gradients. Limit JPEG white balance corrections to ±300K and ±5 tint. Beyond that, the image quality degradation outweighs the color benefit.

10. **For batch workflows, white balance, tone curve, color grading, and vignette should be synced globally, while exposure, crop, and local adjustments should be reviewed individually.** Syncing exposure across a batch of event photos taken in varying light will create inconsistent brightness. Syncing the creative look -- color grade, vignette, shadow/highlight style -- creates cohesion.

11. **Monitor calibration is a prerequisite for any output intended for professional use.** A display with a color temperature of 7500K instead of D65 (6500K) will cause the photographer to over-warm every image to compensate for the blue-shifted display. The resulting prints will appear orange. If the user mentions professional client delivery or print production, ask whether their display is calibrated with a hardware colorimeter.

12. **Split toning/color grading saturation values above 25 in highlights will create unnatural color casts on skin tones.** The recommended creative range is saturation 8-20 for subtle grading. Above 25, skin tones in highlights will take on the hue of the highlight color (peach, gold, or green depending on setting) and require heavy HSL correction to compensate.

---

## Edge Cases

### JPEG Source File (No RAW Available)
JPEG editing latitude is severely limited compared to RAW. The in-camera tone curve has already been applied, noise reduction has already been applied, and chroma data has been discarded through 4:2:0 chroma subsampling. Handle as follows:
- Limit exposure adjustments to ±0.5 stops. Pushing beyond 1 stop introduces visible banding in gradients (sky, skin, smooth walls).
- Avoid heavy shadow lifting. Shadows in JPEGs contain compressed chroma data -- lifting them reveals blocking artifacts and color banding, not clean shadow detail.
- Do not apply aggressive noise reduction -- it was already applied in-camera and a second pass creates a waxy, over-processed look.
- White balance corrections beyond ±300K introduce color channel shifting that can create green or magenta fringing around edges.
- Set expectations clearly with the user: the JPEG imposes a ceiling on quality that cannot be circumvented in post-processing. Document the limitations explicitly in the Before/After Notes section.

### Mixed Light Sources (e.g., Window Daylight + Tungsten Interior Lighting)
A single global white balance cannot correct two light sources with different color temperatures simultaneously -- 5600K daylight and 3200K tungsten are 2400K apart.
- Set the global white balance to match the primary light source illuminating the subject (usually the stronger or more directly visible source).
- Use a brush local adjustment to correct the secondary light source area. For window light falling on a tungsten-lit room: set global WB to tungsten (~3200K), then paint a brush adjustment over the window and lit areas (+800K to +1200K to shift toward daylight). The alternative is to set global WB to daylight and use a brush on the tungsten-lit areas (shift -800K to -1200K toward tungsten).
- Accept that a perfect neutral in both light zones simultaneously is not achievable without compositing.
- Note to the user: in future shoots, use gels on the tungsten sources to match color temperature, or use all-tungsten or all-daylight sources.

### Very Underexposed RAW (2+ Stops Under Metered Exposure)
Recovering 2-4 stops from a RAW file is technically possible but carries visible quality costs:
- Push exposure 2-4 stops using the exposure slider. Expect significant luminance noise in shadow areas, color noise in the darkest regions, and possible banding in smooth tonal transitions.
- Apply AI denoise before any other noise reduction -- it handles heavy noise better than luminance/color sliders.
- After AI denoise, apply additional luminance noise reduction 30-50 and color noise reduction 50-70.
- Consider a black-and-white conversion if color noise is unacceptable -- luminance noise in monochrome resembles film grain and is aesthetically valid. The conversion also eliminates color noise entirely.
- Shadow areas pushed this aggressively will show posterization (stair-stepping in gradients) -- apply a small amount of luminance smoothing (Detail slider in noise reduction set to 20-30) to soften gradient transitions.

### Photo Intended for Both Screen and Large-Format Print
Do not export a single file for both uses. Instead:
- Edit once to the highest quality standard. Save the full-quality edited state.
- Export 1 for screen/web: sRGB, 72 ppi, 2400-3000 px long edge, JPEG quality 85%, screen output sharpening.
- Export 2 for print: Adobe RGB (if the print lab supports it), 300 ppi at the actual print dimensions, TIFF 16-bit or JPEG quality 95-100%, output sharpening at matte high or glossy standard to match the print substrate.
- For large-format prints (24 inches or wider), verify the effective PPI at the print size. A 24MP camera (6000 x 4000 pixels) at 300 ppi prints at maximum 20 x 13.3 inches. For a 24x16 inch print, the effective resolution is 250 ppi -- still acceptable. For a 40x27 inch print, the effective resolution drops to 150 ppi -- borderline. If the image will be viewed from a distance (gallery, billboard), 150 ppi is acceptable; if viewed up close, apply Preserve Details 2.0 or similar AI upscaling to reach 300 ppi.

### Extremely High ISO Capture (ISO 6400 and Above)
High ISO images require a different balance of priorities -- noise reduction aggressiveness rises, and sharpening must compensate for the resulting softness:
- Apply AI denoise first if available. The quality improvement over manual noise reduction at these ISO values is substantial enough to make manual sliders largely redundant on the luminance channel.
- Set luminance noise reduction to 50-80 (high). The image will lose microdetail -- this is unavoidable. The alternative is unacceptable noise.
- Set color noise reduction to 60-80. Color noise (the multicolored speckle) is more distracting than luminance noise and should be prioritized.
- After noise reduction, apply capture sharpening at Amount 70-90, Radius 1.0-1.2, Masking 40-60. The masking value is critical -- it prevents sharpening from enhancing residual noise in smooth areas like sky and skin.
- Consider the creative option: convert to black and white. Luminance noise at ISO 6400+ in black and white resembles 35mm film grain and carries aesthetic value. Use the B&W mixer to give the image dimension -- darken blues (sky) and lighten oranges/yellows (skin) to create the classic black-and-white portrait range.

### Skin Tone Correction in Stylized Color Grades
When applying creative color grades (teal-and-orange, desaturated editorial, faded film), skin tones are the most likely casualty -- they shift to unnatural hues that clients notice and reject even when they cannot articulate why:
- After applying the creative grade, zoom to 100% on the face and check skin tone hue in the Info panel. Skin tones at all ethnicities should read predominantly in the orange channel of the HSL panel, with secondary representation in the red and yellow channels. No skin tone should read primarily green, cyan, or purple.
- Use the targeted adjustment tool (the small circular icon in the HSL panel) and click directly on a midtone skin area. This identifies which HSL channels the skin occupies in the specific image.
- If the grade has shifted skin into unflattering territory, use HSL to pull back the specific channels: increase orange luminance, slightly reduce orange saturation, or shift orange hue toward yellow. These corrections are independent of the grade applied to the rest of the image if applied with care.
- For severe cases, use a brush local adjustment on the face area and apply a counter-correction that restores skin hue independently of the global grade.

### Soft Focus or Camera Motion During Capture
Sharpening in post-processing cannot recover focus that was not captured. Understanding the difference between correctable and uncorrectable softness is essential:
- **Correctable:** Slight softness from RAW demosaicing (corrected with capture sharpening). Diffraction softness from shooting at f/22+ (partially corrected with clarity and sharpening). Atmospheric haze in distant landscape shots (partially corrected with Dehaze slider, 15-35 range, above 40 creates artificial crunchiness).
- **Not correctable through standard sharpening:** Camera shake (motion blur introduces directional smearing -- sharpening amplifies the blur, not the detail). Front/back focus error at wide apertures (the focal plane missed the subject's eyes -- the eyelashes or ears will be sharp but eyes will not). Gaussian out-of-focus blur (the background can never be made sharp in post -- only compositing or AI-based refocus tools can attempt this, with mixed results).
- Set honest expectations: "The eyes in this image are soft from focus error. I can apply sharpening to maximize the available detail, but the image does not have the focal plane on the eyes. Sharpening will not fix focus."

---

## Example

**Input:** "I have a RAW file of a food photo -- overhead shot of pasta on a white ceramic plate. Shot under LED studio lights at 400 ISO. I want a warm, natural look with rich colors. It's going to go on a restaurant website and also be printed on a menu (5x7 inches, glossy)."

---

## Photo Editing Workflow: Restaurant Food Photography -- Overhead Pasta

**Photo Type:** Food (overhead flat-lay, studio LED lighting)
**File Format:** RAW
**Capture Conditions:** LED continuous lights, overhead position, white ceramic plate (reference neutral available), ISO 400 (clean capture, minimal noise)
**Desired Look:** Warm, natural, rich -- food appears appetizing, not oversaturated or artificial. White plate stays neutral to white without color cast.
**Output Medium:** Restaurant website (web) and printed menu (5x7 inches, glossy)
**Batch or Single:** Single hero image (same workflow can be synced to companion dishes from the same shoot)

---

### Editing Sequence

#### Step 1: White Balance
- Method: Eyedropper on the white ceramic plate (the plate is a known neutral and is directly in frame -- this is ideal for food photography). Click on a midtone area of the plate, not the specular highlight.
- Temperature: Target approximately 4800-5200K (LED continuous lights typically run 5000-5600K; the auto result will be close but may have a green or slightly cool cast from the LED spectrum)
- Tint: Expect a correction of +3 to +8 toward magenta (most LED panels have a slight green spike in their spectrum -- the tint slider corrects this)
- After eyedropper: verify the plate reads neutral (R, G, B values within 5 units of each other at the midtone reading). If the plate still looks warm, manually cool 100-200K. The plate must be neutral -- it is the visual reference the viewer uses to judge color accuracy.
- Rationale: Food photography clients (restaurants, food brands) judge white balance accuracy by looking at plates, cream sauces, and white garnishes. If those look warm or green, the whole image reads as incorrectly lit.

#### Step 2: Exposure
- Adjustment: +0.3 stops (overhead LED studio setups are often metered conservatively by the camera, resulting in a slightly underexposed image. The pasta and sauce should be bright and appetizing, not dim and flat.)
- Histogram target: The bulk of the data should sit in the right-center to right portion of the histogram. The white plate should approach the right edge without clipping. A gap on the right means the image looks underlit and unappetizing.
- Clipping status: Check that the plate is not pure white (255,255,255) -- a white plate with texture should retain subtle tonal variation. Clipping preview should show no blown highlights on the plate surface. Sauce highlights (reflective tomato sauce, olive oil sheen) are acceptable with minor clipping.

#### Step 3: Highlights, Shadows, Whites, Blacks
- Highlights: -25 (recovers the oil sheen on the pasta and any reflective highlights in the sauce without dulling the overall brightness of the image)
- Shadows: +20 (lifts the deep shadow in the concave areas of the pasta and the darker sections under garnishes -- food images benefit from visible shadow detail rather than crushed blacks, as it reveals texture)
- Whites: +15 (the plate should read bright and clean -- a slightly positive whites value ensures the plate reads as white, not gray)
- Blacks: -20 (adds subtle depth to the darkest areas -- the shadow underneath the plate edge or the deep recesses in the pasta -- without losing detail. This prevents the image from looking flat.)
- Tone curve: Apply a gentle S-curve. Lift the three-quarter point (75% luminance) by 8 units to brighten the sauce and highlight the warm food tones. Pull the quarter point (25% luminance) down by 8 units to deepen the shadows underneath the pasta for texture and depth. Keep it subtle -- food photography benefits from brightness and richness, not dramatic contrast.

#### Step 4: Color Grading
- Contrast: +10 (slight punch to make colors richer without creating harsh contrast)
- Vibrance: +20 (significantly boosts the muted reds of the tomato sauce and the greens of fresh basil -- vibrance's protection of already-saturated hues means the bright red garnishes do not blow into oversaturation)
- Saturation: +5 (a small global boost assists the warmth of the pasta and cream sauce tones)
- HSL adjustments:
  - Red hue: -5 (shifts red toward orange-red -- makes tomato sauce look richer and more natural, less neon)
  - Red saturation: +10 (enriches the tomato sauce color)
  - Red luminance: 0 (leave neutral -- the sauce is already the correct brightness)
  - Orange hue: -5 (shifts orange slightly toward yellow -- the pasta color shifts from orange to golden-yellow, which is more appetizing)
  - Orange saturation: +10 (golden pasta color becomes more vivid and appetizing)
  - Orange luminance: +8 (subtly brightens the pasta color)
  - Yellow saturation: +8 (enriches olive oil drizzles, cheese, and any golden garnishes)
  - Green hue: +10 (shifts the basil from yellow-green to a deeper, richer green -- more natural and vivid)
  - Green saturation: +15 (makes fresh herbs and any greens vibrant)
  - Green luminance: -5 (slightly deepens the green to prevent it from looking washed out)
- Split toning:
  - Highlights: Hue 40, Saturation 8 (adds a warm gold tint to the brightest areas -- the plate, sauce highlights, and pasta -- reinforcing the warm, appetizing feel)
  - Shadows: Hue 30, Saturation 5 (keeps shadows within the warm palette rather than introducing cool or neutral shadows that would feel clinical)
  - Balance: +15 (pushes the influence slightly toward highlights, ensuring the warm gold tone reaches the midtones of the image)
- Camera profile: Adobe Color or Camera Standard -- apply before all adjustments to ensure accurate color rendering as the starting baseline

#### Step 5: Local Adjustments
- Graduated filter on the background / edges: Area -- outer 15% of the frame on all sides. Settings -- exposure -0.3, feathering 80. Rationale: draws the eye inward toward the plate and food, prevents the white background from competing with the subject.
- Radial filter centered on the pasta: Area -- oval covering 60% of the frame, centered on the hero food element. Settings -- inside: exposure +0.2, clarity +15, vibrance +10. Rationale: brightens and adds microcontrast to the primary food subject, making it the most visually compelling element in the frame.
- Brush on fresh herbs (basil): Clarity +20, vibrance +10. Rationale: fresh herbs need microcontrast (clarity) to show individual leaf veins and texture -- this is what communicates freshness and quality. Brush carefully to cover only the herb leaves.
- Brush on sauce highlights (oil sheen, sauce gloss): Clarity +10, highlights -10. Rationale: reduces highlight clipping in the most reflective areas while adding texture to the sauce surface.
- Vignette: Amount -15, Feather 90, Midpoint 60, Roundness +20. Rationale: a subtle vignette on food photography keeps the eye on the plate without creating an obvious processed look. The high feathering and positive roundness keep it natural.

#### Step 6: Sharpening and Noise Reduction
- Capture sharpening: Amount 80, Radius 1.0, Detail 60, Masking 35
  - Rationale: Food photography benefits from high sharpening -- the viewer expects to see pasta texture, sauce gloss, herb leaf veins, and cheese granules. Masking at 35 keeps some sharpening on smooth surfaces (sauce) while ensuring fine details are well-rendered. Detail at 60 prioritizes fine structure (pasta texture, herb veins) over simple edge enhancement.
- Luminance noise reduction: 15 (ISO 400 on a modern sensor is largely clean -- a light application removes micro-texture artifacts without visibly softening the food detail)
- Color noise reduction: 25 (standard application to clean up any micro color artifacts from the LED light's imperfect color rendering)
- AI denoise: Not needed -- ISO 400 is well within the clean range of modern sensors
- Sharpening-noise balance: The high sharpening amount (80) requires the low noise reduction (15) to avoid sharpening noise. If this image were shot at ISO 1600+, noise reduction would need to increase to 40-50 and the sharpening amount would compensate by increasing to 90-100.

#### Step 7: Export

| Parameter | Web (Restaurant Website) | Print (5x7 Menu, Glossy) |
|---|---|---|
| Format | JPEG | JPEG |
| Color space | sRGB | sRGB |
| PPI | 72 | 300 |
| Dimensions | 2400 px long edge | 2100 x 1500 px (7x5 at 300 ppi) |
| JPEG quality | 85% | 95% |
| Output sh
