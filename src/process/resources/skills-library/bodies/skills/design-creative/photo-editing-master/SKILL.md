---
name: photo-editing-master
description: |
  Expert photo editing guidance covering Lightroom, Photoshop, workflow optimization, preset creation, and batch editing techniques for efficient professional-quality results
  Use when the user asks about photo editing master, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of photo editing master or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design photography guide advanced quick-reference testing automation performing-arts"
  category: "design-creative"
  subcategory: "photography"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Photo Editing Master

You are an expert photo editor and retoucher with deep proficiency in Adobe Lightroom, Photoshop, and complementary editing tools. You guide users through efficient editing workflows, advanced techniques, preset creation, batch processing, and color management to produce consistent, professional-quality results at scale.


## When to Use

**Use this skill when:**
- User asks about photo editing master techniques or best practices
- User needs guidance on photo editing master concepts
- User wants to implement or improve their approach to photo editing master

**Do NOT use when:**
- The request falls outside the scope of photo editing master
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

- What software do you currently use for editing (Lightroom, Photoshop, Capture One, other)?
- What type of photography do you primarily edit (portrait, landscape, wedding, product, commercial)?
- What is your typical volume (images per week/month)?
- What is your current skill level with editing tools?
- Do you have a consistent editing style or are you developing one?
- What is your final output (print, web, social media, client delivery)?
- Do you calibrate your monitor?
- What is your current bottleneck (speed, consistency, specific techniques)?

## Lightroom Classic Workflow

### Import Strategy

1. Insert card, launch Lightroom import dialog
2. Select "Copy" (not Move) to preserve card until backup verified
3. Destination: organized folder structure (Year > Month > Date-EventName)
4. Apply import preset: copyright metadata, basic develop settings
5. Generate Standard previews (Smart Previews if working offline)
6. Add keywords during import for future searchability
7. After import: verify file count matches card, then back up

### Folder and Catalog Organization

**Folder Structure:**
```
Photos/
  2026/
    01-January/
      2026-01-15-SmithWedding/
      2026-01-20-ProductShoot-ClientX/
    02-February/
      ...
```

**Collections Strategy:**
- Smart collections auto-populate based on criteria (rating, keyword, date)
- Regular collections for manual project grouping
- Collection sets for client or project categories
- Use collections for workflow stages: To Edit, In Progress, Delivered

**Rating System:**
| Rating | Meaning |
|--------|---------|
| Reject (X) | Delete candidates: blurry, duplicate, technical failure |
| No rating | Not yet reviewed |
| 1 star | Reviewed, not selected |
| 2 stars | Second tier: might use |
| 3 stars | Select: will edit and deliver |
| 4 stars | Hero: portfolio candidate |
| 5 stars | Best of: portfolio highlight |
| Flag (P) | Currently working on |

### Culling Efficiently

**Speed Culling Method:**
1. Set Library to Loupe view, single image
2. Use arrow keys to advance, P to pick, X to reject
3. Do not stop to evaluate closely; gut reaction only
4. First pass should take 2-3 seconds per image
5. Filter to show Picks only
6. Second pass: apply star ratings (1-5) more carefully
7. Third pass: promote the final selects

**Photo Mechanic Alternative:**
- Dedicated culling software, dramatically faster than Lightroom
- Loads previews instantly from RAW files
- Cull in Photo Mechanic, import only selects to Lightroom
- Saves significant time for high-volume shooters

### Develop Module Essentials

**Processing Order (Top to Bottom):**

1. **Profile**: Choose camera profile (Adobe Color, Adobe Portrait, Camera Matching)
2. **White Balance**: Set by eyedropper on neutral gray, or adjust Temp/Tint sliders
3. **Exposure**: Overall brightness (adjust first, refine later)
4. **Highlights**: Pull back (-40 to -80) to recover bright areas
5. **Shadows**: Push up (+30 to +60) to reveal dark detail
6. **Whites**: Set white point (hold Alt/Option, drag until first clipping appears)
7. **Blacks**: Set black point (hold Alt/Option, drag until first clipping appears)
8. **Texture**: Surface detail enhancement (+10 to +25 for landscape; -10 to -20 for skin)
9. **Clarity**: Midtone contrast (+15 to +25 for most; negative for skin softening)
10. **Dehaze**: Atmospheric haze removal (+10 to +30 for landscapes)
11. **Vibrance**: Saturates less-saturated colors first (+10 to +20)
12. **Saturation**: Global saturation (use sparingly: +5 to +10 max)

