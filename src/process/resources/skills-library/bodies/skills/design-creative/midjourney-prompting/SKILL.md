---
name: midjourney-prompting
description: |
  Crafts Midjourney v6/v7 prompts with structured subject, environment, style, medium, lighting, and parameter syntax including --ar, --style, --q, --v, --chaos, --cref, and --sref.
  Use when the user asks to create a Midjourney prompt, generate AI art with Midjourney, write image prompts for Midjourney, or optimize Midjourney parameters.
  Do NOT use for DALL-E prompting (use dalle-prompting), Stable Diffusion prompting (use stable-diffusion-prompting), or translating prompts between models (use prompt-translation).
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
# Midjourney Prompting

## When to Use

**Use this skill when:**
- The user explicitly asks to write, generate, build, or improve a Midjourney prompt
- The user wants to achieve a specific visual result in Midjourney and needs help structuring the prompt to get there
- The user has a Midjourney output they are unhappy with and wants to refine the prompt to fix it
- The user wants to understand why their current prompt is producing unexpected results and how to correct it
- The user wants to explore a specific visual style, art movement, photographic technique, or rendering aesthetic within Midjourney
- The user wants to generate production-ready assets (ad creative, wallpapers, social media visuals, concept art) and needs parameter optimization
- The user asks about Midjourney v6.1 or v7 capabilities, differences, or parameter syntax

**Do NOT use when:**
- The user wants a DALL-E 3 or GPT-image-1 prompt -- use `dalle-prompting` instead, as those models respond to natural language prose differently
- The user wants a Stable Diffusion, SDXL, Flux, or ComfyUI prompt -- use `stable-diffusion-prompting`, which covers negative embedding syntax, LoRA triggers, and CFG scale
- The user wants to translate an existing Midjourney prompt into another model's format -- use `prompt-translation`
- The user explicitly needs character consistency across multiple Midjourney images using `--cref` -- use `midjourney-consistency` which covers the character reference workflow in depth
- The user needs style reference image workflows (`--sref`) beyond basic syntax -- use `midjourney-consistency` for that complete workflow
- The user is asking about Midjourney's subscription tiers, billing, upscaling workflows, or platform UI features -- those are product questions, not prompting questions

---

## Process

### Step 1: Diagnose the user's actual need before writing a single word

Before constructing any prompt, determine which of these four situations the user is in:

- **Starting from scratch:** User has an idea but no existing prompt. Gather all components in Step 2.
- **Fixing a broken prompt:** User has a prompt and unhappy output. Identify the failure mode first (wrong style, wrong composition, wrong mood, wrong anatomy), then correct the specific layer causing it.
- **Optimizing a working prompt:** User likes the output but wants it sharper, more stylized, more realistic, or more varied. Adjust parameters rather than rewrite descriptors.
- **Translating a concept:** User has a reference image, mood board, or verbal concept and needs it converted to Midjourney syntax. Focus on distilling visual characteristics into prompt vocabulary.

Ask clarifying questions only when a critical component is genuinely ambiguous. Do not ask about every field -- infer reasonable defaults for obvious use cases (e.g., a "desktop wallpaper" implies `--ar 16:9`, a "phone screen" implies `--ar 9:16`).

---

### Step 2: Gather and organize the five core components

Every Midjourney prompt has five distinct layers. Evaluate which layers the user has specified and fill in gaps with expert defaults:

**Layer 1 -- Subject (highest influence, always first)**
- The subject is what the image is fundamentally about. It must be the first thing in the prompt because Midjourney weights earlier tokens more heavily.
- Be precise about: species/type, age/scale, action/pose, emotional state, materials/textures, and distinguishing features.
- Weak: "a woman standing outside" -- Strong: "a weathered 60-year-old Icelandic fisherwoman standing on a salt-crusted dock at dawn, hands wrapped around a thermos, stoic expression, wool sweater"
- For objects: specify material (brushed aluminum, cracked porcelain, hand-thrown stoneware), surface condition (patinated, polished, worn), and scale reference when ambiguous.
- For scenes without a clear focal subject, name the dominant environmental element first and treat it as the subject.

