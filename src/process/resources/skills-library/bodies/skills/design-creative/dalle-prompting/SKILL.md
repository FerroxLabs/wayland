---
name: dalle-prompting
description: |
  Crafts DALL-E 3 and GPT-image-1 prompts using natural language style specification, quality descriptors, composition instructions, and revision dialogue patterns for iterative generation.
  Use when the user asks to create an image with DALL-E, GPT-image-1, ChatGPT image generation, or OpenAI image generation.
  Do NOT use for Midjourney prompting (use midjourney-prompting), Stable Diffusion prompting (use stable-diffusion-prompting), or translating prompts between models (use prompt-translation).
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
# DALL-E Prompting

## When to Use

**Use this skill when:**
- User explicitly asks to generate, create, or design an image using DALL-E 3, GPT-image-1, ChatGPT image generation, or any OpenAI image generation model
- User wants help writing, improving, or debugging a DALL-E prompt that is not producing the desired output
- User needs to iterate on an existing DALL-E result through revision dialogue -- they have a first image and want to refine it
- User asks for a prompt that will work specifically with OpenAI's ecosystem (e.g., "make a prompt for the ChatGPT image button" or "write this for the Images API")
- User wants to generate text reliably inside an image and is using OpenAI models
- User needs a sequence of related images with consistent visual elements using DALL-E
- User is building an application that calls the OpenAI Images API and needs prompt engineering guidance for programmatic generation

**Do NOT use when:**
- User wants Midjourney prompts with `--ar`, `--v`, `--cref`, `--sref`, or `--style` parameter syntax (use `midjourney-prompting`)
- User wants Stable Diffusion prompts with CFG scale, sampler selection, negative prompt weight syntax, or LoRA triggers (use `stable-diffusion-prompting`)
- User wants to convert or adapt an existing prompt from Midjourney or Stable Diffusion syntax to DALL-E natural language (use `prompt-translation`)
- User wants to maintain a character or face across a Midjourney series using `--cref` (use `midjourney-consistency`)
- User is asking about image editing, inpainting, or outpainting workflows within DALL-E specifically for the edit endpoint (use `dalle-editing` if available)
- User wants to generate video, audio, or animated content -- OpenAI image models produce static images only

---

## Process

### Step 1: Identify the Model and Understand Its Behavior

Before writing a single word of prompt, determine which model is in use or which to recommend. The behavioral differences are fundamental and change how the entire prompt is written.

- **DALL-E 3** is accessed via ChatGPT's image button, the Images API with `model: "dall-e-3"`, and third-party integrations. It internally rewrites ("revises") your submitted prompt before generation. This means subtle, figurative, or poetic language sometimes works well -- the model interprets intent. However, literal instruction-following is unreliable. DALL-E 3 tends to add compositional elements, background details, and artistic embellishments that were not requested.
- **GPT-image-1** is the newer model accessed via the Images API with `model: "gpt-image-1"` or the ChatGPT canvas/image generation UI in newer deployments. It follows prompts more literally, handles multi-element compositions better, renders text inside images with significantly higher reliability, and responds well to layout and spatial instructions. It does not perform internal prompt rewriting to the same degree.
- To choose between them: if text-in-image is critical, if precise layout matters, or if the user needs literal interpretation -- recommend GPT-image-1. If the user wants stylized artistic output and is comfortable with interpretive variation -- DALL-E 3 is acceptable.
- Note the API size parameters that each model supports. DALL-E 3 supports: `1024x1024`, `1792x1024`, `1024x1792`. GPT-image-1 supports: `1024x1024`, `1536x1024`, `1024x1536`, and `auto`. The landscape and portrait proportions differ slightly between models.
- The quality parameter matters: DALL-E 3 accepts `standard` or `hd`. GPT-image-1 uses `low`, `medium`, `high`. For a polished output, always recommend `hd` (DALL-E 3) or `high` (GPT-image-1).

### Step 2: Gather Requirements with Targeted Questions

Do not write a prompt without understanding these six dimensions. If the user's request is thin (e.g., "make an image of a mountain"), ask the targeted questions below rather than guessing. If the request is detailed, extract these from what the user has provided.