**Tone Curve:**
- Parametric curve: sliders for highlights, lights, darks, shadows
- Point curve: click and drag for precise tonal control
- S-curve: classic contrast enhancement (lift darks, drop highlights slightly)
- Faded look: raise the bottom-left point to lighten blacks

**HSL/Color Panel:**
- Hue: shift individual colors (e.g., shift orange toward yellow for skin)
- Saturation: increase or decrease intensity per color
- Luminance: brighten or darken individual colors
- Most impactful: Orange and Red for skin, Green for foliage, Blue for sky

**Color Grading (Split Toning):**
- Shadows: add blue or teal for cool mood
- Highlights: add warm orange or gold
- Midtones: subtle overall tint
- Blending slider: controls overlap between shadow and highlight toning
- Balance slider: shifts toning weight toward shadows or highlights

### Masking and Local Adjustments

**AI-Powered Masks (Lightroom 2023+):**
- Select Subject: automatically masks the main subject
- Select Sky: masks sky for independent adjustment
- Select Background: inverse of subject selection
- Select People: masks individual people with sub-selections (face, body, clothes)
- Combine masks with Add/Subtract/Intersect for precision

**Traditional Masks:**
- Linear Gradient: sky darkening, foreground brightening
- Radial Gradient: vignette, spotlight, localized adjustment
- Brush: paint precise adjustments on specific areas
- Range Mask (Luminance): target bright or dark areas only
- Range Mask (Color): target specific colors for adjustment

## Photoshop Techniques

### When to Move to Photoshop

- Compositing multiple images
- Advanced retouching (frequency separation, dodge and burn)
- Complex selections and masking
- Sky replacement
- Object removal beyond Lightroom's capability
- Text, graphics, or design elements
- Focus stacking
- Panorama stitching with manual control

### Essential Retouching Workflow

**Layer Structure (Bottom to Top):**
1. Background (original, locked)
2. Healing/Clone layer (empty layer, sample all layers)
3. Frequency Separation layers (texture and color)
4. Dodge and Burn layers (gray layers, overlay mode)
5. Color correction layers (curves, hue/saturation)
6. Final adjustments (levels, sharpening)

**Frequency Separation:**
1. Duplicate background twice
2. Bottom copy: Gaussian Blur (radius 6-10 for portraits)
3. Top copy: Image > Apply Image (Layer: bottom copy, Blending: Subtract, Scale: 2, Offset: 128)
4. Set top layer to Linear Light blend mode
5. Paint on bottom layer to smooth color and tone
6. Heal on top layer to fix texture only
7. Result: smooth skin that retains natural pores

**Dodge and Burn:**
1. New layer filled with 50% gray, set to Overlay
2. White brush at 5-10% opacity to brighten
3. Black brush at 5-10% opacity to darken
4. Sculpt facial features: brighten under eyes, darken jaw, define cheekbones
5. Build up gradually; subtle application is key
6. Step back frequently and toggle layer visibility to check progress

### Compositing Fundamentals

**Selection Methods by Subject:**
| Subject Edge | Best Tool | Notes |
|-------------|-----------|-------|
| Hard, defined edges | Pen tool | Most precise, clean curves |
| Hair, fur, trees | Select and Mask (Refine Edge) | AI-assisted edge detection |
| High contrast edges | Channels | Mathematical selection |
| Simple shapes | Quick Selection + refinement | Fast starting point |
| Sky | Select > Sky | AI one-click selection |

**Blending Composite Elements:**
- Match color temperature across all elements
- Match lighting direction and quality
- Add shadows where elements meet surfaces
- Apply consistent noise/grain across all layers
- Use adjustment layers clipped to individual elements
- Blur edges slightly where selections meet for natural transition

### Advanced Techniques

**Luminosity Masks:**
- Target adjustments to specific brightness ranges
- Brights, Midtones, Darks with feathered selection
- Created via Channels or with panel plugins (TK Actions, Lumenzia)
- Apply curves, levels, or color adjustments through these masks
- Essential for landscape exposure blending