**Layer 2 -- Environment and Context**
- Location specificity matters: "a brutalist concrete library" performs better than "a library"
- Time of day drives lighting automatically -- "golden hour," "blue hour," "overcast noon," "3am streetlight" each trigger distinct Midjourney lighting behaviors
- Season and weather: "late October, frost on the grass, bare oak trees" versus "summer, heat haze rising, dry cracked earth"
- Spatial scale: macro (postage stamp, insect eye), human-scale (room, street), architectural (skyline, canyon)

**Layer 3 -- Medium, Style, and Aesthetic**
- This is the most consequential creative decision. Choose one primary medium and at most two style modifiers.
- Photography terms: analog film, digital editorial, documentary, street photography, product photography, macro photography, medium format film
- Illustration terms: ink wash, pen and ink, woodblock print, risograph, gouache, digital concept art, architectural sketch, technical illustration
- Painting terms: oil on linen, alla prima, impasto, glazing technique, watercolor on cold-press paper, tempera, encaustic
- 3D and render terms: octane render, cinema 4D, clay render, subsurface scattering, physically based rendering, low-poly, voxel
- Mixing more than two medium references (e.g., "oil painting, watercolor, 3D render, photography") causes Midjourney to average the styles into incoherence
- Instead of naming artists (copyright concerns, inconsistent results), describe their defining visual characteristics -- see Edge Cases for the full technique

**Layer 4 -- Lighting**
- Lighting is the single most underspecified component in amateur prompts and the most impactful for perceived quality.
- Natural lighting vocabulary: golden hour (warm, raking, long shadows), blue hour (cool, diffused, twilight), Rayleigh scattering (atmospheric haze), dappled light (through leaves, lattices), caustics (light through water/glass)
- Studio lighting vocabulary: Rembrandt (triangle of light on cheek, 3/4 angle), butterfly/Paramount (shadow under nose, beauty lighting), split lighting (50/50 light-dark face divide), rim lighting (backlit edge glow), clamshell (softbox above and below, fashion)
- Cinematic lighting vocabulary: chiaroscuro (extreme dark-light contrast, Caravaggio/film noir), volumetric rays (god rays through fog/dust), motivated lighting (light has a plausible in-scene source)
- For photorealistic results, always specify both the light quality (hard, soft, diffused) and the light color temperature (warm 3200K, neutral 5600K, cool 7000K daylight)

**Layer 5 -- Color, Tone, and Mood**
- Color palettes: earth tones (burnt sienna, raw umber, ochre, sage), Nordic palette (muted slate, birch white, moss green, iron grey), cyberpunk (neon magenta, electric cyan, deep black), film noir (desaturated, high contrast, amber pools of light)
- Emulsion references for film photography aesthetics: Kodak Portra 400 (warm skin tones, fine grain, slight green shadows), Kodak Ektar 100 (saturated, punchy, ideal for landscapes), Fuji Velvia 50 (hyper-saturated, rich greens and reds, slide film contrast), Cinestill 800T (tungsten-balanced, halation glow around highlights, urban night scenes), Ilford HP5 (classic black and white, fine grain, wide exposure latitude)
- Color grading references: teal-and-orange (Hollywood blockbuster look), bleach bypass (desaturated, high contrast, gritty), cross-processed (oversaturated, unexpected color shifts)

---

### Step 3: Select the correct Midjourney model version

The version parameter is not cosmetic -- it determines which underlying model generates the image.

| Version | Best For | Key Characteristics | When to Use |
|---------|----------|---------------------|-------------|
| `--v 6.1` | Production work, reliable photorealism, commercial assets | Stronger text rendering, better hand anatomy, predictable composition, excellent prompt adherence | Default for most professional use cases |
| `--v 7` | Experimental work, creative exploration, cutting-edge aesthetics | More abstract interpretation, stronger stylization capacity, different anatomy biases, evolving/unstable | When user specifically requests latest, or when v6.1 isn't achieving the desired stylization |
| `--niji 6` | Anime, manga, illustration, 2D character art | Trained on anime/illustration data, superior 2D character rendering, distinct aesthetic vocabulary | Any anime/manga/illustration-first request |

Default to `--v 6.1` unless the user explicitly requests otherwise or the use case clearly benefits from v7's capabilities.

---

### Step 4: Set parameters with intentional values

Do not use default parameters blindly. Every parameter choice should reflect the specific creative goal.

