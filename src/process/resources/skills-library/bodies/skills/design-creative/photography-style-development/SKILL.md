---
name: photography-style-development
description: |
  Identifies a user's visual preferences from described examples, extracts the
  defining characteristics including color treatment, contrast, subject
  selection, and composition, and produces a personal photography style guide
  with specific settings targets. Applicable to any camera and processor.
  Use when the user asks to develop a photography style, create visual
  consistency, define their aesthetic, or build a cohesive portfolio look.
  Do NOT use for single-photo composition (use composition-guide), camera
  settings for a specific shot (use exposure-triangle), or photo editing
  steps (use photo-editing-workflow).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "photography design planning"
  category: "design-creative"
  subcategory: "photography"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Photography Style Development

## When to Use

Use this skill when the user's goal is developing, articulating, or systematizing a personal photographic aesthetic -- not solving a single-image problem.

**Trigger scenarios:**
- The user says their portfolio "looks scattered" or "doesn't feel like mine" and wants to fix that
- The user wants to develop a recognizable visual identity for social media, a portfolio site, or client marketing
- The user has been shooting for a while and wants to define what their style actually is from patterns in their existing work
- The user is starting to pursue paid work (editorial, wedding, portrait, commercial) and needs a consistent aesthetic to show clients
- The user describes photos they love and photos they hate and wants those preferences translated into a repeatable system
- The user wants to build a Lightroom preset, Capture One style, or VSCO profile that reflects their personal aesthetic rather than someone else's template
- The user has shifted their style several times and wants to commit to one direction

**Do NOT use when:**
- The user needs framing, angle, or rule-of-thirds advice for a specific photo -- use `composition-guide`
- The user needs aperture, shutter speed, or ISO settings for a specific lighting scenario -- use `exposure-triangle`
- The user wants a step-by-step walkthrough of editing a single photo -- use `photo-editing-workflow`
- The user asks how to color grade a video -- this skill is still-photography-specific; video grading has distinct temporal consistency requirements
- The user wants gear recommendations -- lens and body selection is a separate decision tree
- The user is asking for printing or output specifications -- use a color management or print workflow skill

---

## Process

### Step 1: Gather Inputs Through Structured Elicitation

Before any analysis, collect the right raw material. Vague inputs produce vague style guides. Ask specifically:

- **Positive reference photos (5-10 minimum):** Ask the user to describe -- not just list -- photos they love. For each, ask: "What specifically draws you to this? Is it the colors, the light quality, the mood, the subject, the way shadows look, the sharpness or softness?" Push for specific observations, not emotional generalizations.
- **Negative reference photos (5-10 minimum):** Ask for photos they actively dislike -- not just neutral. Ask: "What specifically bothers you? Is it over-saturation, harsh shadows, clinical sharpness, cluttered backgrounds?" The dislike list often defines the style's hard boundaries more clearly than the love list.
- **Referenced photographers or visual artists:** These are not just for inspiration -- they are a shorthand for extracting technical characteristics. Ask which specific aspect of each photographer's work appeals to them (the color, the composition, the subject matter, the tonal quality). A photographer can love Vivian Maier for her framing and hate her gritty contrast.
- **Shooting context:** Where will these photos be displayed? An Instagram grid has different consistency demands than a printed book, a client portfolio PDF, or a fine art gallery exhibition. The medium affects color specification (sRGB vs. AdobeRGB), contrast (screens vs. paper), and grain (grain that looks good on screen can be distracting in large prints).
- **Genres shot:** Portrait, landscape, street, architecture, documentary, product, wildlife, macro, abstract. Multi-genre users need a style that travels across subjects -- single-genre users can include subject-specific traits.
- **Existing body of work:** If the user has existing photos, ask them to identify their 10 personal favorites from their own work. The patterns in what they already made but intuitively liked are often more revealing than stated preferences.
- **Emotional intent:** Ask: "When someone looks at your photo, what do you want them to feel in the first 3 seconds?" Nostalgia, intimacy, awe, unease, serenity, energy, humor, grief. This emotional target governs decisions when technical approaches conflict.

### Step 2: Analyze the Visual Preferences -- Extract Measurable Patterns

Systematically examine the described or referenced photos across eight visual dimensions. Do not generalize -- find the specific value along each dimension:

- **Color temperature:** Measure in Kelvin direction. Neutral daylight is approximately 5500K. Warm (amber, golden): 6000-7000K. Cool (blue, silver): 4000-5000K. Identify not just "warm" or "cool" but whether the warmth is in the highlights only, the midtones, or across the entire image.
- **Saturation approach:** Vivid (saturation boosted 10-25 points above neutral), natural (±5 points), muted (reduced 10-30 points), desaturated near-monochrome (reduced 40-60 points). Also distinguish between global saturation changes and selective channel adjustments -- many sophisticated styles involve boosting one color while reducing others.
- **Contrast style:** High contrast (blacks at 0-5, whites at 245-255, steep S-curve), low contrast/matte (blacks lifted to 15-30, whites pulled to 220-240, flat curve), natural (standard S-curve, midtone contrast only). Also identify whether contrast is global or local (local contrast applied via clarity or midtone contrast creates texture without affecting tonal range).
- **Tonal key:** High key (exposure and shadows both lifted, dominant tone above midgray), low key (exposure pulled, deep shadows, dominant tone below midgray), standard (centered around midgray). High-key styles with lifted shadows are a distinct category -- "faded high key" or "hazy bright."
- **Color palette:** Identify recurring color combinations in liked photos. Common palettes: teal-and-orange (complementary, cinematic), earth tones (brown, ochre, rust), pastel (low saturation, high luminance), monochromatic warm, cool blue-gray. Note colors that are consistently absent from liked images.
- **Subject approach:** Environmental (subject shown in context, lots of surroundings), intimate (close-cropped, subject fills frame), abstract (texture, geometry, partial subjects), documentary (candid, moment-driven). Each approach has implications for depth of field and focal length preferences.
- **Light quality:** Hard directional (strong shadows, defined edges, midday or artificial), soft diffused (overcast, window light, reflected, no hard shadows), backlit (subject darker than background, rim light), golden hour (warm, long shadows, directional but soft). Identify not just what light they like but what they do when ideal light is unavailable.
- **Texture and detail:** Do the liked photos emphasize texture (skin pores, fabric grain, bark, concrete texture)? Or de-emphasize it (smooth skin, soft backgrounds, minimalist surfaces)? This governs sharpening approach, clarity settings, and depth-of-field selection.