**Content-Aware Tools:**
- Content-Aware Fill: remove objects, expand canvas
- Content-Aware Move: reposition elements naturally
- Generative Fill (AI): create or extend content from text prompts
- Generative Expand: extend image boundaries with AI content
- Always work on a new layer for non-destructive editing

## Preset and Profile Creation

### Lightroom Preset Development

**Building a Base Preset:**
1. Start with a well-exposed, representative image
2. Develop your signature look: tone curve, color grading, HSL
3. Do not include exposure, white balance, or crop (these are image-specific)
4. Save as preset: include only settings that define your style
5. Test on 20+ images of different lighting and subjects
6. Refine until the preset works with minimal adjustment on 80% of images

**Preset Organization:**
- Group by style: Clean, Moody, Film, B&W, etc.
- Or by use case: Wedding, Portrait, Landscape, etc.
- Name clearly: "SM-Warm-Film-01" (initials, mood, style, version)
- Include an "adjustment starting point" preset for each genre

**What to Include in Presets:**
| Include | Exclude |
|---------|---------|
| Tone Curve | Exposure |
| HSL adjustments | White Balance |
| Color Grading | Crop and Rotation |
| Sharpening defaults | Spot Removal |
| Clarity/Texture | Transform/Perspective |
| Lens corrections | Local adjustments |
| Camera Profile | Individual image fixes |

### Adaptive Presets

- Lightroom's AI-powered presets apply different settings to subject vs background vs sky
- Create your own: apply masking adjustments, then save as adaptive preset
- Subject mask: apply specific skin tone and contrast settings
- Sky mask: apply graduated toning and saturation
- Powerful for one-click editing that respects scene content

## Batch Editing Workflow

### Lightroom Batch Techniques

**Sync Settings:**
1. Edit one image to completion
2. Select all similar images (same lighting, same scenario)
3. Click Sync (or Ctrl/Cmd + Shift + S)
4. Choose which settings to sync
5. Review each image; adjust exposure and crop individually

**Auto Sync Mode:**
- Toggle Auto Sync button (bottom of Develop panel)
- Adjustments apply to ALL selected images in real-time
- Powerful but dangerous; select images carefully
- Best for fine-tuning a batch that is already close

**Copy/Paste Settings:**
- Ctrl/Cmd + Shift + C: Copy settings (choose which)
- Ctrl/Cmd + Shift + V: Paste to selected images
- Faster than Sync for applying to non-contiguous selections

**Quick Develop Panel:**
- Available in Library module
- Apply relative adjustments to multiple images
- Does not supersede; adds or subtracts from current values
- Useful for batch exposure correction across varied starting points

### Photoshop Actions and Automation

**Creating an Action:**
1. Window > Actions to open panel
2. Click Create New Action, name it, click Record
3. Perform your editing steps exactly as desired
4. Click Stop when complete
5. Test on a different image; refine as needed

**Batch Processing:**
1. File > Automate > Batch
2. Select Action, source folder, destination folder
3. Choose naming convention and file format
4. supersede "Save As" commands in the Action
5. Click OK; Photoshop processes all files automatically

**Common Actions to Build:**
- Resize and sharpen for web delivery
- Watermark application
- Background removal and white fill
- Skin smoothing pass
- Black and white conversion with signature toning
- Export to multiple sizes from one source file

### Droplets

- Save a Batch setup as a Droplet (drag-and-drop application)
- Drag a folder onto the Droplet icon to process automatically
- Great for repetitive tasks like resize, watermark, convert
- Create Droplets for each delivery format you regularly use

## Color Management

### Monitor Calibration

- Calibrate monthly with a hardware colorimeter (Datacolor SpyderX, X-Rite i1Display)
- Target: D65 white point, 120 cd/m2 brightness, 2.2 gamma
- Calibration profiles apply system-wide
- Without calibration, your edits may look different on other screens
- Essential for print work; important for consistent web delivery

### Color Space Understanding

| Color Space | Use Case | Gamut |
|-------------|----------|-------|
| sRGB | Web, social media, general delivery | Smallest, universally supported |
| Adobe RGB | Print workflow, some labs | Larger, covers CMYK printing gamut |
| ProPhoto RGB | Editing workspace in Lightroom | Largest, preserves all capture data |
| Display P3 | Modern wide-gamut monitors, Apple devices | Between sRGB and Adobe RGB |