**Aspect Ratio (`--ar`)** -- Set this based on the intended use case:
- `--ar 1:1` -- Social media profile, icon, square format
- `--ar 4:5` -- Instagram portrait post (most common mobile social format)
- `--ar 2:3` -- Portrait photography, book cover, magazine cover, phone wallpaper (approximation)
- `--ar 9:16` -- Phone wallpaper, TikTok/Reels/Stories, vertical video frame
- `--ar 3:2` -- Landscape photography, print photography standard
- `--ar 16:9` -- Desktop wallpaper, YouTube thumbnail, presentation slide, cinematic frame
- `--ar 21:9` -- Ultra-wide cinematic scope, panoramic landscape
- Always infer aspect ratio from stated use case rather than asking the user if the use case makes it obvious

**Stylize (`--s`)** -- Controls how aggressively Midjourney imposes its aesthetic training:
- `--s 0` to `--s 50`: Literal, minimal aesthetic interpretation. Use for product shots, technical illustrations, or when precise prompt adherence matters more than beauty
- `--s 100`: Default value. Balanced between literal and stylized
- `--s 200` to `--s 400`: Midjourney actively improves aesthetics, composition, and visual appeal. Use for most creative work
- `--s 500` to `--s 750`: Strong aesthetic enhancement. Midjourney adds significant artistic interpretation. Best for fine art, concept art, editorial
- `--s 1000` (maximum): Maximum stylization. Midjourney takes significant creative liberties. Best for purely artistic work where aesthetics matter more than prompt fidelity

**Chaos (`--chaos`)** -- Controls variety between the four image grid results:
- `--chaos 0`: Four very similar images. Use when the prompt is working and you want tight variations for selection
- `--chaos 10` to `--chaos 30`: Slight variation in composition and detail. Good for production work where you want options but need consistency
- `--chaos 50` to `--chaos 70`: Significant compositional variety. Use early in creative exploration to find unexpected angles
- `--chaos 80` to `--chaos 100`: Wildly different results each run. Use only for pure exploration or when the goal is creative surprise

**Quality (`--q`)** -- Controls rendering computation time, not image resolution:
- `--q 0.25`: Fast draft. 4x faster, noticeably less detail. Use only for rapid iteration and concept testing
- `--q 0.5`: Balanced speed and detail. Good for iterating on composition
- `--q 1`: Standard quality. Default. Use for all final outputs
- Note: `--q 2` was deprecated in v6+. Higher quality is now achieved through upscaling, not the --q parameter

**Weird (`--weird` or `--w`)** -- Adds unconventional, surrealist, or unexpected aesthetics:
- `--weird 0` to `--weird 250`: Subtle strangeness. Objects or compositions feel slightly uncanny
- `--weird 500` to `--weird 1000`: Noticeable surrealism. Biological-mechanical hybrids, impossible geometries, dreamlike distortions
- `--weird 1500` to `--weird 3000`: Maximum surrealism. Dali-adjacent. Use intentionally for surrealist art, horror, psychedelic work
- Pairs well with high `--s` values. Does not work well with `--style raw`

**Seed (`--seed [integer]`)** -- Controls the random noise starting point:
- Same seed + same prompt + same parameters = nearly identical output
- Use to reproduce a specific result or make minimal modifications to a known good image
- Seed values range from 0 to 4294967295
- Seed does NOT guarantee identical outputs across model versions -- changing `--v` with same seed produces different images
- Find a seed by reacting to a Midjourney job with the ✉️ emoji envelope to get the job details

**Style Raw (`--style raw`)** -- Disables Midjourney's automatic aesthetic enhancement:
- Use for: photorealistic portraits, product photography, architectural visualization, scientific illustration, any use case where accuracy matters more than beauty
- Do NOT use for: painterly art, stylized illustration, anything where aesthetic polish is the goal
- Can combine with specific `--s` values: `--style raw --s 150` gives some aesthetic polish while reducing MJ's tendency to over-stylize

**Tile (`--tile`)** -- Creates seamlessly repeating textures:
- Works best with non-directional subjects: geometric patterns, botanical repeats, abstract shapes, textures (stone, fabric, wood grain)
- Always use `--ar 1:1` with `--tile` for easiest testing
- Avoid: faces, buildings, logos, any element with clear up/down orientation
- Test the tile seam by placing two images side by side before delivering the final result