After examining all eight dimensions, cross-reference: which values appear in the loved photos AND are absent from the disliked photos? The intersection is the style core. Mark any dimension where preferences conflict -- those become either the "80/20 exceptions" or a signal that the user has two distinct modes.

### Step 3: Identify 4-6 Defining Characteristics -- Make Each Measurable

Distill the analysis into 4-6 named traits. The number matters: fewer than 4 and the style is too vague; more than 6 and it becomes impossible to apply consistently under field conditions. Each trait must pass the "slider test" -- can it be translated to a specific direction on an editing slider, a camera setting, or a compositional choice? If not, it is not specific enough.

**Name each trait.** Not "warm tones" -- "Amber Highlight Warmth" or "Tungsten Skin Glow." The name becomes a shorthand the photographer uses when checking their work.

**Specificity benchmarks to apply:**
- Color temperature: specify Kelvin range, not just "warm"
- Contrast: specify whether blacks are lifted (and to what approximate level on a 0-255 scale), whether whites are pulled, and where on the tonal range the contrast is applied
- Saturation: specify global direction plus any channel-specific adjustments
- Sharpness/clarity: specify whether the style is sharp (high-acuity) or soft, and what tools achieve each
- Grain/texture: specify whether grain is present, what character it has (fine/coarse, luminance-based/color grain), and at what display size it is intended to read

**Each trait requires four components:**
1. What it looks like (visual description using color, tone, and texture language)
2. How to produce it in-camera (timing, settings, technique choices before the shutter fires)
3. How to reproduce it in post-processing (editing directions, slider movements, curve shapes)
4. When to break it (mandatory -- every characteristic has a scene type or subject type where applying it rigidly would harm the photo)

### Step 4: Build the Color Palette Specification

Color is the most powerful consistency mechanism in photography -- it reads before composition, before subject, and before sharpness. A coherent color palette can unify photos from different genres, lighting conditions, and compositions into a recognizable body of work.

**Define the four palette elements:**

- **Dominant color:** The hue family that appears most frequently and controls the overall emotional register. Dominant colors include: amber/gold (nostalgic, warm, inviting), cool blue-gray (modern, melancholy, clean), teal (cinematic, cool, sophisticated), earth/rust (organic, grounded, timeless), neutral/desaturated (classic, timeless, editorial).
- **Accent color:** The secondary hue that appears in smaller quantities and creates visual contrast or tension with the dominant. Teal-and-orange is the most common complementary pair in cinematic grading because orange skin tones paired with teal shadows create inherent contrast without saturation boost.
- **Avoided colors:** Colors to actively suppress or eliminate. These are often the colors that appear in the "dislike" photos. Neon greens, electric cyans, magenta skin tones, and over-boosted primaries appear in styles the user dislikes.
- **Skin tone treatment:** For any photographer who shoots people, this is non-negotiable. Define whether skin reads warm (shifted toward orange-amber -- approx. HSL hue +5 to +10 in orange channel), natural (no adjustment), or cool (shifted toward pink-beige, HSL hue toward red). Specify saturation: vivid skin (portrait beauty, slightly boosted), natural, or slightly desaturated (film emulation styles, matte looks).

**Build the HSL matrix.** In HSL (Hue/Saturation/Luminance) editing, each color channel can be independently adjusted. A style's color character is often defined by the combination of channel adjustments across the palette:

| Channel | Hue | Saturation | Luminance |
|---------|-----|------------|-----------|
| Red (typically fabric, lips, some architecture) | direction | direction | direction |
| Orange (typically skin, sunsets, warm objects) | direction | direction | direction |
| Yellow (typically foliage, sunlight, some skin) | direction | direction | direction |
| Green (typically vegetation, outdoor backgrounds) | direction | direction | direction |
| Aqua (typically skies near horizon, some water) | direction | direction | direction |
| Blue (typically sky, shadows, water) | direction | direction | direction |
| Purple (typically shadows, certain fabrics) | direction | direction | direction |
| Magenta (typically flowers, some artificial light) | direction | direction | direction |

For a warm, muted style: orange hue shifts toward yellow (prevents orange skin), saturation reduced 10-15; blue hue shifts toward teal (adds cinematic contrast with amber highlights), saturation reduced 15; green hue shifts toward teal or olive, saturation reduced 20.

**Specify split toning / color grading targets.** Most editing platforms allow separate color casts in highlights, midtones, and shadows:
- Describe the highlight color by hue and approximate strength (e.g., "amber, hue 35-40, saturation 10-15")
- Describe the shadow color by hue and approximate strength (e.g., "blue-teal, hue 200-215, saturation 8-12")
- Specify whether the midtones should be neutral or shifted