- **Subject:** What is the primary visual element? Include relevant attributes -- size, color, age range, material, state of action. A "dog" is underspecified; "a golden retriever puppy mid-leap, ears flying, wet fur" is not.
- **Setting:** Where does the scene take place? Interior or exterior, time of day, weather, environmental details, era or period. Setting dramatically affects the background, lighting, and palette.
- **Style:** This is the single most important dimension for controlling output. Know the full taxonomy: photorealistic, cinematic photography, editorial photography, oil painting, watercolor, gouache, digital illustration, vector illustration, pixel art, isometric, 3D render (Blender-style, Octane, Unreal Engine), concept art, comic book, manga, ukiyo-e, Art Nouveau, Bauhaus, children's book, flat design, low-poly.
- **Mood and tone:** The emotional register. Serene, dramatic, melancholic, playful, tense, ethereal, industrial, nostalgic. Mood informs color temperature, contrast, and composition choices.
- **Composition and framing:** Close-up (face fill), medium shot (waist up), full body, wide establishing shot, aerial/overhead, worm's-eye view, Dutch angle, symmetrical, rule-of-thirds, centered subject, negative space on left/right.
- **Purpose and output context:** Social media post (square, high saturation), blog header (landscape, clean central subject), print (high detail, no compression artifacts), presentation slide (simple, legible, minimal clutter), product mock-up (clean background, neutral lighting), game asset (specific viewing angle, clean silhouette).

### Step 3: Structure the Prompt Using the DALL-E Sentence Architecture

DALL-E and GPT-image-1 parse natural language -- they are not tag engines. Prompts are structured prose, not keyword lists. Follow this architecture precisely:

- **Clause 1 -- Subject anchor:** Open with a concrete noun phrase describing the primary subject. Include its most important visual attributes immediately. "A weathered lighthouse" not just "a lighthouse." This clause receives the most generative weight.
- **Clause 2 -- Action or state:** What is the subject doing or what condition is it in? "stands at the edge of rocky cliffs during a violent thunderstorm" -- this clause drives energy, dynamism, and narrative.
- **Clause 3 -- Setting and environment:** Expand the world around the subject. Include spatial context, secondary elements, atmospheric conditions. "The sea churns far below, whitecapped waves visible through the rain, a crack of lightning illuminates the dark sky."
- **Clause 4 -- Style declaration:** State the artistic style explicitly and early enough to govern the rendering of everything above. "Rendered as a dramatic cinematic photograph, taken with a wide-angle lens at 24mm, ISO 800, f/8, long exposure." Or: "Illustrated in the style of a classic mid-century travel poster, flat bold colors, limited palette, strong geometric shapes."
- **Clause 5 -- Quality and technical descriptors:** Close with rendering quality cues. These influence sharpness, detail density, and post-processing aesthetics. Examples: "sharp focus throughout, high dynamic range, dramatic chiaroscuro lighting, ultra-detailed, award-winning nature photography quality." For illustration: "clean linework, professional print quality, no JPEG artifacts."
- **Exclusions (natural language):** If there are things to avoid, state them conversationally at the end: "with no text, logos, watermarks, or copyright symbols." Do not use `--no` syntax. Keep exclusions to 1-2 items; too many negative instructions can confuse the model.
- **Optimal prompt length:** 80-180 words is the productive window. Below 50 words produces generic output with default compositional choices. Above 250 words risks the model deprioritizing later clauses or creating internally inconsistent outputs. GPT-image-1 handles longer prompts more faithfully than DALL-E 3.

### Step 4: Apply Style-Specific Technical Language

Generic style labels produce generic results. Use technical vocabulary native to each medium:

- **Photorealistic photography prompts:** Always specify a camera system and lens. "Shot on a Hasselblad X2D 100C, 80mm medium format lens, f/2.8, daylight-balanced natural light" communicates far more than "photorealistic." Include lighting setup terminology: Rembrandt lighting, clamshell lighting, golden hour backlighting, overcast diffused light, neon-lit urban night, harsh midday sun. Specify depth of field: "shallow depth of field with creamy bokeh" vs. "deep focus, front-to-back sharpness."
- **Digital illustration prompts:** Reference specific aesthetics: "concept art in the style of a AAA video game cinematic, highly detailed environments, volumetric lighting, subsurface scattering on skin." Or: "clean vector illustration, geometric shapes, limited palette of 4-5 colors, Dribbble aesthetic, flat shadows." Reference art movements where applicable: "Art Nouveau with flowing organic lines, decorative borders, earthy jewel tones, influenced by Alphonse Mucha."
- **Painting prompts:** Name the medium and technique. "Impasto oil painting with thick, directional brushstrokes visible on the canvas surface, rich saturated colors, chiaroscuro shadows, Old Masters technique." Or: "loose impressionist watercolor, wet-on-wet technique, colors bleeding at edges, visible paper grain and white space preserved."
- **3D render prompts:** Specify the render engine aesthetic. "3D render in the style of a Pixar animated film, smooth subsurface scattering, soft ambient occlusion, warm studio three-point lighting, appealing stylized proportions." Or: "photorealistic 3D architectural visualization, Unreal Engine 5 real-time render quality, accurate material PBR shading, natural HDRI lighting."
- **Mixed and hybrid styles:** Describe the blend explicitly: "digital painting that combines the line economy of Japanese woodblock printing with the color palette of a Nordic pastel illustration -- clean outlines, flat washes of muted sage and dusty rose."

### Step 5: Handle Text-in-Image Requests

Text rendering is one of DALL-E 3/GPT-image-1's most requested and most problematic features. Apply these techniques:

- **Always use GPT-image-1 for text.** DALL-E 3 renders text unreliably -- letters may be garbled, misspelled, or partially correct. GPT-image-1 has substantially better text rendering.
- **Quote the exact text** within the prompt using quotation marks: `a coffee shop chalkboard menu that reads "ESPRESSO $3 / LATTE $4 / COLD BREW $5"`. The model reads the quoted string as a literal text instruction.
- **Limit text to 1-7 words per element** for highest reliability. Longer strings have higher error rates. If a design requires more text, break it into short elements with spatial separation: "a poster with the headline 'SUMMER SALE' in bold letters at the top and the subtext 'UP TO 50% OFF' below it in smaller text."
- **Specify typography:** "in bold condensed sans-serif," "in elegant serif italic," "in hand-lettered brush script," "in neon tube-light style." The more specific, the better the rendering aligns with design intent.
- **Specify placement:** "in the upper left corner," "centered at the bottom," "overlaid on the image in the lower third." Spatial instructions improve layout predictability.
- **Never assume spelling accuracy:** After generation, review all text in the output carefully. Even GPT-image-1 will occasionally swap letters or lose a character. Plan for a revision pass if text accuracy is critical.

### Step 6: Build a Structured Revision Strategy

DALL-E generation is iterative. A single prompt rarely achieves a perfect result. Design the revision workflow before the first generation:

- **Revision type 1 -- Composition adjustment:** Address framing, cropping, subject placement, negative space. "Same subject and style, but reframe to a close-up portrait with the face filling 80% of the frame."
- **Revision type 2 -- Lighting adjustment:** Lighting changes dramatically alter mood. "Keep everything the same but change the lighting to late afternoon golden hour, with long warm shadows cast to the left."
- **Revision type 3 -- Style/palette shift:** "Same composition and subject, but rendered as a vintage risograph print with grain, two-color duotone in teal and coral, slight ink misalignment effect."
- **Revision type 4 -- Detail addition:** "Add a small leather satchel bag hanging from the fox's shoulder and a pair of round tortoiseshell glasses perched on its nose."
- **Revision type 5 -- Simplification:** "Simplify the background to a flat gradient wash of warm amber, removing the forest detail entirely."
- Each revision prompt should anchor to the previous result by restating the unchanged elements explicitly. Do not say "same image" -- describe what stays the same in specific terms, because the model does not have persistent memory of previous generations in API mode.
- After 3-4 revisions without convergence on a target, recommend rewriting the base prompt from scratch rather than stacking corrections. Accumulated revision instructions create contradictory signals.

### Step 7: Apply Consistency Techniques for Series Generation