---

### Step 5: Craft negative prompts with surgical precision

The `--no` parameter is widely misused. Apply these principles:

- Use `--no` only to exclude elements that Midjourney would plausibly add based on the prompt context. If your prompt describes a forest at night, `--no people` is justified. If your prompt describes an isolated rock formation, adding `--no people` wastes token weight on a non-issue.
- Keep negative prompts to 5 terms maximum. Beyond 5, negative terms begin competing with positive terms for attention and can degrade overall output quality.
- Common legitimate uses:
  - `--no text, watermark, signature, logo` -- Clean images without artifacts
  - `--no blur, noise, grain, chromatic aberration` -- For crisp digital outputs
  - `--no cartoon, illustration, painting, anime` -- Reinforcing photorealism requests
  - `--no extra limbs, deformed hands, disfigured fingers` -- Reducing anatomy artifacts (v6.1 has improved significantly, but still useful for close-up portraits)
  - `--no people, figures, humans` -- Empty environments
  - `--no modern elements, contemporary objects, anachronisms` -- Historical or fantasy scenes

---

### Step 6: Assemble the prompt in canonical order

Midjourney prompt word order follows a specific influence hierarchy. Tokens appearing earlier in the prompt receive more weight:

```
[PRIMARY SUBJECT + KEY ATTRIBUTES], [SECONDARY SUBJECT OR ENVIRONMENT], 
[TIME/WEATHER/ATMOSPHERE], [MEDIUM AND STYLE], [LIGHTING], [COLOR PALETTE], 
[COMPOSITION AND FRAMING], [MOOD/EMOTIONAL QUALITY] 
--v [version] --ar [ratio] --s [value] --q [value] --chaos [value] 
--style raw (if photorealistic) --seed [integer] (if reproducing) --no [exclusions]
```

Commas separate descriptive clauses. Do not use colons, semicolons, or bullet points inside the prompt body. Do not write prose sentences -- Midjourney performs better with comma-separated descriptor clusters than with grammatically complete sentences.

Target 40-70 words for the descriptive body. Under 25 words is underspecified and relies too heavily on Midjourney's defaults. Over 90 words causes the model to average or ignore later descriptors.

---

### Step 7: Deliver the prompt with rationale and provide variations

Every prompt delivery must include:
1. The ready-to-copy prompt string (the user should be able to paste it directly into Midjourney without modification)
2. A parameter breakdown explaining why each parameter value was chosen
3. A brief rationale connecting the prompt choices to the user's stated goal
4. At minimum 2 variation suggestions -- one that intensifies the core vision, one that explores an alternative interpretation

When the user has a broken prompt, additionally provide a **failure analysis** identifying which layer was causing the problem (wrong medium, wrong lighting, wrong parameter) before presenting the corrected version.

---

## Output Format

```
## Midjourney Prompt

### Ready-to-Use Prompt
/imagine [subject with key attributes], [environment/setting], [time/atmosphere], [medium and style], [lighting description], [color palette], [composition and framing], [mood qualifier] --v [version] --ar [ratio] --s [value] --q 1 --no [exclusions]

---

### Parameter Breakdown
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| --v | [6.1 / 7 / niji 6] | [specific reason: stability, stylization capacity, anime output] |
| --ar | [ratio] | [use case: desktop wallpaper, Instagram post, book cover, etc.] |
| --s | [0--1000] | [where on literal-to-artistic spectrum this sits and why] |
| --chaos | [0--100] | [desired variation level and why] |
| --q | [0.25 / 0.5 / 1] | [speed vs. detail trade-off for this use case] |
| --style raw | [present/absent] | [why realism suppression is or isn't needed] |
| --weird | [0--3000, if used] | [why unconventional aesthetics serve this request] |
| --seed | [integer, if used] | [why reproducibility matters here] |
| --no | [terms] | [specific elements excluded and why they'd appear otherwise] |

---

### Prompt Construction Notes
- **Subject choice:** [why these specific subject descriptors were chosen]
- **Medium/style:** [why this visual approach serves the goal]
- **Lighting:** [specific lighting setup and its effect on mood and realism]
- **Color approach:** [palette rationale, film stock reference if applicable]
- **Composition:** [framing and angle choices]
- **Expected output:** [concrete description of what the image should look like]

---

### Variations

**Variation 1 -- [Descriptive Label]:**
/imagine [full alternative prompt] --[parameters]
*What changes and why: [specific adjustment and intended effect]*

**Variation 2 -- [Descriptive Label]:**
/imagine [full alternative prompt] --[parameters]
*What changes and why: [specific adjustment and intended effect]*

**Variation 3 -- [Descriptive Label, optional]:**
/imagine [full alternative prompt] --[parameters]
*What changes and why: [specific adjustment and intended effect]*
```