### Step 5: Define the In-Camera Strategy

A style guide that only covers post-processing produces inconsistent source files that require heavy-handed editing to reach the desired look -- and heavily edited photos often lose quality. The best photographic styles are half-captured. Define:

**Light timing and conditions:** If the style is warm and soft, specify what to do in harsh midday light (seek shade, shoot in doorways, look for reflected light from warm surfaces). If the style is high-contrast and graphic, specify that midday hard light is ideal rather than avoided.

**Exposure strategy:** Define the target histogram position:
- ETTR (expose to the right) -- pushing exposure toward the right edge of the histogram without clipping highlights -- preserves maximum shadow detail for styles requiring lifted shadows
- Standard metering -- for styles with natural tonal range
- Protect highlights -- for styles with rich shadows and controlled highlights (pull exposure left, recover in post)

**Depth of field preference:** Wide aperture (f/1.2-f/2.8) for soft background separation -- associated with intimate, portrait-adjacent styles. Moderate aperture (f/4-f/8) for environmental sharpness -- landscapes, street, architecture. The style guide should specify a "default aperture zone" for the primary subject treatment.

**White balance capture strategy:** Set a custom white balance in-camera to match the desired style warmth, or shoot at a fixed Kelvin (5600K for neutral, 6200K for warm, 4800K for cool). Shooting at a fixed white balance produces more consistent RAW files and reduces post-processing correction time. Shooting Auto WB produces files that require individual correction on every image.

**Focal length tendencies:** Different focal lengths produce different perspective compression, background rendering, and spatial relationships between subject and environment. 24-35mm: environmental, immersive, slight distortion at close range. 50mm: natural perspective, versatile. 85-135mm: compression, separation, flattering portrait distortion. 200mm+: maximum compression, isolated subjects. The style guide should specify which focal length zone best serves the style.

**Compositional constraints:** Identify 2-3 compositional tendencies that reinforce the style. These are not rules applied to every photo -- they are the photographer's default tendency when they have a choice. Examples: "Favor foreground elements that frame the subject" or "Default to negative space rather than filling the frame" or "Look for leading lines before shooting."

### Step 6: Define the Post-Processing Base Edit

The base edit is the single most important consistency tool in a style guide. Every photo -- regardless of subject, lighting, or exposure -- begins with this base and is adjusted from it. It encodes the core color and tonal decisions of the style.

**Structure the base edit as a layered adjustment sequence:**

1. **White balance:** Target Kelvin value and tint adjustment
2. **Exposure correction:** Only the amount needed to hit the target histogram position (this varies per photo -- do not set a fixed value, but describe the target result)
3. **Tone curve adjustments:**
   - Black point lift: how much (in 0-255 scale or percentage)
   - White point pull: how much
   - Midtone contrast: S-curve amount and placement (lower midtone anchor: shadows, upper midtone anchor: highlights)
4. **Basic sliders (Lightroom-style or equivalent):**
   - Highlights, shadows, whites, blacks: directional targets
   - Clarity: positive (texture/microcontrast) or negative (softening), approximate amount
   - Vibrance vs. saturation: specify which to prefer and direction
5. **HSL matrix:** The full channel adjustments from Step 4
6. **Color grading / split toning:** Highlight hue and saturation, shadow hue and saturation, midtone bias
7. **Detail:** Sharpening amount, radius, and masking threshold; noise reduction luminance and color amounts
8. **Effects:** Grain amount, size, and roughness; vignette amount and style (feathering, highlights)
9. **Lens corrections:** Enable/disable chromatic aberration correction, lens profile correction; these affect the "clinical" vs. "organic" feel

**Specify what is NOT in the base edit.** Local adjustments (skin retouching, sky selections, dodge and burn) are per-photo decisions, not base-edit elements. The base edit must be applicable to every photo in a single action.

**Calibration note:** Camera calibration (profile selection) is the most upstream decision in the editing pipeline and affects all downstream adjustments. Film emulation profiles (Kodak Portra, Fuji 400H, etc.) or custom calibration profiles should be specified if the style depends on a specific color science baseline. If using a software-specific film emulation profile, note that all HSL values in the guide are calibrated for that profile as a starting point.

### Step 7: Build the Consistency Framework and Produce the Style Guide Document

Consistency is not rigidity -- it is a recognizable thread running through varied photos. Define the mechanisms:

**The 80/20 rule:** 80% of photos follow the style guide exactly. 20% may deviate for deliberate creative reasons. The 20% must be intentional, not accidental -- if a photo deviates because the editing was rushed, it weakens the portfolio. If it deviates because the scene demanded a different treatment, it demonstrates range.

**Portfolio curation criteria:** When selecting photos for publication (Instagram grid, website gallery, physical portfolio book), apply these filters in order:
1. Does it represent the subject matter of the portfolio? (Genre match)
2. Does it follow the style guide? (Aesthetic match)
3. Is it technically strong? (Sharpness, exposure, composition)
4. Does it add something the portfolio does not already have? (Subject variety, emotional range)
The order matters: a technically mediocre photo that fits the style is often better for the portfolio than a technically excellent photo that breaks it.

**Sequencing rules for multi-image presentations:** When arranging photos in a grid or slideshow sequence, avoid: two photos with identical tonal weight (two very bright photos or two very dark photos) side by side, identical compositional structure in adjacent frames (two centered-subject portraits together), repetitive color blocking (two images with large blue areas adjacent). Vary these elements while maintaining the style's color and tonal signature.

