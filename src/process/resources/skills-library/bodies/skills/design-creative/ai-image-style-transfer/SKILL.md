---
name: ai-image-style-transfer
description: |
  Identifies a visual style's defining characteristics and translates them into AI image generation trigger words for Midjourney, DALL-E, and Stable Diffusion with model-specific syntax.
  Use when the user asks to replicate a visual style in AI art, transfer a style between images, describe an art style for AI generation, or match a reference image's aesthetic.
  Do NOT use for basic prompting in a single model (use the model-specific prompting skill), maintaining character consistency (use midjourney-consistency), or translating complete prompts between models (use prompt-translation).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-image-generation design analysis"
  category: "design-creative"
  subcategory: "ai-image-generation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# AI Image Style Transfer

## When to Use

**Use this skill when:**
- The user wants to replicate a named visual style (Impressionism, Art Nouveau, Bauhaus, cyberpunk, vaporwave) across one or more AI generation models and needs model-specific prompt syntax
- The user has a reference image and wants to capture its aesthetic in a new generation -- they need the style decomposed, not just described back to them
- The user's style prompts are producing generic or inconsistent results and they need targeted diagnosis (wrong trigger words, style fighting the subject, stylize parameter too low)
- The user wants to understand which visual properties of a complex style are achievable in AI generation vs. which require post-processing
- The user wants to combine two or more distinct styles (e.g., "gothic Art Nouveau," "Soviet constructivist cyberpunk") and needs a principled blending strategy
- The user wants to target a specific medium-style (film photography aesthetics, woodblock print, risograph printing, linocut) and needs both the visual decomposition and the specific model vocabulary
- The user is building a consistent visual identity across multiple AI generations and needs repeatable style tokens, not one-off prompts

**Do NOT use when:**
- The user wants a complete prompt for a single model without needing style transfer analysis -- use `midjourney-prompting`, `dalle-prompting`, or `stable-diffusion-prompting`
- The user wants to keep a specific character's face, outfit, or identity consistent across multiple scenes -- use `midjourney-consistency`
- The user has a complete working prompt in one model and wants it converted to another model's syntax verbatim -- use `prompt-translation`
- The user is asking about AI model capabilities in general, not prompting -- use a general AI explainer skill
- The user wants photography retouching or style application in Lightroom/Photoshop, not AI generation -- use a photo editing skill
- The user is asking about copyright or the ethics of style replication -- this skill focuses on technical execution, not policy

---

## Process

### Step 1: Gather Style Inputs

Before decomposing anything, collect the minimum required information. Missing any of these leads to incorrect prompt architecture.

- **Style source** -- Get the most precise form available. A named art movement (Post-Impressionism) is less precise than a named technique (Pointillism). A reference image is more precise than either. An era description ("1970s sci-fi paperback cover art") is a valid starting point but requires inference.
- **Target model(s)** -- Ask explicitly: Midjourney (and which version: v6.1, v7, Niji 6?), DALL-E 3, or Stable Diffusion/ComfyUI/Flux? Each has fundamentally different prompt architectures. If the user wants all three, note that each requires a separately optimized prompt -- not a copy-paste.
- **Subject matter** -- What is the content being rendered in this style? Style interacts with subject: a portrait in Fauvism behaves differently than a landscape in Fauvism because color distortion reads differently on faces.
- **Fidelity level** -- Is the user aiming for "unmistakably this style" (high fidelity, style dominates) or "loosely inspired by" (style as flavor, subject leads)? This determines stylize parameter values and how aggressively to weight style tokens.
- **Output use case** -- Print, digital display, social media post, concept art reference? This affects aspect ratio, resolution guidance, and post-processing recommendations.

### Step 2: Decompose the Style into the Six Visual Properties

Every visual style is a combination of these six properties. Work through all six systematically. Skipping one causes incomplete prompts that produce generic-looking results.

**Property 1: Color Palette**
- Identify the dominant color temperature: warm (sunset orange, ochre, gold), cool (slate blue, steel grey, ice white), or neutral (desaturated, earth tones, sepia)
- Name specific hues using art vocabulary: cerulean, vermilion, viridian, raw umber, cadmium yellow, Prussian blue -- these terms appear in training data and carry more weight than "red" or "blue"
- Identify contrast behavior: high contrast (dark darks, light lights with no midtones) vs. tonal range (smooth gradation across all values) vs. low key (predominantly dark) vs. high key (predominantly light)
- Note any signature color behavior: duotone, triadic color schemes, split complementary, analogous harmony, or intentional color dissonance (Expressionism)
- Flag if the palette has a printing or medium origin: risograph uses two or three overlapping spot colors with halftone dot patterns; woodblock prints show ink bleed at edges; Polaroid shifts toward warm green-yellow shadows