---

## Rules

1. **Subject must always appear first.** Midjourney's attention mechanism weights earlier tokens more heavily. A misplaced subject (buried after style descriptors) is the single most common cause of prompts generating the right aesthetic but the wrong subject. Never begin a prompt with a style term, camera type, or mood word.

2. **Parameters must appear after all descriptive text, separated by space-double-dash.** Mixing parameters into the descriptive body (e.g., "a portrait with --ar 1:1 and dark lighting") does not work -- Midjourney only parses parameters in the final parameter block. All `--` flags belong at the end.

3. **Never specify more than one primary medium.** Choosing "oil painting" is correct. Choosing "oil painting, watercolor, colored pencil, digital art" causes the model to produce an aesthetically incoherent blend. Pick one primary medium and use style adjectives to refine it (e.g., "loose oil painting with thin glazing layers, painterly edges").

4. **Always specify `--v 6.1` or `--v 7` explicitly.** Do not rely on Midjourney's default version. Defaults change with platform updates, and omitting the version parameter makes prompts non-reproducible. Default to `--v 6.1` unless the user requests v7 specifically.

5. **`--style raw` and high `--s` values are mutually counterproductive.** `--style raw` reduces aesthetic processing; high `--s` increases it. Using both produces inconsistent results. Choose one direction: photorealism (`--style raw --s 50` or lower) or artistic stylization (`--s 400+` without `--style raw`).

6. **Do not recommend artist names in prompts.** Midjourney's training on copyrighted artist work produces inconsistent results, and naming living artists raises ethical concerns. Instead, decompose the artist's visual style into its constituent technical characteristics: brushwork type, color relationships, compositional tendencies, lighting preferences, and surface texture. This produces more consistent and defensible results.

7. **`--no` terms must be contextually relevant.** Do not add a generic kitchen-sink negative prompt (`--no ugly, bad, deformed, poor quality, blurry, extra limbs, text, watermark`) to every prompt. This wastes token weight, can suppress desirable elements that happen to share semantic space with the negative terms, and signals a lack of intentionality. Add only exclusions that are specifically motivated by the prompt content.

8. **Prompt word count must stay between 30 and 80 words in the descriptive body.** Under 30 words forces Midjourney to make too many unconstrained creative decisions. Over 80 words causes the model to average or ignore later descriptors as token attention becomes diluted. If a concept requires more precision, use `--seed` to iterate from a working base rather than expanding prompt length indefinitely.

9. **Always include at minimum two variation suggestions.** A single prompt delivered without alternatives leaves the user with no path forward if the first output misses the mark. Variations should not be minor tweaks (changing one adjective) -- they should represent meaningfully different creative interpretations: a different medium, a different lighting approach, a different compositional strategy.

10. **For photorealistic portraits, always add lens and focal length references.** Midjourney responds strongly to photography technical vocabulary: "shot on Canon 5D Mark IV, 85mm f/1.4, shallow depth of field, subject in sharp focus, bokeh background" produces measurably more realistic portrait rendering than purely stylistic descriptions. Include sensor size references for additional realism: "medium format film, Hasselblad, square format" triggers different rendering characteristics than 35mm references.

11. **Chaos and seed are inversely useful.** A high `--chaos` value (50+) makes `--seed` nearly meaningless because the variation space is so wide. Use high chaos for exploration (no seed), low chaos for refinement (with seed from a good result). Never use both `--chaos 50+` and `--seed` together -- they work against each other.

12. **When fixing a broken prompt, diagnose the layer before rewriting.** Identify whether the failure is in subject specification, medium/style choice, lighting, parameter values, or prompt length/order. Rewriting the entire prompt when only one layer is broken wastes effort and can destabilize what was already working.

---

## Edge Cases