**Style evolution cadence:** Revisit the style guide every 6-12 months. Identify one dimension that feels stale or that has drifted in the existing work. Adjust that single dimension and shoot with the update for 2-3 months before evaluating. Never overhaul more than 2 characteristics simultaneously -- it creates a discontinuity in the body of work that reads as inconsistency rather than evolution.

**Cross-platform adaptation:** The same style guide may need different tuning for different platforms. Instagram compresses and re-encodes JPEGs, slightly crushing shadows and shifting colors -- export specifically for Instagram at the highest quality JPEG setting and account for the platform's saturation boost by slightly reducing saturation in the export. Print requires different considerations: shadows print darker than they appear on screen, and grain that looks elegant on a monitor can look dirty in large format. Specify any platform-specific adjustments.

---

## Output Format

Produce the following document as the style guide. Every field must be filled with specific values or specific directional guidance -- no placeholders.

```
## Photography Style Guide: [Photographer Name or Brand]

**Primary Genre:** [street | portrait | landscape | documentary | product | mixed]
**Secondary Genre:** [if applicable]
**Platform:** [Instagram | portfolio website | client PDF | print portfolio | mixed]
**Emotional Intent:** [The feeling a viewer should experience in the first 3 seconds of looking at this work]
**Style Summary:** [3-4 sentences describing the overall aesthetic -- include color character, tonal
  approach, light preference, and the emotional or narrative quality of the work]

---

### Defining Characteristics

#### 1. [Trait Name -- specific, memorable]
**What it looks like:** [Visual description using color, tone, texture, and light language.
  What would a viewer notice first about this characteristic?]
**In-camera:** [Settings, timing, technique choices, and conditions that produce this
  characteristic before editing. Specific enough to apply on a shoot.]
**In post-processing:** [Specific adjustment directions. Which sliders, which channels, which
  curve shape. Include approximate values where useful.]
**When to break it:** [Describe a specific type of scene, subject, or situation where applying
  this trait rigidly would harm the photo. What to do instead.]

#### 2. [Trait Name]
**What it looks like:** [...]
**In-camera:** [...]
**In post-processing:** [...]
**When to break it:** [...]

#### 3. [Trait Name]
**What it looks like:** [...]
**In-camera:** [...]
**In post-processing:** [...]
**When to break it:** [...]

#### 4. [Trait Name]
**What it looks like:** [...]
**In-camera:** [...]
**In post-processing:** [...]
**When to break it:** [...]

[Add traits 5 and 6 if analysis warrants them. Maximum 6.]

---

### Color Palette

**Dominant color:** [Name, hue family, saturation level, where it appears in the image]
**Accent color:** [Name, hue family, where it creates contrast with the dominant]
**Avoided colors:** [Specific hues or color qualities to suppress]
**Skin tone treatment:** [warm | natural | cool | desaturated; specific HSL direction]

**HSL Adjustment Targets:**

| Channel | Hue Shift | Saturation | Luminance |
|---------|-----------|------------|-----------|
| Red | [toward magenta / toward orange / neutral] | [increase / reduce / approx. amount] | [increase / reduce / neutral] |
| Orange | [toward red / toward yellow / neutral] | [increase / reduce / approx. amount] | [increase / reduce / neutral] |
| Yellow | [toward green / toward orange / neutral] | [increase / reduce / approx. amount] | [increase / reduce / neutral] |
| Green | [toward yellow / toward teal / neutral] | [increase / reduce / approx. amount] | [increase / reduce / neutral] |
| Aqua | [toward green / toward blue / neutral] | [increase / reduce / approx. amount] | [increase / reduce / neutral] |
| Blue | [toward teal / toward purple / neutral] | [increase / reduce / approx. amount] | [increase / reduce / neutral] |
| Purple | [toward blue / toward magenta / neutral] | [increase / reduce / approx. amount] | [increase / reduce / neutral] |
| Magenta | [toward red / toward purple / neutral] | [increase / reduce / approx. amount] | [increase / reduce / neutral] |

**Color Grading / Split Toning:**

| Zone | Hue | Saturation |
|------|-----|------------|
| Highlights | [hue value 0-360] | [approximate strength 5-25] |
| Midtones | [hue value or neutral] | [approximate strength or 0] |
| Shadows | [hue value 0-360] | [approximate strength 5-20] |

---

### Base Edit (Starting Point for Every Photo)

**Camera Profile / Base Calibration:** [Film emulation profile name, or "Adobe Standard", or "Camera Faithful", etc.]

**White Balance:**
- Kelvin target: [value]
- Tint: [toward green / toward magenta / neutral]

**Tone Adjustments:**
- Highlights: [direction and approximate amount, e.g., "reduce -20 to -35 to prevent clipping"]
- Shadows: [direction and approximate amount]
- Whites: [direction and approximate amount]
- Blacks: [direction and approximate amount -- note if lifting for faded/matte look]

**Tone Curve:**
- Black point: [lift from 0 to approximately X, or leave at 0]
- Shadow midtone: [anchor point, direction]
- Highlight midtone: [anchor point, direction]
- White point: [pull from 255 to approximately X, or leave at 255]
- Curve shape description: [flat for matte, gentle S for natural, steep S for high contrast]

**Presence:**
- Clarity: [amount and direction -- negative for soft skin/haze, positive for texture/grit]
- Vibrance: [direction and approximate amount]
- Saturation: [direction and approximate amount -- global adjustment]

**Detail:**
- Sharpening amount: [0-150 scale, typical range 25-60 for most styles]
- Sharpening radius: [0.5-3.0, typical 0.8-1.2]
- Sharpening masking: [0-100 -- higher values protect smooth areas from sharpening]
- Noise reduction (luminance): [direction and approximate amount]
- Noise reduction (color): [direction and approximate amount]

**Effects:**
- Grain amount: [0 for no grain, 10-20 for subtle, 25-40 for visible film quality, 40+ for heavy]
- Grain size: [10-60; smaller = finer, larger = coarser]
- Grain roughness: [0-100; higher = more random/organic distribution]
- Vignette amount: [negative = darken edges; 0 = none; positive = brighten edges]
- Vignette feather: [0-100; higher = softer transition]

---

### Consistency Framework

**Shooting strategy summary:**
- Preferred light conditions: [describe]
- Avoid: [light conditions that produce results contrary to the style]
- Exposure strategy: [ETTR / protect highlights / standard metering]
- White balance capture: [fixed Kelvin value / custom WB / Auto WB]
- Focal length zone: [wide 24-35mm / standard 50mm / short tele 85-135mm / mixed]

**Portfolio curation rule:** [How to select photos that maintain style integrity.
  What gets excluded even if technically strong. What gets included even if imperfect.]

**Sequencing rule:** [How to arrange photos in a grid, gallery, or book for visual rhythm.
  What tonal and compositional variations to apply between adjacent images.]

**80/20 rule:** [What the 80% looks like (the core style). What the 20% deviation
  looks like -- specific types of images that can break the style intentionally.]

**Platform-specific adjustments:**
- [Platform 1]: [Any export or display adjustments]
- [Platform 2]: [Any export or display adjustments]

**Evolution cadence:** [When to revisit. What process to use for updating.
  How to introduce changes gradually without creating discontinuity.]

---

### Reference Board

**Photographers with overlapping aesthetic elements:**
- [Name]: [Which specific element -- color, composition, light, subject -- they share with this style. What element NOT to import from them.]
- [Name]: [Same format]
- [Name]: [Same format]

**Style keywords (for self-reference, social tagging, or art direction briefs):**
[6-10 specific words or short phrases that describe the style]

**Anti-keywords (what this style explicitly is NOT):**
[4-6 words describing looks to avoid -- useful when referencing the guide before a shoot]
```