DALL-E has no native reference image mechanism for style or character locking (unlike Midjourney's `--sref`/`--cref`). Consistency across multiple images requires disciplined prompt engineering:

- **The consistency anchor block:** Write a fixed descriptive block that appears identically in every prompt in the series. It covers the shared elements: character description, style declaration, color palette, lighting setup. Copy-paste this block verbatim, and only change the scene-specific clauses.
- **Character description anchoring:** Describe recurring characters with consistent specific attributes in the same phrasing: "a young woman in her late 20s with short auburn hair, freckles, wearing a cream linen blazer" -- this exact phrase should appear in every prompt where she appears.
- **Style palette anchoring:** Name your palette explicitly and repeatedly: "illustrated in a limited palette of sage green, dusty rose, warm cream, and charcoal -- the consistent color language of the series."
- **Scene variation isolation:** Change only one variable per image in the series. If generating a series of seasonal landscapes, keep all descriptors constant except the seasonal elements. "Same meadow, same soft watercolor style, same color palette, but now depicted in deep winter -- snow covering the ground, bare deciduous trees, pale blue-gray sky."
- **Limitation acknowledgment:** Be transparent with users that DALL-E will produce variation between images even with identical style prompts. Face features, body proportions, and fine details will drift. For projects requiring strict visual consistency (book illustrations, branded characters), recommend supplementing with image editing tools or a human illustrator for final polish.

### Step 8: Compile and Deliver the Final Output

Assemble everything into the structured output format defined below. Always include: the recommended model with rationale, the size with rationale, the full prompt as a single copyable block, a breakdown of the prompt's components, a minimum 3-step revision strategy, and at least 2 variation suggestions.

---

## Output Format

```
## DALL-E Image Generation Prompt

### Generation Setup
| Parameter     | Value              | Rationale                                  |
|---------------|--------------------|--------------------------------------------|
| Model         | [DALL-E 3 / GPT-image-1] | [specific reason based on content type] |
| Size          | [dimensions]       | [why this aspect ratio serves the purpose] |
| Quality       | [hd / high]        | [standard vs. hd tradeoff note if relevant] |
| API style     | [natural/vivid -- DALL-E 3 only, or omit for GPT-image-1] | |

---

### Prompt
> [Full natural language prompt, 80-180 words, formatted as a single copyable paragraph]

---

### Prompt Architecture Breakdown

| Component         | Content                                           |
|-------------------|---------------------------------------------------|
| Subject anchor    | [what the primary subject is and its key attributes] |
| Action/state      | [what the subject is doing or its condition]      |
| Setting           | [environment, time of day, atmosphere]            |
| Style declaration | [artistic style with technical specifics]         |
| Quality cues      | [rendering descriptors, technical photography or art terms] |
| Exclusions        | [what was excluded and how it was phrased]        |

---

### Revision Strategy

**If [specific problem] occurs:**
- Revision prompt: "[Exact revision instruction, anchoring unchanged elements explicitly]"

**If [specific problem] occurs:**
- Revision prompt: "[Exact revision instruction]"

**If [specific problem] occurs:**
- Revision prompt: "[Exact revision instruction]"

**Nuclear option (full rewrite trigger):**
- [Describe the condition under which the user should abandon revisions and rewrite from scratch, and what to change]

---

### Variation Suggestions

**Variation 1 -- [Style/mood name]:**
> [Full alternate prompt, copyable]

**Variation 2 -- [Style/mood name]:**
> [Full alternate prompt, copyable]

---

### Consistency Notes (for series use)
[If the user is generating a series, include the anchor block here and explain what to change per image]
[If single image, write: "Not applicable -- single image generation."]
```

---

## Rules

1. **Always write in complete, grammatical English sentences.** DALL-E and GPT-image-1 are large language model-driven -- they parse prose, not comma-separated tags. Writing "fox, forest, autumn, watercolor, cozy" produces inferior results to the same information expressed as a coherent descriptive sentence. Never revert to Midjourney-style tag syntax.

2. **Specify the model (DALL-E 3 or GPT-image-1) for every output, with explicit rationale.** The behavioral differences are significant enough that recommending the wrong model will produce unsatisfying results. Default rule: text in image = GPT-image-1. Precise compositional layout = GPT-image-1. Stylized artistic interpretation = either is acceptable.

3. **Never include parameter syntax from other models.** No `--ar`, `--v`, `--q`, `--cfg`, `--seed`, `--no`, `--style`, or LoRA trigger words. These will either be ignored or, in rare cases, generate artifacts because the model may render the parameter text literally.

4. **State exclusions as natural language sentences, not negation lists.** "With no visible text, watermarks, or brand logos present in the image" is correct. A bulleted list of things to avoid is not -- the model processes it as one long instruction that deprioritizes the positive content.

5. **Keep prompts between 80-180 words.** Below 50 words: subject will be placed in a default context with generic lighting and style. Above 250 words: the model progressively discounts later clauses, and contradictions between clauses become more likely. If a prompt concept requires more detail, prioritize the subject anchor and style declaration -- trim setting and secondary elements first.

6. **For DALL-E 3 API calls, set the `style` parameter intentionally.** `vivid` produces hyper-saturated, dramatic, high-contrast images with cinematic tendencies. `natural` produces more muted, realistic, photographically neutral results. This parameter has a large effect and defaults to `vivid` -- users expecting natural photography should always set `natural` explicitly.

7. **DALL-E 3 rewrites your prompt internally -- account for this in user expectations.** If a user reports that "the image is not what I described," the first diagnostic is to retrieve the `revised_prompt` field from the API response. This field shows what DALL-E 3 actually used for generation. Use it to understand the drift and correct course. GPT-image-1 does not perform the same level of internal rewriting.

8. **Text-in-image requests must use quoted strings within the prompt.** Do not paraphrase what text should say -- quote it exactly. "A chalkboard with the word SPECIALS written at the top" is inferior to `a chalkboard with "SPECIALS" written at the top in chalk`. The quotation marks signal a literal string to render.

9. **Always provide a minimum of 3 revision prompts organized by problem type.** Vague revisions ("make it better") produce unpredictable results. Revision prompts must anchor unchanged elements explicitly and name exactly one variable to change.

10. **Do not claim consistency across generations is achievable by prompt alone.** Character faces, specific object details, and fine stylistic nuances will drift between generations even with identical prompts. Set realistic user expectations: prompt-based consistency is approximate, not exact. For precise consistency, the user needs image editing software, an image-to-image workflow, or a professional illustrator.

11. **Photography prompts must include a camera system and lens specification.** "Photorealistic" alone produces a generic midpoint between photography and digital painting. "Shot on a Sony A7R V, 135mm telephoto lens, f/2.0, soft window light from camera left" forces the model toward actual photographic rendering characteristics.

12. **Avoid generating prompts for named real individuals.** OpenAI's content policy restricts generating realistic images of specific real people. If the user requests this, redirect them to describe the person by physical attributes, age range, and styling rather than by name.

---

## Edge Cases

### 1. The User Receives a "Content Policy" Refusal
DALL-E and GPT-image-1 will refuse prompts involving violence, sexual content, depictions of real people in compromising situations, or certain sensitive themes. The refusal may happen silently (API returns an error) or with an explanation.
- First, identify the likely trigger: named individuals, violent imagery, nudity, hate symbols, or medical/legal content.
- Rephrase to remove the trigger without changing the creative intent. A "battle scene with injured soldiers" becomes "a dramatic wartime composition showing soldiers in a moment of tense action, cinematic, no graphic violence."
- For historical or journalistic contexts, describe the scene abstractly with emphasis on the emotional and compositional elements rather than explicit content.
- If the refusal persists, inform the user that certain content categories are outside the model's policy envelope and cannot be worked around through rephrasing.

### 2. Generating Consistent Characters Across a Series (Children's Book, Brand Character, etc.)
As noted in Step 7, DALL-E has no native reference system. The practical consistency ceiling with prompt engineering alone is about 70-80% visual similarity.
- Build a "character card" -- a detailed fixed-text description of the character that gets pasted verbatim into every prompt. This card should be 30-50 words and cover hair color/length/style, facial feature descriptors (without being too specific, which paradoxically causes more variation), clothing, and any signature accessories.
- Use style anchors that constrain variation: "flat vector illustration with a limited 5-color palette" constrains the output space more than "digital illustration."
- Accept that GPT-image-1 produces more consistent characters than DALL-E 3 due to better instruction following. For any serious character consistency project, recommend GPT-image-1 with the `high` quality setting.
- For professional publishing requirements, be direct: prompt-only consistency is insufficient. The illustrator workflow -- generating a strong reference image, then using outpainting/inpainting to create scenes -- produces better results.

### 3. Product Photography for E-Commerce
Product images have highly specific requirements: clean background, precise lighting that shows material and texture, correct perspective, no distortion of product shape.
- Use GPT-image-1 for all product photography prompts. Its literal instruction-following prevents unwanted compositional additions.
- Always describe the background explicitly: "on a seamless pure white studio background (#FFFFFF), no shadows or gradients." "Against a matte white sweep, with only a soft contact shadow directly beneath."
- Specify the lighting rig: "lit with a softbox from camera left, a fill reflector from camera right, and a hair light from above -- product photography studio lighting." This prevents the model from defaulting to dramatic cinematic lighting.
- Specify viewing angle precisely: "three-quarter view from slightly above eye level, roughly 20 degrees above horizontal, camera at product level." Avoid "front view" alone -- it is ambiguous about height.
- For products with text labels or logos: these will be generated based on the prompt description, not from actual artwork. They will almost always be wrong. Recommend that the user treat AI-generated product photography as a layout/concept proof, not a final deliverable.
- Prompt pattern: `[Exact product name and description, including color and material]. Professional product photography on a seamless white background. Soft studio lighting with a large softbox from camera left, fill light from camera right. [Specific viewing angle]. Shot on a Canon EOS R5, 100mm macro lens, f/8, ISO 100, no depth of field blur. No shadows, no reflections, no background elements. Clean, sharp, professional catalog photography quality.`

### 4. Images That Need to Work as Editable Layers (Design Workflow)
Users sometimes need images where subject and background are separable -- for use in Figma, Illustrator, or Photoshop.
- AI-generated images are always rasterized flat composites. There is no layer separation at generation time.
- Prompt for clean edge separation: "the subject against a solid flat background color" makes background removal significantly easier in Photoshop's Remove Background or Adobe Firefly.
- For full transparency-friendly output, recommend generating on a white or solid-color background and using Photoshop's Select Subject + Remove Background workflow post-generation.
- White backgrounds work for most subjects. However, white subjects on white backgrounds cannot be easily separated -- recommend a contrasting solid color instead: "against a flat solid medium blue background."
- GPT-image-1's `transparent` background option (where available in the API) can produce PNG with alpha channel output -- recommend this when the API access allows it.

### 5. Abstract, Conceptual, or Emotion-First Images
Some requests have no literal visual referent: "an image representing imposter syndrome" or "the feeling of a Sunday morning."
- DALL-E handles abstraction well when guided by visual metaphors rather than psychological labels. Never use the abstract concept name as the sole descriptor.
- Translation framework: What colors embody this concept? What textures or materials? What lighting quality? What shapes -- sharp and angular, or soft and rounded? What scale -- intimate or vast?
- "Imposter syndrome" might become: "a figure in formal business attire standing in a vast, too-large empty boardroom, their reflection in the polished table shows them in casual, worn clothing. Dramatic directional lighting, cold blue-gray tones, high-ceiling architecture creating an overwhelming sense of scale, cinematic composition."
- "A Sunday morning" might become: "soft morning light streaming through gauze curtains onto a rumpled unmade bed with a coffee cup on the nightstand, one book face-down, dust motes visible in the light beams, warm amber and cream palette, intimate and quiet, soft-focus photography, film grain."
- Build the abstraction out of five specific, concrete visual details. Then add the style and mood layer.

### 6. Multi-Panel or Collage Layouts
Users sometimes want a single image that contains multiple panels, a before/after split, or a grid of variations.
- GPT-image-1 handles layout instructions better than DALL-E 3. Use GPT-image-1 for any multi-panel request.
- Be explicit about the grid structure: "a 2x2 grid of four individual portrait photographs, each in its own panel separated by thin white borders, each showing the same woman in a different seasonal outfit."
- GPT-image-1 will attempt to render this but the internal panel boundaries and sizing will vary. This is an inherent limitation -- the model is generating a flat image, not compositing panels.
- For precise grid layouts, recommend that the user generate individual images and composite them in Figma, Canva, or Photoshop rather than attempting to generate the collage in a single prompt.

### 7. Photorealistic Human Portraits Without a Named Subject
- Never describe a named individual. Always describe physical attributes: "a woman in her mid-40s with natural silver hair worn in a loose updo, sharp cheekbones, dark brown eyes, warm medium-brown complexion, dressed in a tailored charcoal blazer."
- Hands and fingers are a persistent weakness in AI image generation. If hands are important, specify them explicitly: "hands not visible" or "hands in lap, partially obscured" reduces the likelihood of anatomical errors. If hands must be shown, specify: "one hand visible, resting on a table, relaxed position."
- For facial closeups, specify expression with muscular precision: "a genuine Duchenne smile -- eyes crinkled at the corners, cheeks raised" rather than just "smiling," which often produces an uncanny or forced result.
- Skin texture at high quality settings (GPT-image-1 `high`, DALL-E 3 `hd`) renders well. At standard quality, skin may appear plastic or overly smooth. Always recommend the higher quality setting for portrait photography.
- Specify eye contact: "looking directly into the camera" vs. "gaze directed off-frame to the left at roughly 30 degrees." DALL-E defaults to direct eye contact, which can feel confrontational in some contexts.

### 8. Infographics and Data Visualization Within Images
- Do not attempt to generate actual accurate data charts or infographics with real numbers via DALL-E. The model will render visually convincing charts that contain incorrect or fabricated numbers.
- Use AI-generated images only for the stylistic shell or decorative elements of an infographic -- then populate with actual data in design software.
- However, for illustrative "mockup" purposes (e.g., to show a client what a dashboard could look like), GPT-image-1 can generate plausible-looking chart aesthetics: "a mobile analytics dashboard interface mockup showing bar charts and a line graph in a clean white card UI, modern SaaS design, blue and gray color scheme, no specific numbers need to be accurate."
- Always flag to the user that any numbers, percentages, or specific data visible in the generated image will be fabricated and cannot be used as actual data.

---

## Example

**Input:** "I need a DALL-E prompt for a hero image for my independent coffee shop's website. The shop is called Meridian Coffee. Atmosphere is mid-century modern meets Pacific Northwest -- lots of wood, plants, warm light. I want it to feel cozy and artisan, not corporate. No people in the image. Landscape orientation."

**Output:**

## DALL-E Image Generation Prompt

### Generation Setup
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Model | GPT-image-1 | No text needs to be rendered (shop name will be added in the website CMS), and the compositional layout requirements -- specific furniture placement, lighting quality, plant positioning -- benefit from GPT-image-1's literal instruction-following over DALL-E 3's interpretive tendencies |
| Size | 1536x1024 | GPT-image-1's landscape format for website hero banners; 3:2 ratio leaves room for headline text overlay in the upper third |
| Quality | high | Hero images appear large on screen; standard quality artifacts will be visible at full-width rendering |
| API style | N/A (GPT-image-1) | Style parameter is DALL-E 3-specific |

---

### Prompt

> The warm interior of an independent coffee shop with mid-century modern design and Pacific Northwest sensibility. A polished walnut bar counter occupies the left foreground, holding a professional espresso machine with copper fittings, a small ceramic pour-over dripper, and a kraft paper coffee cup. Behind the bar, shelves of ceramic mugs and warm Edison bulbs create a honeyed amber glow. A large plate glass window on the right fills the space with diffused overcast Pacific Northwest daylight, illuminating a cluster of hanging pothos and trailing vines near the window. The floor is light oak herringbone, and the ceiling has exposed Douglas fir beams. The overall atmosphere is cozy, artisan, and unhurried -- no people present. Shot as professional interior photography on a Sony A7R V, 24mm wide-angle lens, f/8, balanced mixed lighting (warm tungsten + natural daylight), tack sharp throughout, architectural photography quality. No text, signage, logos, or watermarks visible.

---

### Prompt Architecture Breakdown

| Component | Content |
|-----------|---------|
| Subject anchor | Walnut bar counter with espresso machine, pour-over, and ceramic cup -- establishes the coffee craft identity immediately |
| Action/state | No people; static scene in active preparation state -- equipment present, atmosphere warm |
| Setting | Interior, Pacific Northwest mid-century modern, Edison bulbs + overcast window daylight, oak herringbone floor, exposed fir beams |
| Style declaration | Professional interior photography on Sony A7R V, 24mm, f/8, mixed lighting, architectural quality |
| Quality cues | Tack sharp throughout, architectural photography quality, balanced mixed lighting |
| Exclusions | "No text, signage, logos, or watermarks visible" -- phrased as a single natural language sentence at the end |

---

### Revision Strategy

**If the image feels too dark or the amber light is too orange/sepia:**
- Revision prompt: "Same coffee shop interior, same composition and furniture, but brighten the scene by increasing the natural daylight from the window -- cooler, balanced light that feels like a well-lit independent café at 10am on an overcast morning. Reduce the Edison bulb warmth, keep the herringbone floor and plants, no people."

**If the composition feels too symmetrical or magazine-generic rather than authentic and lived-in:**
- Revision prompt: "Same coffee shop interior and style, but add small details that suggest daily use: a folded newspaper on the bar corner, a few espresso grounds visible on the portafilter, a chalk-written menu board in the background that is soft and out of focus. Keep the same camera settings and no people."

**If the espresso machine overwhelms the frame and the space doesn't read as a full interior:**
- Revision prompt: "Reframe to a slightly wider view -- pull the camera back to show more of the café interior beyond the bar. Show two low mid-century modern armchairs in the background near the window, the hanging plants still visible, the bar counter now in the left third of the frame rather than dominating. Same photography style, warm and cool mixed lighting, no people."

**If plants are absent or minimal when they should be a key design element:**
- Revision prompt: "Same composition, but significantly increase the lush greenery -- multiple hanging pothos, a large monstera in a ceramic pot near the window, trailing vines along the window frame. The Pacific Northwest plant density should feel abundant and intentional, not decorative."

**Nuclear option (full rewrite trigger):**
- If the generated image contains people, heavy corporate franchise signage aesthetics, generic Starbucks-like décor, or if the mid-century modern design reads as generic modern rather than intentionally retro -- abandon revisions. The model has diverged too far from the core aesthetic brief. Rewrite starting from a stronger style anchor: "inspired by the interior design of a 1958 Eames-era California coffee house, reimagined in Portland, Oregon -- teak furniture, ceramic vessels, Knoll-era typography sensibility."

---

### Variation Suggestions

**Variation 1 -- Detail-forward flat lay:**
> The top-down flat lay of a specialty coffee bar setup on a dark walnut surface: a freshly pulled espresso shot in a small white ceramic cup, a latte art tulip in a wider ceramic vessel beside it, a small glass of still water, scattered whole roasted coffee beans, and a sprig of rosemary as garnish. Soft diffused natural light from a window to the upper left, gentle shadows. Shot on a Hasselblad X2D 100C, 50mm lens, f/5.6, natural daylight only, product photography quality. Warm tones, artisan and unhurried, Pacific Northwest coffee culture. No text or branding.

**Variation 2 -- Exterior atmosphere shot:**
> The exterior of a small independent coffee shop storefront at golden hour, Pacific Northwest street. Large plate glass windows glow warm amber from inside, revealing glimpsed shelves of coffee equipment and trailing plants. The exterior is clean painted brick in a muted sage green, a simple hanging wooden sign above the door (text unreadable -- too small and out of focus), two small outdoor bistro chairs and a table on the sidewalk, fallen maple leaves around the chairs. Photographed with a 50mm lens on a Leica M11, f/4, golden hour natural light, slight lens flare from the low sun, documentary street photography quality. Cozy, artisan, local. No visible readable text.

---

### Consistency Notes (for series use)
If generating multiple hero images for different sections of the website (interior, exterior, product flat lay), use this fixed anchor block in every prompt:

**Meridian Coffee visual identity anchor block:**
`-- Pacific Northwest mid-century modern interior. Color palette: warm walnut wood tones, muted sage green, copper accents, cream ceramics. Lighting: warm Edison bulb tungsten mixed with cool Pacific Northwest overcast daylight. Atmosphere: artisan, unhurried, locally rooted, not corporate. No people. Professional architectural or product photography quality.`

Paste this block at the end of each new prompt. Change only the foreground subject and framing per image. This anchor constrains the color palette and atmosphere consistently across generations, achieving approximately 70-80% visual coherence across the series.