### Photorealistic Human Portrait
Photorealism for human subjects requires specific technical vocabulary that signals "photography" to the model rather than "illustration."

- Use: `--v 6.1 --style raw --s 50 --q 1`
- Always include: lens focal length (85mm f/1.4 for portraits, 50mm f/2 for environmental, 35mm f/1.8 for street), camera body reference (Canon 5D, Sony A7R, Hasselblad for medium format), film stock or sensor reference
- Always include: specific named lighting setup (Rembrandt lighting, butterfly lighting with reflector, single softbox at 45 degrees)
- Add: skin texture descriptors ("natural skin texture, visible pores, subsurface scattering") to prevent the plastic-skin effect common in AI portraits
- Hands: v6.1 has improved hand rendering significantly, but close-up shots of hands still benefit from `--no extra fingers, fused fingers, distorted hands`
- For group shots (3+ people), use `--chaos 0 --s 50 --style raw` for maximum consistency -- group compositions are inherently harder

### Seamless Repeating Pattern or Texture
The `--tile` parameter requires a specific prompting approach:

- Always use `--ar 1:1` for initial generation -- non-square tiles can work but are harder to verify
- Subject must be non-directional: botanical repeats (ferns, flowers, leaves), geometric shapes, abstract organic forms, textile patterns. Faces, buildings, and text tile catastrophically
- Add "flat lay, top down, even lighting, minimal shadows, isolated on white/black/neutral background" to ensure the tile edge blends cleanly
- After generating, verify the tile by placing four copies in a 2x2 grid -- seam artifacts are only visible at the edges
- For color-accurate fabric/textile simulation, describe the weave structure: "twill weave texture, warp and weft visible, linen fabric" will produce different results than "smooth surface"
- Tile does NOT work with `--weird` -- the weird parameter introduces asymmetries that break tile seams

### Emulating a Specific Art Historical Style Without Naming Artists
Use the following decomposition technique:

1. Identify the period/movement (Japanese ukiyo-e, Dutch Golden Age, Abstract Expressionism, Bauhaus, Memphis Design)
2. Describe the compositional logic (flat planes vs. deep perspective, centered vs. dynamic diagonal)
3. Name the color approach (limited earth tone palette, pure unmixed primaries, high chroma complementary pairs)
4. Specify the mark-making or surface technique (woodblock carving lines, thick impasto, geometric hard-edge, organic biomorphic)
5. Add the medium and support (woodblock print on washi paper, oil on oak panel, acrylic on raw canvas, silk screen on poster stock)

Example decomposition for "ukiyo-e woodblock style": "Japanese woodblock print aesthetic, flat color planes with bold outlines, limited palette of indigo, vermilion, black and ivory, asymmetric composition with strong negative space, stylized wave patterns, fine line detail in hair and fabric folds, printed on cream textured washi paper --v 6.1 --s 600 --style raw"

### Generating Ad-Ready Commercial Assets
Midjourney cannot precisely position text or follow brand guidelines directly, but it can generate near-production-ready image assets:

- Use `--no text, typography, words, letters, captions` to generate clean images for external text overlay
- For ads requiring specific negative space (for headline placement), describe it explicitly: "subject positioned on far right third of frame, large empty dark background on left two-thirds, suitable for text overlay"
- Use `--ar 4:5` for Instagram feed, `--ar 9:16` for Stories/Reels, `--ar 16:9` for YouTube/display
- Always use `--q 1 --v 6.1 --style raw` for commercial product photography -- artistic processing is rarely appropriate for client deliverables
- For product-on-surface shots: "product centered on matte white marble surface, studio lighting, soft shadows, clean white background, commercial photography, top-down flat lay" or "three-quarter angle" depending on product type
- Generate at least 4 variations (run once with `--chaos 10`) and use Midjourney's upscale function before treating any output as final

### Multiple Distinct Subjects in One Frame
Midjourney handles multiple subjects inconsistently, particularly when they need to maintain distinct identities:

- The dominant subject must appear first and receive the most descriptive weight
- Use explicit spatial language: "in the foreground," "on the left," "towering in the background," "centered in the frame," "reflected in the water below"
- Two subjects: generally manageable with careful spatial descriptors
- Three or more distinct subjects: results become unpredictable. Consider generating subjects separately and compositing, or using very clear spatial anchors (e.g., "a triptych composition with three equal panels, left panel: [X], center panel: [Y], right panel: [Z]")
- For subjects with strong visual contrast (e.g., a tiny mouse and a massive whale), add scale reference: "a humpback whale breaching at sunset, a small wooden rowboat dwarfed beneath it, scale contrast, dynamic composition"
- Avoid pronoun-based relationships ("she looks at him") -- use positional and action descriptors instead ("woman facing left, extending hand toward man on right")

### Fixing Specific Common Output Failures
These are the most frequent failure modes and their targeted fixes:

- **Output is too painterly/illustrated when photorealism was requested:** Add `--style raw`, reduce `--s` to 50 or lower, add camera/lens reference, and add `--no painting, illustration, digital art, cartoon`
- **Output ignores the specified style and defaults to generic Midjourney aesthetic:** The style description is likely buried too late in the prompt. Move medium and style descriptors immediately after the subject, before environment and lighting
- **Output has wrong aspect but right content:** Aspect ratio was either missing or the wrong value. Add or correct `--ar`
- **All four grid images look nearly identical:** Increase `--chaos` to 30-50 to introduce more variety
- **Output is too dark or too low contrast:** Add explicit lighting descriptors (well-lit, bright ambient light, high key lighting) and check that no negative terms like "dark" appear unintentionally
- **Human subject has wrong ethnicity or age:** These attributes must be stated explicitly in the subject description. Midjourney defaults to statistically common training distribution. Specify: "elderly Igbo woman," "teenage Korean boy," "middle-aged Polynesian man" for intentional demographic representation

### Generating in `--niji 6` (Anime and Illustration Mode)
Niji is a separate model with its own conventions:

- Use `--niji 6` instead of `--v 6.1` -- these are different models
- Niji-specific style modifiers: `--style cute` (soft, rounded, kawaii), `--style expressive` (dynamic, dramatic anime action), `--style scenic` (painterly backgrounds, Studio Ghibli aesthetic), `--style original` (earlier niji model behavior)
- Niji responds better to anime-specific lighting vocabulary: "god rays piercing forest canopy, sakura petals falling, lens flare, soft rim light"
- For character sheets (character from multiple angles): "character sheet, front view, side view, back view, three-quarter view, white background, turnaround sheet" -- niji handles this better than standard models
- Western illustration (not specifically anime) usually performs better in `--v 6.1` with appropriate style descriptors than in niji -- use niji specifically for Japanese animation aesthetic outputs

---

## Example

**User input:** "I need a Midjourney prompt for a high-end whiskey brand campaign -- a glass of whiskey on a dark wooden bar top, moody atmosphere, feels expensive and cinematic. For a 4:5 Instagram ad."

---

## Midjourney Prompt

### Ready-to-Use Prompt
/imagine a crystal whiskey glass filled with amber Scotch, resting on a dark reclaimed oak bar top, condensation on the glass, deep moody atmosphere, a single source of warm candlelight reflecting through the liquid, volumetric light rays in smoky air, commercial product photography, studio lighting with motivated candlelight, rich chestnut and amber color palette, Kodak Ektar 100 film aesthetic, shallow depth of field with foreground bokeh, three-quarter close-up angle, luxurious and cinematic mood --v 6.1 --ar 4:5 --s 150 --q 1 --style raw --no text, watermark, logo, cartoon, illustration, blurry background

---

### Parameter Breakdown
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| --v | 6.1 | Stable production model with excellent photorealism and strong product photography rendering |
| --ar | 4:5 | Standard Instagram feed portrait format -- specified by the user's use case |
| --s | 150 | Slightly above default to add visual polish and richness without compromising product accuracy |
| --q | 1 | Full quality required for commercial deliverable -- no shortcuts on rendering |
| --style raw | present | Suppresses Midjourney's tendency to over-stylize; keeps the image in the domain of commercial photography rather than art |
| --no | text, watermark, logo, cartoon, illustration, blurry background | Prevents superimposed graphics, ensures clean photographic output, removes non-photographic rendering artifacts |

---