---

## Rules

1. **Every defining characteristic must pass the "slider test."** If a trait cannot be described in terms of a specific slider direction, a camera setting, or a measurable compositional choice, it is too vague to be actionable. "Dreamy quality" is not a trait. "Clarity at -15 to -20, combined with slight highlight glow from pulled-in whites and a soft split-tone highlight in warm amber" is a trait.

2. **Base your analysis strictly on the user's stated preferences, not on current trends.** Film emulation, teal-and-orange, and dark moody presets are common enough that users sometimes ask for them because they are familiar, not because they genuinely prefer them. Always probe: "Does this match what you described loving in specific photos, or is it something you've seen a lot of?" The style guide should reflect the photographer's actual eye, not a trend cycle.

3. **The base edit must be applicable to every photo in a single action without producing an unacceptable result.** If the base edit over-warms a blue-toned rain scene, it means the blue scene is either a 20% exception (don't apply the base) or the warmth in the base is too aggressive (pull it back). Test the base edit mentally against the most challenging cases: harsh midday light, overcast flat light, mixed artificial/natural light, night, and interiors.

4. **The HSL color palette must specify all eight channels, not just the dominant colors.** Skipping channels (commonly purple and magenta) creates unexpected color shifts in specific scenes. The purple channel controls many artificial light sources, shadow color casts, and floral elements. Ignoring it produces inconsistent results whenever those elements appear.

5. **Each defining characteristic must include a "when to break it" clause.** A style guide without exceptions is a cage. The "when to break it" clause is also where the photographer's judgment lives -- it defines when the emotional content of the scene overrides the technical consistency of the style. Without this clause, rigid adherence to the guide produces lifeless work.

6. **The "80/20 rule" must specify what the 20% looks like, not just that it exists.** Saying "20% can deviate" without specifying what kind of deviation is acceptable creates ambiguity. The 20% should be named -- "B&W conversions for high-contrast graphic subjects," or "cool blue treatment for rainy/night scenes," or "high-key bright treatment for children's portraits." Named exceptions feel intentional; unnamed exceptions feel like mistakes.

7. **Skin tone treatment is mandatory if the photographer shoots people, even occasionally.** Color grading decisions that look good on architecture or landscape can produce unacceptable skin colors -- green-shifted yellows make skin look ill; over-aggressive teal shadows on orange skin produce a toxic orange-teal skin tone. Always specify and protect the orange HSL channel for skin, regardless of whether portraiture is the primary genre.

8. **Do not assign fixed exposure or editing values to the base edit -- describe directions and targets.** A base edit that says "set exposure to +0.3" will overexpose a bright scene or underexpose a dark one. Instead, say "push exposure until shadows reach the target value" or "protect highlights by pulling exposure until the right edge of the histogram is 1/4 stop from clipping." Results-based instructions are camera-agnostic and exposure-agnostic.

9. **The style guide is a living document -- include a structured evolution process.** Styles drift when they are not intentionally managed. Every revision to the style guide should document: the date, the element changed, the reason for the change, and the previous value. This creates a style changelog that helps the photographer understand their own development and prevents accidental reversions.

10. **Never recommend copying a reference photographer's style wholesale.** When a photographer references another artist, extract 2-3 technical elements from that artist's work and identify which ones resonate with the user's stated preferences. The reference photographer is a compass direction, not a destination. The output must be the user's own synthesis -- using the referenced work as input, not as template.

11. **Cross-reference related skills explicitly.** The style guide defines WHAT the aesthetic is. It does not teach the user HOW to compose individual photos (use `composition-guide`), HOW to set exposure in the field (use `exposure-triangle`), or HOW to execute the editing steps on a specific photo (use `photo-editing-workflow`). When the style guide describes an in-camera or editing technique that requires deeper explanation, note the appropriate companion skill.

12. **Grain is a texture decision, not just an aesthetic decoration.** Grain amount, size, and roughness interact with the image's base noise and with the output medium. Fine grain (amount 20-30, size 15-25) reads as film emulation on web display but disappears in large print. Coarse grain (amount 35-50, size 40-60) adds significant texture at all sizes. Specify grain with the output medium in mind, and note that grain added in post interacts with the camera's native noise -- for high-ISO captures, the in-post grain addition may need to be reduced.

---

## Edge Cases

### User Has No Clear Preferences ("I Don't Know What My Style Is")

This is common among photographers who have been shooting for 1-3 years and have absorbed many influences without synthesizing a personal direction. Do not skip the input step -- reframe it.

Instead of asking for photos they love, ask for **3-5 emotions** they want their photos to evoke. Emotions map reliably to visual characteristics:

| Emotion | Color temperature | Contrast | Saturation | Tonal key |
|---------|-----------------|----------|------------|-----------|
| Nostalgia | Warm (6000-6500K) | Low-medium | Muted (-15 to -25) | Mid to slightly bright |
| Intimacy | Warm or neutral | Low | Muted to natural | High key or low key depending on mood |
| Melancholy | Cool (4500-5200K) | Medium | Desaturated (-25 to -40) | Low key |
| Energy | Neutral to warm | High | Vivid (+10 to +20) | Standard |
| Serenity | Cool-neutral | Low | Muted | Slightly high key |
| Awe/Wonder | Cool or neutral | Medium-high | Natural to vivid | Standard to slightly low |
| Unease/Tension | Cool or mixed | High | Desaturated or split saturation | Low key |

Build the style from the emotional target and present it to the user: "Based on nostalgia and intimacy, here's what that translates to visually..." Let them confirm or redirect.

### User Shoots Multiple Genres (Portraits AND Landscapes AND Street)

The common error is to create a style guide that only works for one genre and then note "adapt as needed" for others. This produces inconsistency, which is exactly the problem the user came to solve.

**The solution:** Anchor the style to the characteristics that travel across genres, and treat subject-specific characteristics as genre overlays.

Characteristics that travel across genres:
- Color temperature and split toning (works on any subject)
- Saturation approach (works on any subject)
- Black point treatment (matte vs. rich, works on any subject)
- Grain character (works on any subject)
- Overall tonal key (works on any subject)

Characteristics that are genre-specific (handle as overlays):
- Depth of field choice (portraits: shallow; landscapes: deep; street: variable)
- Compositional tendencies (differ by genre)
- Sharpening targets (skin vs. rock vs. architectural detail require different settings)
- Subject distance and framing

Build the style guide with the universal characteristics as the core, then add a short "genre overlay" section for each genre the photographer shoots, specifying only the departures from the core.

### User's Preferences Contradict Each Other

If a user loves both high-contrast dramatic images (deep blacks, rich shadows, punchy colors) AND soft airy images (lifted shadows, muted colors, clean whites), these are genuinely opposite tonal approaches. Forcing them into one style produces a muddy compromise that satisfies neither.

**Approach 1: Identify the shared element and build around it.** Both sets of liked images may share a consistent color temperature, a specific subject type, or a compositional tendency. Build the core style around the shared element. The contrast approach becomes the "mode" variation.

**Approach 2: Define two named modes within one style.** This is appropriate when the two approaches genuinely serve different subjects or emotional intents. Name them explicitly:
- "Primary mode: Quiet Light" (for intimate subjects, overcast conditions, contemplative scenes)
- "Secondary mode: Bold Contrast" (for graphic subjects, strong directional light, environmental shots)

Both modes share the same color palette, focal length tendencies, and grain treatment. They differ only in contrast and tonal key. This creates a style that is internally varied but externally coherent -- the color palette and grain act as the recognizable thread.

**Approach 3: Rule by frequency.** Ask: "Which type of photo do you make more often?" Build the primary style around the more frequent approach. The minority approach becomes the 20% exception with named parameters.

### User Wants to Emulate a Specific Photographer's Style Exactly

This is the imitation trap. Copying another photographer's style is achievable technically but counterproductive artistically and often commercially -- a portfolio that reads as a copy of a known photographer invites comparison and loses every time.

**The correct approach:**
1. Analyze the referenced photographer's work across the eight visual dimensions from Step 2
2. Extract the 2-3 elements that are technically unique and visually striking about that photographer's work
3. Ask the user which of those elements they are drawn to -- this is often not the whole style but a subset
4. Ask what the user would add from their own preferences that the reference photographer does NOT do
5. Build the style guide from the intersection of the extracted elements and the user's additions

Example: A user who wants to shoot "like Saul Leiter" probably means they want foreground obstruction, color field composition, and soft focus areas -- not that they want to document New York in the 1950s. Extract those three technical elements, combine with the user's stated color preferences and subject matter, and build a personal style.

Always note in the style guide: "Referenced [photographer] for [specific element]. This style is distinct in [specific difference]."

### Commercial Photographer Who Needs Multiple Client Styles

A commercial photographer must deliver work that matches each client's brand standards while maintaining enough personal signature to remain hireable and recognizable. The solution is not multiple completely separate style guides -- it is a hierarchical system.

**Layer 1: Personal signature (unchanged for all work)**
These characteristics are the photographer's visual fingerprint. They appear in the portfolio, in personal work, and subtly in client work. Typically: compositional tendencies, light preference, depth of field approach. These are not editable by clients -- they are why the photographer was hired.

**Layer 2: Adjustable parameters (modified per client)**
Color temperature (client brand may require neutral or a specific hue), saturation level (product and fashion clients often want higher saturation than editorial clients), contrast level (varies by brand guideline), skin tone treatment (cosmetics clients have exacting standards; lifestyle clients have more flexibility).

**Layer 3: Client-specific overrides**
Specific HSL channel values to match brand color standards, specific export profiles, specific retouching standards.

Build the personal style guide at Layer 1-2, and document each client's Layer 3 overrides separately. The personal guide governs the photographer's portfolio and social media. The client overlay governs deliverables for that client.

### User Has an Existing Preset or Edit Style That "Doesn't Quite Work"

Some users come with an existing editing approach -- typically a purchased preset they have modified, or a self-taught editing style that has accreted over time -- and feel it is close but not right.

**Diagnostic approach:** Run the existing style through the eight-dimension analysis from Step 2. Identify the dimension that creates the disconnect. Common issues:
- **Preset is too extreme in one dimension:** Grain is too heavy, saturation is too aggressive, contrast is too high -- the style is correct in direction but not in magnitude
- **Preset conflicts with the user's natural shooting style:** A dark, moody preset applied to a photographer who instinctively exposes bright produces fighting forces -- the edit battles the capture
- **Preset was designed for a different genre:** A portrait-optimized preset (warm skin, lifted shadows, flattering clarity) applied to landscape photos produces weak, muddy results
- **The color palette is correct but skin tones are wrong:** The preset was built for non-skin subjects and the orange/red HSL channels need adjustment

Once the conflicting dimension is identified, adjust only that dimension rather than building from scratch. Document the change in the style guide's changelog.

### User Shoots Film (No Digital Post-Processing)

Film photographers have a different consistency framework: they choose stock rather than editing sliders, and their consistency tool is the emulsion choice, processing decisions, and scanning parameters.

**Adapt the style guide structure:**

- **Defining characteristics:** Same structure, but the "in post-processing" sub-bullet describes darkroom or scanning decisions rather than software sliders. For hybrid shooters who scan and edit: the film emulation profile in software should match (or complement) the actual film stock's character.
- **Base edit equivalent:** Film stock selection + development (standard C-41 or push/pull, standard E-6, or cross-processing), scanner settings (exposure, color profile), and scanning post-processing (only minimal correction, not full digital editing).
- **Color palette:** Film stocks have characteristic color science: Kodak Portra 400 -- warm skin, restrained saturation, smooth highlights; Fuji Provia 100F -- vivid, neutral, rich blues; Ilford HP5 -- fine grain, slightly warm black-and-white; Kodak Tri-X -- coarser grain, slightly harsh contrast.
- **Consistency framework:** The stock selection IS the preset equivalent. Shooting the same stock consistently, processed at the same lab with the same scanning parameters, produces baseline consistency. Variation within a roll comes from light and subject, not from editing.

---

## Example

**Input:**

"I want to develop a photography style. I shoot mostly documentary-style portraits and street photography, sometimes both in the same project. I want my portfolio to feel cohesive. Photos I love: I love images with a slightly faded, melancholic quality -- deep shadows but not pure black, skin tones that feel real but slightly cool, like the light isn't quite flattering. I love photos that feel like the subject is caught mid-thought. I dislike over-processed HDR, bright and airy pastel looks, warm golden-hour treatment, and anything that looks like a preset from 2015. Photographers I admire: Alec Soth -- the quiet stillness, the color, the way subjects seem slightly alienated from their surroundings. Richard Billingham -- the raw, close domestic space, the unflattering color. I shoot digital, mostly available light, and I want to post on Instagram and use this for a portfolio website."

---

**Output:**

## Photography Style Guide: Documentary Portraits / Street

**Primary Genre:** Documentary portrait
**Secondary Genre:** Street photography
**Platform:** Instagram grid and portfolio website
**Emotional Intent:** A viewer should feel quiet discomfort and recognition -- as if they have interrupted a private moment. Not sadness, but the weight of ordinary human experience.
**Style Summary:** Muted, slightly cool documentary photography with lifted shadow detail, controlled color depth, and an unflinching quality of observation. The palette is restrained -- desaturated mid-tones, controlled blues in shadows, and skin rendered at accurate or slightly cool temperature, resisting the flattery of warmth. The light is utilitarian: available, often imperfect, embraced rather than corrected. Grain adds tactility. The work should feel like a document first, a photograph second.

---

### Defining Characteristics

#### 1. Lifted Matte Shadows -- "The Faded Document"

**What it looks like:** The deepest shadows in the image register as dark gray, not pure black. The shadow area has visible texture and detail -- fabric folds, wall surfaces, floor material. The image reads as high-quality print that has been handled -- not pristine, not deteriorated, but lived in. On a 0-255 scale, the darkest pixel in a typical image reads approximately RGB 18-30, not 0.

**In-camera:** Expose slightly to the right of the meter reading -- approximately +0.3 to +0.5 EV. This captures shadow detail that can be lifted in post without significant noise amplification. Avoid shooting in situations where the dynamic range requires more than 2 stops of shadow recovery -- the lifted shadow approach works best when shadow detail is captured cleanly at the source.

**In post-processing:** On the tone curve, lift the bottom-left anchor point from 0 to approximately 18-25 (on a 0-255 scale). This permanently raises the black point across the image. Alternatively, use the Blacks slider: raise to +15 to +25. Do not compensate by lowering the shadows slider -- the goal is lifted depth, not flattened contrast. The shadow color grading (Characteristic 4) will add visual depth that compensates for the lifted blacks.

**When to break it:** When a silhouette composition is the structural core of the image -- a backlit subject against a window or an open door. In these cases, let the blacks go to true 0 for the silhouetted shape, but keep the lifted shadow treatment for any mid-shadow areas outside the silhouette. The silhouette break is intentional and recognizable.

---

#### 2. Controlled, Slightly Cool Skin Tones -- "Real Light, Not Flattering Light"

**What it looks like:** Skin appears accurate to a slightly cool ambient light condition -- as if lit by north-facing window light or an overcast sky. Skin does not glow, does not appear bronzed, and does not read as warm. There is enough desaturation in the skin to prevent orange-tan skin from dominating the image. Skin reads as a face, not as a sunlit object.

**In-camera:** Shoot under available cool-neutral light: north-facing windows, open shade, overcast exterior, fluorescent interiors (do not warm-correct the WB). Set white balance to a fixed 5000-5200K -- cooler than neutral daylight (5500K), which gives the slight blue-neutral cast to the overall image and keeps skin from reading orange-warm. Do not use tungsten or warm practical lights as the key light source -- they push skin far warmer than the style requires.

**In post-processing:** In the HSL panel, shift orange hue toward red by -5 to -8 (this pushes skin away from orange-amber and toward a more neutral-pink direction). Reduce orange saturation by -12 to -18. Reduce red saturation by -8 to -12. Do not boost luminance in the orange channel -- the goal is not bright skin but real skin. If editing a high-saturation skin tone, reduce further until the skin reads as part of the scene, not as the most saturated element.

**When to break it:** When the subject is photographed under strong, unavoidably warm artificial light (a single tungsten lamp in a dark room, a sodium-vapor street light). In these cases, the warm light IS the document -- correcting it would falsify the environmental record. Let the skin go warm and do not correct, but maintain the matte shadow treatment and the desaturation elsewhere.

---

#### 3. Restrained Desaturation -- "Controlled Color Depth"

**What it looks like:** Colors are present and identifiable but subdued. The image does not look color-drained -- a red coat is still red, a green wall is still green -- but no color shouts for attention. The palette reads as quiet. Global saturation is reduced, but selective channel control prevents any single color from reading as anemic. This is not a faded look (which implies luminance reduction) -- the colors are desaturated, not dim.

**In-camera:** Shoot in environments where color is architectural or environmental rather than performative -- interior spaces, street scenes with natural building color, subjects in neutral or earth-tone clothing. Avoid high-saturation synthetic colors (bright synthetic fabrics, primary-color signage) unless that color is the subject. Shoot RAW to preserve full color data for selective channel control in post.

**In post-processing:** Global saturation: -18 to -25. Vibrance: -5 to -10 (vibrance protects skin tones when reduced; here reduce it moderately to control mid-saturation colors without making the image feel too gray). Then selectively recover specific channels: blue saturation reduced -15 (prevents over-saturated skies and shadows), green saturation reduced -20 (prevents vivid foliage from pulling attention), red reduced -10, orange reduced -15 (see Characteristic 2). Allow colors that are already naturally muted (brown, beige, gray) to remain without further reduction.

**When to break it:** When a single vivid color object is compositionally isolated and semantically important -- a red telephone booth, a bright yellow umbrella, a vivid piece of children's clothing. In the Billingham and Soth tradition, a single saturated element amid general muting creates visual punctuation. Apply a selective color mask to restore saturation to that element only, while maintaining the desaturated treatment everywhere else.

---

#### 4. Blue-Gray Shadow Grading -- "The Cool Depth"

**What it looks like:** The shadow areas have a subtle blue-gray cast -- not teal, not turquoise, but the cool blue-gray of shadow on a cloudy day or the edge of a north-facing room. This shadow color creates depth and visual separation between the lifted shadow detail (Characteristic 1) and the midtones without requiring true-black contrast. The shadows feel dimensional but not dramatic.

**In-camera:** This is primarily a post-processing characteristic. In-camera, prefer available light situations where shadows are naturally cool (north window, open shade, overcast) -- these require less correction in post and contribute naturally to the shadow color.

**In post-processing:** In color grading/split toning: Shadow hue 215-225 (blue, slightly toward cyan rather than purple), saturation 10-15. This is subtle -- the shadows should not read as "tinted" on casual viewing but should create the cumulative cool temperature in the darker areas. Set highlight color grading to neutral or extremely slight cool hue (hue 195-205, saturation 4-6) -- this prevents any warmth from entering the highlights, keeping the image consistently cool without being aggressively blue.

**When to break it:** Tungsten interior scenes where the warm practical light occupies the shadow zones (the lamp itself and its immediate illumination). In these cases, the warm shadow light is a document of the environment -- do not override it with a cool shadow grade. Identify whether the shadow zone is "cool environmental shadow" (grade applies) or "warm artificial light in a dark environment" (grade does not apply).

---

#### 5. Organic Film Grain -- "The Tactile Record"

**What it looks like:** A consistent, fine-to-medium grain texture that reads as photographic -- reminiscent of pushed 35mm film (Kodak Tri-X at 1600, Fuji Neopan 1600, or HP5 pushed one stop). The grain is luminance-based (not color noise). It is distributed across the image but most visible in the shadow and midtone areas. At web display size, the grain provides subtle texture. At full-resolution viewing, it is clearly visible and adds tactility.

**In-camera:** Shoot