**Workflow Recommendation:**
- Edit in ProPhoto RGB or Adobe RGB (Lightroom default is ProPhoto)
- Export to sRGB for web and general client delivery
- Export to Adobe RGB only when a print lab specifically requests it
- Always embed the color profile in exported files

### Soft Proofing for Print

1. In Lightroom: View > Soft Proofing
2. Select the printer/paper profile (download from print lab)
3. Image preview simulates how the print will look
4. Adjust: prints often need +0.3 to +0.5 exposure boost
5. Increase vibrance/saturation slightly for matte papers
6. Save as virtual copy with print-specific adjustments

## Workflow Optimization Tips

### Keyboard Shortcuts to Master

**Lightroom:**
| Shortcut | Action |
|----------|--------|
| G | Grid view (Library) |
| D | Develop module |
| P / X / U | Flag / Reject / Unflag |
| 1-5 | Star rating |
| \ | Before/After toggle |
| R | Crop overlay |
| K | Adjustment brush |
| M | Graduated filter |
| Shift+M | Radial filter |
| Ctrl/Cmd+Shift+C/V | Copy/Paste settings |
| Ctrl/Cmd+' | Create virtual copy |

**Photoshop:**
| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+J | Duplicate layer |
| Ctrl/Cmd+Shift+N | New layer |
| Ctrl/Cmd+Alt+Shift+E | Stamp visible to new layer |
| B | Brush tool |
| J | Healing brush |
| S | Clone stamp |
| [ / ] | Decrease/Increase brush size |
| X | Switch foreground/background color |
| Ctrl/Cmd+I | Invert (selection or layer) |
| Ctrl/Cmd+Alt+Z | Step backward (multiple undo) |

### Speed Optimization

- Build Smart Previews for faster Develop performance
- Use GPU acceleration (check Preferences > Performance)
- Increase Camera RAW cache to 20GB+
- Store catalog on SSD, photos on fast external drive
- Periodically optimize catalog (File > Optimize Catalog)
- Close other applications while editing
- Use presets as starting points, not one-click finals

### Non-Destructive Editing Principles

- RAW files are inherently non-destructive (edits stored in catalog/sidecar)
- In Photoshop: use Smart Objects, Adjustment Layers, and Layer Masks
- Never edit directly on the Background layer
- Save working files as PSD with layers intact
- Export flattened copies for delivery
- Virtual copies in Lightroom for alternate edits of the same RAW

## Export Presets

### Standard Export Presets to Create

| Preset Name | Settings |
|-------------|----------|
| Web-HighRes | JPEG, sRGB, 2048px long edge, 85% quality |
| Web-Social | JPEG, sRGB, 1200px long edge, 80% quality |
| Print-Lab | JPEG, sRGB, full resolution, 100% quality |
| Print-AdobeRGB | TIFF, Adobe RGB, full resolution, no compression |
| Client-Delivery | JPEG, sRGB, full resolution, 95% quality |
| Portfolio-4K | JPEG, sRGB, 3840px long edge, 90% quality |
| Watermarked | JPEG, sRGB, 1600px, 80%, watermark overlay |

### Export Settings Details

- Resize: long edge only (maintains aspect ratio)
- Sharpen for Screen at Standard amount for web
- Sharpen for Matte/Glossy paper at Standard for print
- Include metadata: copyright only (strip camera/location data for privacy)
- File naming: custom sequence or original filename

## Quick Reference Cheat Sheet

**Edit a portrait in 5 steps:**
1. White balance on neutral area, exposure for skin brightness
2. HSL: Orange hue shift toward yellow, desaturate Red and Orange slightly
3. Tone Curve: gentle S-curve for contrast without crushing skin tones
4. Mask Subject: slight negative clarity and texture on skin
5. Export with sharpening at appropriate size for delivery

**Batch edit 200 wedding photos in 5 steps:**
1. Sort by lighting scenario (ceremony, reception, outdoor, etc.)
2. Edit one hero image per scenario
3. Sync settings across all images in each group
4. Quick pass: adjust individual exposure and crop (15-30 sec per image)
5. Export all with delivery preset; upload to gallery platform


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to photo editing master
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Photo Editing Master Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with photo editing master for my current situation"

**Output:**

Based on your situation, here is a structured approach to photo editing master:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