**Property 2: Line Quality and Edge Behavior**
- This is the property most beginners omit. Every style has a characteristic relationship between shapes: hard graphic edges (Art Deco, Pop Art), soft blended edges (Impressionism, Sfumato), visible drawn outlines (cel animation, comic books), no visible outlines (plein air painting, photography)
- Characterize line weight if present: uniform weight (technical illustration), variable weight calligraphy (traditional ink painting), tapered brush lines (manga), thick contour with no detail interior (bold graphic style)
- Identify mark-making vocabulary if relevant: stipple (Pointillism, engraving), cross-hatching (pen-and-ink illustration), impasto drag marks (palette knife painting), dry brush texture (traditional Chinese ink wash), gestural swirls (Van Gogh's Post-Impressionist language)

**Property 3: Texture and Surface Quality**
- Identify the implied physical substrate: canvas grain, paper tooth, glass smoothness, concrete roughness, film grain, digital smoothness
- Note texture behavior: does it appear uniformly across the image or only in specific areas (e.g., visible brushwork in shadows but smooth in highlights)?
- Quantify grain if applicable: fine film grain (ISO 400 equivalent) vs. heavy grain (ISO 3200 push-processed) vs. halftone dots (offset printing screen at 85 LPI) vs. noise (digital sensor noise)
- For printed/mechanical styles: risograph mottling, letterpress impression depth, screen printing misregistration, linocut uneven ink coverage -- these have specific vocabulary that AI models recognize

**Property 4: Composition and Spatial Logic**
- Identify the depth model: true 3D perspective with depth recession, shallow depth (Japonisme, Art Nouveau), flat 2D with no depth cues (Matisse cutouts, Swiss design), isometric (pixel art, technical illustration), forced perspective (propaganda posters)
- Note focal point convention: centered and symmetrical (Art Deco, Byzantine iconography), rule-of-thirds dynamic (photojournalism, landscape painting), all-over composition with no single focal point (Abstract Expressionism, pattern design)
- Identify compositional framing devices used by this style: decorative borders (Art Nouveau vine frames, medieval illumination), bleed-to-edge (fashion photography), negative space as a compositional element (minimalism, Japanese sumi-e), overlapping planes (Cubism, collage)
- Note figure-ground relationship: high figure-ground separation (poster art), ambiguous figure-ground (Escher, Op Art), ground as important as figure (landscape tradition)

**Property 5: Lighting Model**
- Identify the light source type: single strong directional (Caravaggio, film noir), diffuse ambient (overcast plein air), multiple sources (studio photography, three-point lighting), no implied light source (flat illustration, stained glass)
- Characterize shadow behavior: cast shadows vs. form shadows vs. both; hard-edged shadows (high contrast, noon light, harsh artificial) vs. soft gradated penumbra (window light, cloudy sky)
- Note signature lighting effects: chiaroscuro (90% shadow, dramatic value jump), rim lighting (backlit silhouette effect), bioluminescence, neon glow with light bloom, golden hour color shift (everything shifts +15° hue toward orange), underwater caustic patterns
- For photography styles: specify the quality of light: Rembrandt lighting (triangle highlight on shadow side cheek), split lighting (50/50 face divide), butterfly lighting (shadow under nose), catchlights in eyes

**Property 6: Rendering and Realism Level**
- Place the style on the realism spectrum: photorealistic (no visible abstraction), hyperreal (more detailed than perception), stylized realistic (recognizable but simplified), semi-abstract (forms suggested), fully abstract (no representational content)
- Identify the detail distribution: hyperdetailed everywhere (maximalism, Baroque), detailed foreground with loose background (impressionist sketch), flat fill with precise edge detail only (stained glass, cloisonné), overall simplification (icon design, Shaker aesthetic)
- Note perspective handling: natural single-point perspective, two-point perspective (architectural rendering), three-point (dramatic up/down angles), fish-eye (180° distortion), orthographic (no perspective convergence)
- Identify stylistic distortions if they are characteristic: elongation (El Greco, Modigliani, Art Nouveau figures), geometric fragmentation (Cubism), proportion exaggeration (chibi, caricature), impossible geometry (Surrealism)

### Step 3: Identify Style-Defining Differentiators

Most styles share surface similarities with adjacent styles. Identify 2-4 properties that specifically distinguish this style from the most commonly confused alternatives. This step prevents the most common failure mode: generating a style that looks like something adjacent.

- Impressionism vs. Post-Impressionism: Impressionism uses loose, small dabs of unmixed color to capture light and atmosphere; Post-Impressionism retains that texture but reintroduces structured composition and symbolic color (Cézanne's geometric planes, Van Gogh's swirling directional marks)
- Art Nouveau vs. Art Deco: Art Nouveau uses organic flowing curves derived from plant and natural forms, asymmetric compositions, and muted earth/jewel tones; Art Deco uses geometric rectilinear forms, strong symmetry, and high-contrast metallic palettes
- Vaporwave vs. Synthwave vs. Lo-fi: Vaporwave uses classical marble statues, Roman columns, early CGI renders, oversaturated pink/purple/cyan, glitch artifacts, and soft VHS noise; Synthwave uses retro-futurist 80s neon grids, chrome lettering, lens flare, and dramatic sunset gradients; Lo-fi uses muted warm tones, analog grain, and cozy domestic scenes without the digital artifact vocabulary
- Anime styles: distinguish between shojo (delicate features, large eyes, soft pastel watercolor backgrounds, flower motifs), shonen (bold lines, dynamic motion blur, high contrast, muscular forms), and mecha (hard-surface rendering, technical detail, dramatic perspective, chrome and shadow)

### Step 4: Map Properties to Model-Specific Vocabulary

Each model has different mechanisms for style activation. Using the wrong vocabulary for a model produces weak or ignored style signals.

**Midjourney (v6.1 and v7) Vocabulary and Parameters:**
- Style tokens work best as specific noun phrases placed early in the prompt: "oil painting," "woodblock print," "gouache illustration," "linocut" -- not adjectives like "painterly" or "illustrative"
- The `--stylize` parameter (range 0-1000, default 100) is the most powerful style fidelity control. Values of 250-400 produce strong aesthetic interpretation. Values above 600 let Midjourney's aesthetic model dominate the reference style. Values below 50 produce literal but aesthetically flat results. For style transfer, 200-500 is the working range.
- `--style raw` disables Midjourney's default beautification engine. Use this for styles that should look rough, aged, or low-tech (Polaroid, zine aesthetics, risograph, vintage poster)
- `--sref [URL]` (style reference) in v6.1 and v7 extracts color palette and surface texture from a reference image at weight 0-1000. At weight 100 (default), it's subtle. At 500, it dominates. Use `--sw 500` to boost style reference weight. Note: `--sref` captures palette and texture but not composition -- it does not impose the reference image's layout
- `--niji 6` is a separate model tuned for anime/illustration styles. For any cel-animated, manga, or anime-adjacent style, switch to `--niji 6` instead of `--v 6.1`
- Aspect ratio `--ar` affects how composition directs: `--ar 2:3` activates portrait compositional conventions, `--ar 16:9` activates cinematic/landscape conventions, `--ar 1:1` activates centered symmetrical tendencies
- The `--no` parameter is a hard exclusion: `--no photograph, realistic, 3D render` are standard additions for painterly/illustrative styles

**DALL-E 3 Vocabulary:**
- DALL-E 3 processes natural language sentences, not keyword tags. Style must be described in prose: "painted with thick impasto strokes of unmixed color, with a rough canvas texture visible throughout" outperforms "impasto painting"
- Medium specification is critical: explicitly name "oil paint," "watercolor on cold-press paper," "digital illustration," "gouache on toned paper" -- DALL-E 3 has strong training on medium vocabulary
- DALL-E 3 responds well to art historical references when framed as technique descriptions: "in the manner of 19th-century French academic painting, with smooth blended skin tones, glazed luminosity, and dramatic chiaroscuro" is effective; naming specific living artists is not permitted and naming deceased artists may produce inconsistent results -- technique descriptions are more reliable
- Negative prompting is not directly supported in DALL-E 3's API/interface. Instead, use affirmative language to crowd out unwanted qualities: "flat graphic style with no photographic realism" excludes photorealism without a negative keyword
- DALL-E 3 handles complex compositional instructions better than other models. Describe spatial arrangement explicitly: "the figure occupies the left third of the frame, with a receding landscape in the right two-thirds using atmospheric perspective"

**Stable Diffusion / Flux / ComfyUI Vocabulary:**
- SD prompt architecture uses weighted tags: `(tag:weight)` where 1.0 is default, 1.3 is strong emphasis, 1.5 is very strong, and above 1.5 begins to produce distortion. Common style weights: `(oil painting:1.3)`, `(art nouveau:1.2)`, `(impressionist:1.2)`
- Leading quality tokens still matter on base models: `masterpiece, best quality, highly detailed` placed first. On SDXL and Flux, these matter less but still provide a quality floor
- Negative prompts are critical for style isolation. Standard style-contamination exclusions: `photorealistic, 3d render, cgi, digital art` (when targeting traditional media), or `painting, brushstrokes, traditional media` (when targeting photography)
- LoRA (Low-Rank Adaptation) files provide the most accurate style replication in SD. Syntax: `<lora:filename:weight>` where weight 0.6-0.8 is the typical working range. Above 0.9 often causes saturation and artifact buildup. Multiple LoRAs can be stacked but total weight should not exceed 1.5 combined. Always note that LoRAs must be downloaded and installed locally -- they cannot be assumed to be available
- Textual Inversion embeddings (`.pt` or `.bin` files) also carry style vocabulary: `embedding_name` placed in the prompt activates the concept. Embeddings are generally subtler than LoRAs.
- Flux.1 models (dev, schnell) use natural language closer to DALL-E 3 than traditional SD tag syntax. With Flux, write descriptive sentences while retaining some key style tags: "impressionist oil painting with visible short brushstrokes and warm dappled light, (Monet-style:1.1)"
- CFG scale (classifier-free guidance) affects style fidelity: 7-9 is standard for most styles. For very specific style lock-in, 9-11 strengthens prompt adherence but reduces variation. Below 5 produces dreamlike but style-loose results.

### Step 5: Diagnose Style Conflicts

Identify any terms in the proposed subject description that will fight the target style. Style conflict is the most common reason prompts fail.

- Photographic subject terms conflict with painterly styles: "a woman" is neutral, but "a woman standing in a room" begins to pull toward photographic realism. Add "painted portrait of a woman" to anchor the medium
- Specific named locations (Eiffel Tower, Times Square) pull toward photographic documentary in all models. Pair them with the style medium to counteract: "oil painting of the Eiffel Tower in the Impressionist style, not photographic"
- Highly detailed technical subjects (circuit boards, mechanical gears) pull SD and MJ toward technical illustration regardless of style. Weight the style term higher when subjects are technical: `(impressionist painting:1.5), circuit board`
- Fantasy/sci-fi subjects (dragons, spaceships) pull MJ toward its default "fantasy art" aesthetic. Use `--style raw` to reduce this and let the specified style dominate
- Color-heavy subjects can override a muted palette. If the target style uses muted earth tones but the subject is "a rainbow," acknowledge the conflict and suggest either adapting the subject description or accepting palette compromise

### Step 6: Assess Transfer Fidelity by Property

Be honest and specific about what each model can and cannot do with each style property. Assign each property a fidelity rating: **High**, **Medium**, or **Low**, with a specific reason.

- **High**: The property transfers reliably and consistently. The model has strong training signal for this exact visual attribute. Example: Midjourney reliably transfers color palettes because it has strong color following.
- **Medium**: The property transfers partially or inconsistently. Results require iteration (try the prompt 4-8 times and select). Example: Composition symmetry is approximate in all models -- slight asymmetries are common.
- **Low**: The property is suggested at best. The AI frequently drifts from the target. Acknowledge this explicitly and recommend alternatives (LoRA, post-processing, compositional templates). Example: Exact brushwork direction (Van Gogh's swirling marks) is Low fidelity in DALL-E 3.

### Step 7: Compile the Complete Style Transfer Specification

Assemble all outputs into the standard format below. Include:
- The full style analysis table
- Model-specific prompts with all required syntax
- Key trigger terms called out explicitly
- Transfer fidelity table
- Honest limitations with actionable workarounds

---

## Output Format

```markdown
## Style Transfer: [Style Name]

### Style Differentiators
*What distinguishes this style from commonly confused alternatives:*
- [Differentiator 1: "Unlike X, this style uses Y because Z"]
- [Differentiator 2]
- [Differentiator 3]

### Style Analysis
| Property           | Visual Description                                         | Key Descriptors for Prompts                              |
|--------------------|------------------------------------------------------------|----------------------------------------------------------|
| Color Palette      | [Specific hues, temperature, contrast behavior]            | [Art vocabulary terms for prompts]                       |
| Line & Edge        | [Edge quality, line weight, outline behavior]              | [Specific line/edge vocabulary]                          |
| Texture & Surface  | [Physical substrate, mark-making, grain/print artifacts]   | [Texture vocabulary]                                     |
| Composition        | [Depth model, focal point, spatial logic]                  | [Compositional terms]                                    |
| Lighting           | [Source type, shadow behavior, signature effects]          | [Lighting vocabulary]                                    |
| Rendering Level    | [Realism spectrum, detail distribution, distortions]       | [Rendering vocabulary]                                   |

### Style Conflict Warnings
*These subject or prompt terms will fight this style -- avoid them:*
- [Conflict term 1]: [Why it conflicts and what to use instead]
- [Conflict term 2]: [Why it conflicts and what to use instead]

---

### Model-Specific Prompts

#### Midjourney (v6.1)
```
/imagine prompt: [subject], [medium/style anchor], [color palette description], [texture/line quality], [composition description], [lighting description], [rendering level], [2-3 reinforcing style adjectives] --ar [ratio] --v 6.1 --s [200-500] --style raw (if applicable) --no [conflict terms]
```
**Key trigger terms:** [list 4-6 terms that activate this style in MJ, with notes on why they work]
**Parameter rationale:** `--s [value]` because [specific reason]; `--style raw` [use/omit] because [specific reason]
**Style reference note:** [If applicable: how to use --sref for this style]

---

#### DALL-E 3
```
[2-4 sentence natural language prompt. First sentence: medium and style name. Second sentence: color palette and texture description. Third sentence: composition and lighting. Fourth sentence: what this image is NOT (photorealistic, etc.) using affirmative exclusion language.]
```
**Key trigger phrases:** [list 4-5 descriptive phrases that DALL-E 3 responds to for this style]
**DALL-E 3 notes:** [Any specific handling notes: what this model does well vs. poorly for this style]

---

#### Stable Diffusion (SDXL / Flux.1)
```
Positive prompt:
masterpiece, best quality, [medium tag], [(style name:1.2)], [(color palette terms:1.1)], [texture/surface terms], [composition terms], [lighting terms], [(rendering terms:1.1)], [reinforcing style vocabulary], <lora:suggested_lora_name:0.7>

Negative prompt:
[terms that contaminate this style], lowres, bad anatomy, worst quality, blurry, [medium-specific exclusions]
```
**Key trigger tags:** [list with weights -- which tags carry the most style activation signal]
**LoRA recommendation:** [Specific LoRA category to search for + typical weight range 0.6-0.8; note user must install locally]
**CFG recommendation:** [value range + rationale]
**Flux.1 variation:** [Modified syntax for Flux.1 if different from SDXL]

---

### Transfer Fidelity Assessment
| Property           | Midjourney | DALL-E 3 | SD/Flux   | Specific Notes                                           |
|--------------------|-----------|----------|-----------|----------------------------------------------------------|
| Color Palette      | [H/M/L]   | [H/M/L]  | [H/M/L]   | [Specific detail on why this rating]                     |
| Line & Edge        | [H/M/L]   | [H/M/L]  | [H/M/L]   | [Specific detail]                                        |
| Texture & Surface  | [H/M/L]   | [H/M/L]  | [H/M/L]   | [Specific detail]                                        |
| Composition        | [H/M/L]   | [H/M/L]  | [H/M/L]   | [Specific detail]                                        |
| Lighting           | [H/M/L]   | [H/M/L]  | [H/M/L]   | [Specific detail]                                        |
| Rendering Level    | [H/M/L]   | [H/M/L]  | [H/M/L]   | [Specific detail]                                        |

---

### Limitations and Workarounds
| Limitation                     | Why It Occurs                                          | Workaround                                              |
|-------------------------------|--------------------------------------------------------|---------------------------------------------------------|
| [Specific limitation 1]       | [Root cause in model architecture or training]         | [Specific actionable workaround]                        |
| [Specific limitation 2]       | [Root cause]                                           | [Workaround]                                            |
| [Specific limitation 3]       | [Root cause]                                           | [Workaround]                                            |
```

---

## Rules

1. **Always decompose all six visual properties.** Four-property decompositions leave gaps that produce generic results. Line quality and texture are the properties most commonly omitted -- and they are often the most distinctive aspect of a style.

2. **Never write a single prompt and reformat it for all three models.** Midjourney requires noun-phrase style tokens. DALL-E 3 requires descriptive prose sentences. Stable Diffusion requires weighted tags and negative prompts. The same content must be re-architected for each model, not reformatted.

3. **Color descriptions must use art vocabulary, not colloquial color names.** "Warm amber" is too vague. "Cadmium yellow lightened with raw sienna, with cerulean shadows" is actionable. AI models have strong training signal on art supply and pigment vocabulary. Using these terms produces more accurate palette fidelity.

4. **The `--stylize` parameter in Midjourney must always be specified for style transfer work.** The default value of 100 is too low for strong style expression. For most style transfer work, the range 200-500 applies. Include the rationale: why 200 vs. 500 depends on whether the style should dominate or be flavoring.

5. **Do not name living artists.** This applies in all models and all prompt positions. Describe visual characteristics of the style instead. For deceased artists, describing technique is more reliable than attribution anyway -- "short visible brushstrokes of unmixed color applied in a mosaic pattern" outperforms "in the style of Georges Seurat" in most cases.

6. **Always include Style Conflict Warnings.** Subject matter and style interact. Photographic subjects pull toward photorealism, fantasy subjects pull toward default AI aesthetics, and technical subjects pull toward illustration. Identify these conflicts before writing the final prompts.

7. **LoRA recommendations must include three caveats: (a) user must install locally, (b) the specific weight range to use (never say "use weight 1.0"), and (c) that LoRAs stack and total combined weight should not exceed 1.5.** Do not assume LoRA availability.

8. **Texture and surface fidelity must be rated honestly.** Physical texture (impasto paint depth, paper grain, fabric weave) is a Low fidelity property in all models because it is a 3D quality being approximated in a 2D image. Simulated texture (visible brushstrokes, film grain patterns, halftone dots) rates Medium to High depending on training coverage. Never rate physical texture as High.

9. **Mixed-style requests require a dominance hierarchy.** When two styles are combined, one must be primary (weighted higher or placed first in the prompt) and one secondary. Prompts with two equally-weighted competing styles produce incoherent outputs in all models. State explicitly which style is primary and why.

10. **Always include the Flux.1 variation when writing SD prompts.** Flux.1 models have largely replaced SD 1.5 in active use and require a different prompt approach (closer to natural language). Writing only SDXL tag syntax leaves Flux users underserved.

11. **The negative prompt in Stable Diffusion must be style-specific, not just quality-generic.** `lowres, bad anatomy, worst quality` are quality terms, not style terms. For style transfer, the negative prompt must exclude the opposite style: targeting a painterly style means adding `photorealistic, 3d render, cgi, digital photograph` to the negative prompt. Targeting a photographic style means adding `painting, illustration, brushstrokes, drawn` to the negative prompt.

12. **When the user's style prompt is producing wrong results, diagnose before re-prompting.** The four most common failure modes are: (a) style fighting subject -- the subject vocabulary is overriding the style signal, (b) `--stylize` too low in MJ -- raise it to 300-500, (c) missing negative prompt in SD -- style contamination from opposing medium vocabulary, (d) DALL-E 3 ignoring style because the style description came after a long subject description -- move style description to the first sentence.

---

## Edge Cases

**User provides a reference image but cannot name the style:**
Work through the six-property decomposition using purely observational language. Do not guess a movement name until after the decomposition is complete. Describe what you see: "The image uses a limited palette of approximately four colors, with strong dark outlines separating flat color fills, shallow depth with no atmospheric perspective, and stylized simplified forms." Once the properties are mapped, identify the closest art movement or technique as a secondary reference: "These properties are consistent with a Cloisonnist painting technique, which you can use as a secondary search term." Build the prompt from the decomposed properties, not the movement name -- the movement name should serve as a verification label, not a prompt anchor.

**Style from a specific decade of a mass-medium (e.g., 1950s American advertising illustration, 1980s video game pixel art, 1990s MTV motion graphics):**
These styles are highly specific and richly represented in AI training data. Translate them using the decade, the medium, and 3-4 visual signatures. "1950s American advertising illustration" becomes: `gouache illustration, 1950s commercial art, mid-century modern color palette (avocado green, coral red, harvest gold, cream white), clean confident brushwork, smiling idealized figures, optimistic sunlit scenes, Ladies Home Journal style`. The decade is more important than the medium name here -- specify both. SD benefits enormously from decade-specific LoRAs for well-documented commercial art periods.

**Style that is defined primarily by what it lacks (minimalism, Shaker design, wabi-sabi, Brutalism):**
Reductive styles are harder to prompt than additive styles because AI models have a strong default toward adding detail and visual complexity. Strategy: Use the positive properties (the few elements that ARE present) weighted high, and use the negative prompt aggressively for everything the style excludes. For Brutalist visual aesthetics: positive prompt leads with `raw exposed concrete texture, geometric rectangular forms, (stark minimalism:1.4), muted grey palette, harsh shadow, architectural photography` and negative prompt includes `ornament, decoration, warm colors, plants, curves, softness, humans, furniture`. DALL-E 3 handles reductive styles best when the prose explicitly states what is absent: "The image contains no decorative elements, no warm tones, and no organic curves."

**Style from a culture with limited representation in AI training data (e.g., Batik textile patterns, Persian miniature painting, Yoruba Adire cloth, Andean textile geometry):**
Acknowledge the training coverage gap directly. Do not use the style name as a prompt anchor because it may not be well-represented or may have been mislabeled in training data. Instead: (a) decompose the style into universal visual properties that any model can render -- pattern geometry, color vocabulary, symmetry type, line quality; (b) supplement with well-represented adjacent references that share properties, noted as approximations: "Persian miniature painting shares compositional properties with medieval European illuminated manuscripts and Japanese screen painting -- you can reference these as approximate anchors while specifying the distinctive properties"; (c) recommend SD with a custom-trained LoRA as the primary path to accuracy; (d) flag that results will be approximations and cultural accuracy cannot be guaranteed by AI generation.

**User wants to apply a style to a subject that strongly resists it (abstract style on a product photo, photorealistic style on a cartoon character):**
When style and subject are in direct tension, explain the tension before providing prompts. A photorealistic rendering of a cartoon character (e.g., making a Minecraft character "realistic") works because you're applying a new medium to a subject -- the subject's properties survive. An abstract style (Kandinsky-style abstraction) applied to a specific product photo will either lose the product's recognizability or fail to achieve abstraction -- you cannot have both. Offer three options: (a) style dominates, subject is referenced loosely; (b) subject dominates, style is flavoring; (c) separate generation of a style-appropriate illustration that incorporates the product as a designed element, not a photographic transcription.

**User wants style consistency across multiple images in a series (style as a system, not a single prompt):**
Single-image style transfer and series style consistency are different problems. For series work: (a) create a "style seed" -- one successful generation that locks the visual language; in Midjourney, use `--sref` with the seed image URL at weight 500 across all subsequent generations; in SD, record the seed number of a successful generation and include it in the workflow; in DALL-E 3, save the exact prompt used and prepend it to all subsequent subject descriptions; (b) build a style token glossary -- a 6-10 word phrase that captures the style essence, tested to produce consistent results, that prepends every prompt in the series; (c) note that perfect consistency is not achievable in any model without fine-tuning. Aim for "recognizably related" rather than "identical style." This edge case approaches `midjourney-consistency` territory -- if character identity is also required, recommend using that skill in conjunction.

**User asks why their style prompt is not working:**
Run the four-failure-mode diagnostic before suggesting any changes. Ask to see: the exact prompt as written, the model and version, and a description of what the output looks like vs. what was expected. Diagnose in this order: (1) Is the style fighting the subject? -- look for photographic or realism-coded subject terms when targeting a painterly style; (2) Is the style anchor placed too late in the prompt? -- in MJ and SD, style anchor terms have stronger signal in the first 20% of the prompt; (3) Is the stylize/CFG value correct? -- MJ default of 100 is too low for strong style, SD CFG below 7 is too loose; (4) Is the negative prompt excluding the wrong things? -- a negative prompt targeting quality issues (blurry, bad anatomy) but not medium contamination (photorealistic, cgi) lets competing style signals leak in. Provide the specific fix for the diagnosed failure mode, not a complete prompt rewrite.

---

## Example

**Input:** "I want to generate images in a risograph print style for a series of event posters. I need this to work across Midjourney, DALL-E 3, and Stable Diffusion. The subject is a jazz musician playing trumpet in a city at night."

**Output:**

## Style Transfer: Risograph Print

### Style Differentiators
*What distinguishes Risograph printing from commonly confused alternatives:*
- **Risograph vs. screenprint:** Both use spot colors, but risograph produces distinctive mottled ink coverage (ink sits on paper unevenly at microscopic level) and halftone dot patterns at 65-85 LPI. Screenprints have more uniform coverage and smoother gradients.
- **Risograph vs. CMYK offset print:** Risograph uses only 2-3 colors maximum per image (limited by ink drums), creating a distinctively limited palette. CMYK offset printing can reproduce full color. Risograph's color mixing is only possible where ink layers overlap, producing secondary colors only at intersections.
- **Risograph vs. linocut:** Both have a handmade, textured quality, but risograph uses photomechanical reproduction with dot-screen halftones. Linocut shows carved marks and directional cut lines. Risograph looks printed; linocut looks carved.

### Style Analysis
| Property           | Visual Description                                                        | Key Descriptors for Prompts                                                    |
|--------------------|---------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Color Palette      | 2-3 spot colors maximum: classic combos are fluorescent pink + teal, or black + orange + yellow. Colors only mix where layers overlap, producing secondary colors at intersections. Paper shows through as a neutral. | risograph print, 2-color print, spot color, fluorescent pink, teal, ink overlap, limited palette, paper white showing through |
| Line & Edge        | Shapes defined by flat color fills rather than drawn outlines. Halftone dot screens at 65 LPI create value gradations. Slight misregistration between color layers is a characteristic feature, not an error. | halftone dots, flat color fills, spot color misregistration, no outlines, screen dot pattern |
| Texture & Surface  | Mottled ink coverage -- especially in mid-tones -- creating a grainy, slightly uneven look. Paper grain visible. Fine halftone dot screen visible at close inspection. Ink builds up at shape edges. | mottled ink texture, paper grain texture, halftone screen, ink density variation, slightly uneven coverage |
| Composition        | Bold, graphic, simplified forms. Strong figure-ground separation. Flat depth with no atmospheric perspective. Designed for poster readability at a distance -- large simple shapes dominate. Space for typographic elements is a compositional assumption. | flat composition, bold graphic shapes, strong silhouette, poster design, flat depth, 2D |
| Lighting           | No traditional lighting model. Forms are defined by flat color fills, not light/shadow. Any "shadow" areas are indicated by a second color layer overlap, not gradient shading. The overall effect reads as illuminated from nowhere -- or equally from all directions. | flat lighting, no shadows, color layer overlap indicates depth, graphic flat light |
| Rendering Level    | Highly stylized. Forms simplified to bold shapes. Detail is sacrificed for graphic impact. Human figures become iconic silhouettes or semi-abstract shapes. Textures are pattern-based (halftone dots) rather than realistic. | highly stylized, simplified forms, iconic, poster art, graphic, abstract simplified, bold shapes |

### Style Conflict Warnings
*These subject or prompt terms will fight this style -- avoid them:*
- **"night scene" or "dark atmosphere"**: pulls toward photorealistic nighttime photography. Replace with "nighttime color palette represented in spot colors" or specify the limited palette explicitly (black ink + fluorescent teal) rather than describing atmospheric darkness
- **"realistic," "photograph," "photorealistic," "3D render"**: directly conflicts with flat graphic style; add to negative prompts in all models
- **"detailed face" or "portrait"**: pulls toward photorealistic facial rendering; replace with "graphic stylized face," "simplified face," "poster figure"
- **"city lights," "neon reflections"**: pulls toward cyberpunk/neon photography aesthetics; use "city silhouette in flat color" instead

---

### Model-Specific Prompts

#### Midjourney (v6.1)
```
/imagine prompt: jazz musician playing trumpet, city skyline at night, risograph print poster, 2-color spot color printing, flat graphic shapes, fluorescent pink and teal ink on cream paper, halftone dot screen, bold simplified silhouette, slight ink misregistration, mottled ink texture, flat depth, graphic poster composition, 1980s indie concert poster aesthetic, no photorealism, no gradients --ar 2:3 --v 6.1 --s 350 --style raw --no photograph realistic 3d render airbrush smooth gradient shadow
```
**Key trigger terms:**
- `risograph print` -- direct style name with strong training signal in MJ v6.1
- `2-color spot color printing` -- constrains palette behavior and flat fill rendering
- `halftone dot screen` -- activates the texture characteristic; without this term, MJ defaults to smooth fills
- `flat graphic shapes` -- counteracts MJ's default tendency to add depth and dimension
- `ink misregistration` -- critical term; without it, MJ aligns layers perfectly, losing the characteristic risograph look
- `--style raw` -- removes MJ's beautification layer, which would otherwise smooth the mottled texture and even out the ink coverage

**Parameter rationale:** `--s 350` because risograph is a strong, distinctive style that needs significant stylization power to override MJ's default realism tendencies, but not so high (500+) that the composition breaks down. `--style raw` is non-negotiable for this style -- MJ's default aesthetic actively fights the rough, imperfect quality that defines risograph.

**Style reference note:** If you have an existing risograph print image, use `--sref [URL] --sw 600` to pull in the ink mottling and halftone texture. Color palette from `--sref` will be particularly strong. If combining with a subject image reference, use `--cref` for the subject and `--sref` for the risograph style separately.

---

#### DALL-E 3
```
A risograph-printed event poster illustration of a jazz musician playing trumpet, set against a simplified city skyline at night. The image uses only two spot colors -- fluorescent pink and deep teal -- printed on cream-white paper, with color mixing only occurring where the two ink layers overlap, creating a darker secondary color at those intersections. All forms are flat graphic shapes with no photographic shading or gradients; depth is suggested through color layer overlap alone. A visible halftone dot screen texture (approximately 65 dots per inch) creates value variation in the colored areas. The ink coverage is slightly uneven and mottled, as is characteristic of actual risograph printing. The composition uses bold simplified silhouettes with strong graphic readability, designed as a vertical portrait-format poster with empty space at the top and bottom for text overlay. The style is flat, graphic, and deliberately imperfect -- not smooth, not realistic, not photographic.
```
**Key trigger phrases:**
- "two spot colors -- fluorescent pink and deep teal" -- DALL-E 3 responds strongly to color specificity at this level of detail
- "color mixing only occurring where the two ink layers overlap" -- this sentence teaches DALL-E 3 the risograph color logic, which is non-obvious
- "halftone dot screen texture (approximately 65 dots per inch)" -- quantifying the halftone is more effective than just saying "halftone"
- "ink coverage is slightly uneven and mottled" -- affirmative description of the imperfection, rather than trying to achieve it through negative exclusion
- "deliberately imperfect -- not smooth, not realistic, not photographic" -- DALL-E 3 uses affirmative exclusion well; ending with the "not X" framing is effective

**DALL-E 3 notes:** DALL-E 3 handles the color limitation and flat graphic qualities of risograph reasonably well. Its weakest area for this style is ink mottling texture -- expect smoother ink coverage than an actual risograph print would produce. The halftone dot screen will often be rendered more lightly than specified. For maximum texture, describe the halftone dots as "clearly visible and coarse, approximately the size of a period on a printed page."

---

#### Stable Diffusion (SDXL / Flux.1)

**SDXL prompt:**
```
Positive prompt:
masterpiece, best quality, risograph print, (2 spot colors:1.3), (flat graphic illustration:1.2), (halftone dots:1.3), jazz musician trumpet player, city skyline silhouette, (fluorescent pink and teal ink:1.2), cream paper background, ink mottling, ink misregistration, spot color overlap, (bold simplified shapes:1.2), (poster art:1.1), flat depth, no shading, graphic design, indie concert poster, paper texture, 1980s print aesthetic, <lora:risograph_print_style:0.75>

Negative prompt:
photorealistic, photograph, 3d render, cgi, smooth gradient, realistic shading, airbrush, blurry, soft focus, full color, CMYK, digital painting, watercolor, oil painting, overly detailed, complex background, lowres, bad anatomy, worst quality
```
**Key trigger tags:**
- `(halftone dots:1.3)` -- highest weight tag; this is the single most recognizable visual property of risograph. Without strong weighting it disappears
- `(2 spot colors:1.3)` -- constrains the palette; without this, SD defaults to full color
- `ink misregistration` -- a distinctive risograph property that has good training coverage in SDXL
- `ink mottling` -- produces the uneven ink coverage; may need to be combined with `paper texture` for full effect
- Negative prompt note: `smooth gradient` in the negative is critical -- SD's default behavior for colored areas is gradient fills, which are the opposite of risograph spot color

**LoRA recommendation:** Search CivitAI or Hugging Face for "risograph" or "riso print" LoRA (SDXL compatible). Typical working weight: 0.7-0.8. Do not exceed 0.9 -- above this weight, risograph LoRAs tend to flatten all detail completely and produce artifacts. Note: LoRAs must be downloaded and installed in your local SD installation or ComfyUI workflow. If stacking with another style LoRA, combined weight should not exceed 1.4 total.

**CFG recommendation:** 8-9. Risograph requires precise adherence to the color constraint, which benefits from higher guidance. Below 7, the 2-color limitation breaks down and additional colors creep in.

**Flux.1 variation:**
```
Risograph-printed poster illustration of a jazz musician playing trumpet against a city skyline silhouette. Two spot colors only: fluorescent pink and teal, printed on cream paper. Flat graphic shapes, visible halftone dot screen texture, slight ink misregistration between layers, mottled uneven ink coverage. No photographic shading, no gradients, no full color. Bold simplified silhouette forms, flat poster composition. Indie concert poster aesthetic.
```
With Flux.1, use natural language but retain the most critical technical tags (`halftone dot screen`, `ink misregistration`, `2 spot colors`) as they are present in Flux training data. Flux.1 does not benefit from aggressive weight syntax -- the natural language description carries more weight than `(term:1.3)` notation.

---

### Transfer Fidelity Assessment
| Property           | Midjourney  | DALL-E 3   | SD/Flux    | Specific Notes                                                                                     |
|--------------------|-------------|------------|------------|----------------------------------------------------------------------------------------------------|
| Color Palette      | High        | High       | Medium     | MJ and DALL-E 3 both follow the 2-color constraint reliably. SD without LoRA often adds extra colors; LoRA brings this to High. |
| Line & Edge        | High        | Medium     | High       | Flat graphic fills with halftone are well-represented in MJ. DALL-E 3 tends to soften edges slightly. SD with LoRA excels here. |
| Texture & Surface  | Medium      | Low        | High       | Ink mottling and halftone dots transfer medium in MJ (present but smooth). DALL-E 3 struggles with surface texture specificity. SD with risograph LoRA handles this best. |
| Composition        | High        | High       | Medium     | Poster-format graphic composition is strong in both MJ (with `--ar 2:3`) and DALL-E 3. SD requires explicit compositional guidance. |
| Lighting           | High        | High       | High       | Flat lighting (no shadows or gradient illumination) is achievable in all models when negative prompts exclude shading vocabulary. |
| Rendering Level    | High        | Medium     | High       | MJ with `--style raw` achieves the simplified graphic rendering consistently. DALL-E 3 occasionally adds unwanted detail to figures. SD with LoRA is very strong. |

---

### Limitations and Workarounds
| Limitation                                      | Why It Occurs                                                                          | Workaround                                                                                                     |
|-------------------------------------------------|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|
| AI cannot strictly enforce exactly 2 spot colors | Models generate full RGB images and simulate a limited palette rather than actually printing in 2 ink layers | Post-process in Photoshop: convert to Indexed Color with exactly 3 colors (ink 1, ink 2, paper), then colorize each channel |
| Halftone dots are often rendered too subtly     | Models average texture across regions rather than rendering coarse dot patterns         | Increase weight: `(halftone dots:1.4)` in SD; add "large visible coarse halftone dots like a newspaper" to DALL-E 3 prose; add "coarse halftone screen" to MJ |
| Text/typography in the poster will not be usable | AI-generated text has high error rate in all models; letter forms are decorative approximations | Generate the image with no text, then add typographic elements in Figma, Photoshop, or Canva as a separate layer |
| Ink misregistration is subtle or absent         | Models trained on "correct" images trend toward alignment; misregistration requires explicit emphasis | Strengthen with: "dramatic ink misregistration, offset layers by 3-4 pixels" in prose (DALL-E 3); `(ink misregistration:1.4)` in SD; "obvious ink misregistration offset" in MJ |
| Night scene pulls toward photographic darkness  | "Night" vocabulary has strong photographic training signal -- blue gradient sky, lens flare, bokeh | Replace "night" with "dark blue ink as background color," describe the nighttime mood through palette choices rather than atmospheric description |