### Prompt Construction Notes
- **Subject choice:** "Crystal whiskey glass filled with amber Scotch" establishes the product first with material specificity (crystal, not generic glass) and content (amber Scotch, not generic whiskey). "Resting on a dark reclaimed oak bar top" grounds it with tactile surface detail.
- **Atmosphere:** "Condensation on the glass" adds realism and tactility. "Smoky air" creates depth and motivates the volumetric light effect without implying poor environment -- it reads as a premium bar atmosphere.
- **Medium/style:** "Commercial product photography" is the critical framing signal -- it tells Midjourney this should look like a $50,000 ad shoot, not a lifestyle snapshot. This is placed early (after subject and environment but before lighting specifics) for maximum influence.
- **Lighting:** "Single source of warm candlelight reflecting through the liquid" does two things: it creates the motivated light source that makes luxury product shots feel authentic, and it produces caustic light patterns through the amber liquid that are visually distinctive. "Volumetric light rays in smoky air" adds atmosphere and the cinematic quality the user requested.
- **Color approach:** "Rich chestnut and amber color palette" reinforces the whiskey's own color as the dominant hue. "Kodak Ektar 100 film aesthetic" pushes saturation and contrast in a way that feels photographic rather than digitally processed.
- **Composition:** "Three-quarter close-up angle" is the standard for premium spirits advertising -- it shows the glass shape, the liquid depth, the surface it rests on, and creates foreground visual interest. "Shallow depth of field with foreground bokeh" is characteristic of the genre.
- **Expected output:** A dark, moody, richly lit close-up of a whiskey glass with warm amber tones glowing through the liquid, cinematic atmosphere, no distracting elements, ready for Instagram headline overlay.

---

### Variations

**Variation 1 -- Elevated Minimalism (less atmosphere, stronger product focus):**
/imagine a single crystal whiskey glass on polished black marble, dark studio background, single overhead spotlight creating dramatic top-down key light with hard specular reflections, amber liquid glowing with internal light, commercial product photography, high contrast, muted dark color palette with warm amber accent, overhead angle, luxury brand aesthetic, minimal and clean --v 6.1 --ar 4:5 --s 100 --q 1 --style raw --no text, watermark, reflections of studio equipment, props
*What changes and why: Removes the moody atmosphere in favor of pure graphic product clarity. The overhead spotlight and marble surface push toward Scandinavian-influenced luxury minimalism. Better choice if the brand aesthetic is modern/minimal rather than heritage/moody.*

**Variation 2 -- Heritage and Storytelling (stronger narrative, hand in frame):**
/imagine a weathered hand wrapping around a crystal whiskey glass, dark wooden bar top worn with age, warm amber whiskey catching fireplace light in the background, shallow depth of field with the hand in sharp focus, cinematic photography, Cinestill 800T film stock, warm tungsten color grading, deep shadows with amber highlights, cozy but sophisticated atmosphere, environmental portrait style, medium format camera aesthetic --v 6.1 --ar 4:5 --s 200 --q 1 --style raw --no text, watermark, extra hands, modern elements
*What changes and why: Introducing a hand adds human narrative and scale -- common in high-end spirits advertising to suggest the drinker's experience. Cinestill 800T shifts from Ektar's saturation to tungsten-balanced film with distinctive halation glow around highlights, producing a warmer, more intimate quality. The fireplace background adds depth without dominating. Note: hands can still produce artifacts in v6.1 -- check the output carefully and run variations if needed.*

**Variation 3 -- Cinematic Scene (pull back for full environment, editorial feel):**
/imagine a whiskey glass and a leather-bound book on a dark mahogany writing desk, amber desk lamp casting a warm pool of light, rain streaking down tall windows behind, old library bookshelves in soft focus background, rich cinematic atmosphere, commercial lifestyle photography, warm amber and deep shadow palette, Dutch Golden Age lighting influence, Rembrandt light quality, three-quarter medium shot, sophisticated and contemplative mood --v 6.1 --ar 4:5 --s 300 --q 1 --style raw --no text, watermark, modern objects, television, smartphone
*What changes and why: Pulls back from pure product focus to environmental storytelling. The rain, library, and writing desk create a specific lifestyle narrative (intellectual, solitary, contemplative luxury) that works for heritage Scotch brands. Higher --s 300 is appropriate because the expanded scene benefits from aesthetic enhancement. The "Dutch Golden Age lighting influence" and "Rembrandt light quality" produce the dramatic chiaroscuro that makes expensive editorial photography look timeless.*
