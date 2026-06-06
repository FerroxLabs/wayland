---
name: lighting-setup
description: |
  Produces a lighting setup specification with key light position, modifier,
  fill light ratio and position, background light, and color temperature for
  portrait, product, and scene photography. All positions use clock-position
  notation relative to the subject.
  Use when the user asks about lighting for photography, studio lighting
  setup, portrait lighting, or product photography lighting.
  Do NOT use for camera exposure settings (use exposure-triangle), photo
  composition (use composition-guide), or post-processing color grading
  (use photo-editing-workflow).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "photography design template"
  category: "design-creative"
  subcategory: "photography"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Lighting Setup

## When to Use

Use this skill when the user needs a complete, actionable lighting specification they can physically set up in a studio, home, or on-location environment.

**Use this skill when:**
- The user asks how to set up or configure lights for a portrait, headshot, beauty shot, editorial portrait, or environmental portrait
- The user wants a lighting plan for product photography -- packaged goods, jewelry, cosmetics, footwear, electronics, or food
- The user needs to replicate a specific named lighting look (Rembrandt, butterfly/Paramount, loop, split, clamshell, cross-lighting, or chiaroscuro)
- The user has specific equipment constraints (one speedlight, window light only, two strobes and a reflector) and needs to maximize results within those constraints
- The user is troubleshooting a problem with their existing lighting setup -- unwanted shadows, flat images, reflections on products, uneven background exposure, or muddy skin tones from mixed color temperatures
- The user needs a lighting diagram or setup documentation for a production brief, shot list, or repeatable commercial workflow
- The user is preparing for a specific genre shoot -- corporate headshots, catalog product photography, food styling, fashion editorial, or dramatic fine art portraiture

**Do NOT use this skill when:**
- The user needs aperture, shutter speed, or ISO guidance -- use the `exposure-triangle` skill, which handles metering, reciprocity, and depth of field decisions
- The user needs compositional framing guidance -- use the `composition-guide` skill for rule of thirds, negative space, subject placement, and aspect ratio decisions
- The user needs color grading, retouching, or post-processing workflows -- use the `photo-editing-workflow` skill for skin tone correction, color grading, dodging and burning, or batch export
- The user is asking about optical physics of lenses (focal length compression, bokeh rendering, chromatic aberration) -- this is a lens selection problem, not a lighting problem
- The user needs videography lighting guidance -- motion picture lighting has different constraints (continuity, on-set scripting, camera movement) requiring a dedicated video lighting skill
- The user is asking about natural landscape or wildlife photography where artificial lighting is not applicable and the question is about reading ambient conditions

---

## Process

### Step 1 -- Gather Subject and Shoot Context

Before specifying a single light position, collect the following information. If the user has not provided these details, ask for them explicitly. Wrong assumptions at this stage cascade into an unusable setup.

- **Subject type:** Single person (portrait/headshot), beauty close-up (face only), group (2 people, 3-5 people, 6+ people), product with matte surface, product with reflective surface, packaged goods with multiple sides, food, architectural interior, or scene with multiple elements
- **Desired mood and contrast:** Dramatic high-contrast (noir, editorial, fine art), natural and approachable (corporate headshot, lifestyle), commercial-clean (catalog, e-commerce, white-background product), glamorous-beauty (fashion editorial, beauty campaign), or cinematic-moody (environmental portrait, character study)
- **Available light sources and count:** Studio monolights (plug-in strobes), pack-and-head studio strobe systems, speedlights/flashes (hot-shoe mounted), continuous LED panels (bi-color or RGB), continuous tungsten or HMI, natural window light, or reflectors/diffusers only
- **Shooting environment:** Dedicated studio with blackout (full control), home room (mixed ambient), outdoor (uncontrolled sun or shade), on-location office or retail space (mixed ambient from overhead fluorescents or windows)
- **Background type and color:** Seamless paper (white, grey, black, color), muslin backdrop, canvas, natural wall or environment, gradient board, or sweep table for products
- **Special constraints:** Budget limits, travel/location setup (must fit in a rolling bag), client or agency branding requirements (specific color temperature or mood), subject conditions (subject wears glasses requiring specific key angle, subject has very light or very dark skin requiring fill ratio adjustment)

### Step 2 -- Establish the Clock-Position Coordinate System

Every light position in this skill uses clock-position notation relative to the subject, with the camera always at 6 o'clock. This is non-negotiable -- all positions are described from a bird's-eye view looking down at the subject from above.

- **Camera:** Always 6 o'clock. This is the reference point for all other positions.
- **Directly behind the subject (backlight):** 12 o'clock
- **Subject's right side (camera left):** 3 o'clock
- **Subject's left side (camera right):** 9 o'clock
- **45 degrees right of camera:** 4-5 o'clock zone
- **45 degrees left of camera:** 7-8 o'clock zone
- **Height notation:** Always specify in relation to the subject's eye level. "45 degrees above eye level" means the light is positioned so that an imaginary line from the light to the subject makes a 45-degree downward angle -- this is the most common and flattering height for portrait key lights.
- **Distance notation:** Always specify in feet from the subject, not from the camera. Distance directly affects light falloff (inverse square law: doubling the distance quarters the light intensity).

When the user mentions "camera left" or "camera right," translate immediately to clock position before proceeding. Camera left = subject's right = 3 o'clock zone.

### Step 3 -- Select the Key Light: Position, Height, Modifier, and Pattern

The key light is the dominant, direction-defining light source. All other lights respond to it. Establish the key light completely before designing fill.

**Choosing the lighting pattern (portrait subjects):**

| Pattern | Key Position | Key Height | Defining Feature | Best For |
|---|---|---|---|---|
| Loop | 4 or 8 o'clock | 30-40 degrees above eye | Small loop shadow below nose | Most faces, corporate, natural looks |
| Rembrandt | 4-5 or 7-8 o'clock | 45 degrees above eye | Triangle of light on shadowed cheek | Character portraits, dramatic editorial |
| Butterfly / Paramount | 6 o'clock (directly over camera) | 45-60 degrees above eye | Butterfly shadow directly under nose | Glamour, beauty, fashion |
| Split | 3 or 9 o'clock | Eye level | Half the face lit, half in shadow | Moody, dramatic, masculine editorial |
| Flat | 6 o'clock | Eye level or just above | No directional shadow | Fashion, beauty, passport, e-commerce |
| Clamshell | 6 o'clock above + 6 o'clock below | Above: 45 degrees up / Below: 45 degrees up (aimed at face) | Fills under-eye shadows entirely | Beauty close-ups, skin-forward campaigns |
| Cross / Rim | 10-11 or 1-2 o'clock | Eye level to 30 degrees above | Subject lit from behind with rim of light | Silhouette separation, hair detail, dramatic scenes |

**Choosing the modifier (all subject types):**

| Modifier | Effective Light Quality | Catchlight Shape | Best Applications |
|---|---|---|---|
| Large softbox, 3x4 ft or larger | Very soft, wrapping, gentle falloff | Large rectangle | Beauty, portrait, even product |
| Octabox, 47-60 inch | Soft, nearly circular catchlight | Large circle | Portraits where circular catchlight is preferred |
| Small softbox, 12x18 to 24x24 inch | Moderately soft, more directional | Small rectangle | Headshots, product, editorial |
| Shoot-through umbrella, 43-60 inch | Broad, soft, scattered light | Large diffuse oval | Group shots, fill-the-room, travel setups |
| Reflective umbrella, 43-60 inch | Moderate softness, more specular than shoot-through | Medium oval | Portraits with more pop and contrast than softbox |
| Beauty dish, 16-22 inch | Contrasty soft with a bright specular center | Circular ring with center dot | Fashion editorial, beauty, makeup campaigns |
| Strip box, 12x36 inch or 12x48 inch | Narrow but soft -- great for rim/edge lighting | Thin rectangle | Hair lights, rim lights, product edge lighting |
| Grid (on softbox or as standalone) | Focused soft beam, prevents spill | Same as base modifier | Hair lights, accent lights in small studios |
| Snoot | Hard, narrow spot beam | Small point | Hair lights, background spots, dramatic accents |
| Bare reflector dish (7-inch standard) | Hard, high-contrast, sharp shadows | Small bright point | Background lighting, dramatic editorial, sun simulation |
| Parabolic reflector, 47+ inch | Very high-output directional, punchy contrast | Circular with bright center | Fashion editorial, large-studio looks, outdoor fill against sun |

**Key light distance and the inverse square law:**
- Placing a large softbox at 3 feet from the subject produces very soft, wrapping light with fast falloff
- Moving the same softbox to 6 feet doubles the distance, quarters the intensity, and makes the light harder and more directional
- For portrait work, 3-5 feet from subject to the face of the modifier is the standard zone for soft-key work
- For product photography on a small table, 18-30 inches from the product to the modifier face is typical
- For full-length fashion, the light must be moved farther (6-8 feet) to cover the full body -- account for this when setting power

### Step 4 -- Design the Fill Light and Establish the Lighting Ratio

The fill light controls how dark the shadow side becomes. The ratio between key and fill is the single most important variable for mood and contrast.

**Understanding the ratio system:**
- Ratios compare the total light hitting the highlight side of the face to the total light hitting the shadow side
- On the highlight side, both key and fill hit simultaneously; on the shadow side, only fill hits
- A 2:1 ratio means the lit side receives twice as much light as the shadow side -- this equals 1 stop difference
- A 3:1 ratio means 1.5 stops difference (roughly): natural, flattering, the most common commercial portrait ratio
- A 4:1 ratio means 2 stops difference: noticeably dramatic, shadows with visible detail
- An 8:1 ratio means 3 stops difference: deep, moody shadows with little or no detail -- noir/editorial only

**Practical ratios by mood:**

| Mood | Ratio | Stops Difference | Fill Method |
|---|---|---|---|
| Beauty / commercial skin | 2:1 | 1 stop | Large reflector or second light at 1 stop below key |
| Natural / approachable corporate | 3:1 | 1.5 stops | White reflector at 2-3 feet, or second light at 1.5 stops below key |
| Classic fine art portrait | 4:1 | 2 stops | Silver reflector at 3-4 feet, or second light at 2 stops below key |
| Dramatic editorial | 6:1 | ~2.5 stops | Small or distant reflector, minimal bounce |
| Noir / character study | 8:1+ | 3+ stops | No fill, or a tiny silver card at 4+ feet |

**Fill options ranked by control level:**
1. Second strobe or LED with independent power control -- highest precision, use a light meter to confirm ratio
2. V-flat (white foam board, 4x8 feet) -- broad, even fill; distance controls ratio (closer = more fill = lower ratio number)
3. 42-inch white reflector on a stand -- portable, produces approximately 2.5-3:1 ratio when placed 2 feet from subject
4. 42-inch silver reflector on a stand -- produces approximately 2:1 ratio at 2 feet, more specular
5. Gold reflector -- produces a warm-shifted fill approximately 2:1 -- use only for warm-toned shots or to complement warm ambient
6. Black card (negative fill / flag) -- placed on the shadow side to absorb any ambient bounce, increases contrast beyond what the key alone creates; useful when shooting in reflective white-walled rooms

**Fill placement rule:** Fill always goes on the opposite side of the key. If the key is at 4 o'clock, the fill is in the 7-8 o'clock zone. Fill should be at or slightly below eye level to avoid creating a secondary upward shadow.

### Step 5 -- Design the Background Lighting and Subject Separation

Background lighting is independent of the subject lighting. Its purpose is to control the tonal value of the background and to separate the subject from it visually.

**Background light options by desired look:**

| Look | Technique | Power Setting |
|---|---|---|
| Pure white background | Bare dish aimed at seamless from below-and-behind, 12 o'clock zone | 1.5-2 stops brighter than key light at the subject's position |
| Mid-grey from white backdrop | No background light -- let the seamless fall off naturally | N/A -- distance from subject to backdrop controls tone |
| Dark or black background | Move subject far from backdrop (10+ feet) and use no background light | No background light -- falloff makes white paper go grey or near-black |
| Gradient | Single light from one side (3 or 9 o'clock behind the subject), aimed at the backdrop | Adjust distance for gradient falloff intensity |
| Circular spot (vignette) | Snoot or grid on a strobe aimed at the center of the backdrop | 1 stop brighter than key for subtle glow; 2+ stops brighter for bold circle |
| Colored background with gel | Bare dish with a full-saturation gel aimed at the backdrop | Metered independently; 1:1 with key light power at the backdrop surface |

**Subject-background separation strategies:**
- **Hair / rim light:** Place a strobe with a grid or strip box at 10-11 o'clock or 1-2 o'clock, behind and above the subject, aimed at the edge of the shoulder and hair. This is the most reliable separation technique. Use a grid to prevent lens flare. Set it at approximately 1 stop above the key light (brighter than key) for a visible rim effect.
- **Natural separation via tone contrast:** Place a dark-haired subject against a light background, or light-haired subject against a grey or dark background. This eliminates the need for a hair light and simplifies the setup.
- **Natural separation via depth:** Moving the subject 6-10 feet from the background and opening the aperture (f/2.8-f/4) creates enough background blur that separation becomes an optical artifact, not a lighting requirement.

**The 3-foot background separation rule:** For controlled studio work on seamless paper, keep the subject at least 3 feet from the background to prevent the key and fill lights from spilling onto the backdrop and affecting its tone. For white backgrounds, this separation can be reduced to 18 inches if the background light is independently powered. For black or dark backgrounds, 8-10 feet of separation is needed to use falloff alone.

### Step 6 -- Determine Color Temperature and Gels

All light sources in a setup must match in color temperature, or the skin tones will shift in unexpected ways between the highlight and shadow sides of the face.

**Standard color temperatures:**
- Daylight-balanced studio strobes and flashes: 5500K (most standard monolight brands are calibrated here)
- Some high-end strobes: 5600K -- close enough to mix without gels
- Continuous daylight LED panels: typically 5600K
- Bi-color LED panels: adjustable 3200K-5600K; set all panels to the same value and confirm with a color meter or grey card test shot
- Tungsten continuous lights: 3200K -- very warm, golden tone
- HMI (professional cinema): 5600K
- Window light (midday clear sky): approximately 5500-6000K
- Window light (overcast): approximately 6500-7500K (noticeably blue)
- Window light (golden hour): approximately 2500-3500K (very warm)
- Office overhead fluorescents: approximately 3500-4500K (variable -- check the tube spec)

**Gel correction for mixed-light scenarios:**
- To warm a strobe to match tungsten ambient: apply a Full CTO (color temperature orange) gel -- shifts strobe from 5500K to approximately 3200K. Half CTO shifts to approximately 4100K.
- To cool a tungsten light to match strobes: apply a Full CTB (color temperature blue) gel.
- To match a strobe to green-shifted fluorescent ambient: apply a Plus Green gel to the strobe.
- To match a strobe to a warm fluorescent: apply a 1/4 CTO or 1/8 CTO.
- Gels affect exposure: Full CTO costs approximately 0.7 stops. Half CTO costs approximately 0.3 stops. Adjust power or aperture accordingly.

**Camera white balance strategy:**
- For a pure studio strobe setup: set camera WB to 5500K or use the "Flash" preset. Shoot in RAW to allow fine-tuning in post.
- For mixed natural and artificial light: decide which source is dominant (key light), then set WB to match it. Accept that the secondary source will be off-tone and correct in post, or gel it to match.
- Use a grey card or ColorChecker as the first frame of each setup to allow precise WB correction in post without guessing.

### Step 7 -- Produce the Complete Lighting Specification

Compile all decisions from steps 1-6 into the standardized output format below. The specification must be immediately actionable -- a photographer should be able to pick up this document and set up the shot without any further guidance.

Include:
- All light positions in clock notation
- Modifier for each light
- Relative power in stops (not percentages, which vary by unit)
- Key-to-fill ratio confirmed
- Background separation strategy
- Color temperature for all sources and camera WB setting
- A full setup checklist with verification steps
- A troubleshooting note for the two most likely problems with this specific setup

---

## Output Format

```
## Lighting Setup: [Subject/Scenario Name]

**Subject:** [specific description -- single person, seated, shoulders up / product on sweep / etc.]
**Mood / Look:** [dramatic | natural | commercial | editorial | beauty | glamorous]
**Lighting Pattern:** [loop | Rembrandt | butterfly | split | flat | clamshell | rim/cross]
**Light Count:** [number of powered sources] + [number of reflectors/flags]
**Environment:** [studio with blackout | home room | outdoor shade | on-location]

---

### Light Positions (Bird's-Eye View, Camera at 6 o'clock)

**Key Light**
- Position: [clock position, e.g., 4 o'clock]
- Height: [X degrees above eye level, e.g., 45 degrees above eye level]
- Distance: [X feet from subject]
- Source: [strobe | speedlight | LED panel | window]
- Modifier: [specific modifier, size, orientation if relevant]
- Starting Power: [relative power or guide number -- e.g., set to f/8 at ISO 100 using incident meter]

**Fill Light / Fill Source**
- Position: [clock position]
- Height: [at eye level | slightly below eye level]
- Distance: [X feet from subject]
- Source: [second strobe | white reflector | silver reflector | V-flat | window bounce]
- Key-to-Fill Ratio: [X:1] ([X stops difference])
- Note: [how to achieve this ratio with this specific fill method]

**Background Light** (if used)
- Position: [clock position, e.g., 12 o'clock low -- behind subject, aimed at backdrop]
- Source: [strobe | LED]
- Modifier: [bare dish | softbox | snoot + gel]
- Power Relative to Key: [X stops brighter than key at backdrop surface]
- Purpose: [pure white | gradient | tonal separation | colored accent]
- Gel: [color + name, e.g., full CTO for warm wash -- or "none"]

**Hair / Rim Light** (if used)
- Position: [clock position, e.g., 1 o'clock, behind and above subject]
- Height: [X degrees above eye level]
- Source: [strobe | LED | speedlight]
- Modifier: [grid | snoot | strip box with grid]
- Power Relative to Key: [X stops above key for visible rim | at key level for subtle edge]
- Flare Prevention: [grid angle confirmed not to point toward lens | gobo placed between light and lens]

**Flags / Negative Fill** (if used)
- Position: [clock position]
- Purpose: [block key spill from backdrop | increase shadow contrast on shadow side]

---

### Color Temperature

- Key light: [Kelvin value]
- Fill source: [Kelvin value | N/A if reflector]
- Background light: [Kelvin value | N/A]
- Hair/rim light: [Kelvin value | N/A]
- Gels applied: [list each gel, which light it is on, and its color-temperature effect]
- Camera white balance: [Kelvin value or preset name]
- White balance reference: [grey card in scene | ColorChecker | Custom WB from test shot]

---

### Power Summary (Relative to Key = 0)

| Light | Relative Power | Purpose |
|---|---|---|
| Key light | 0 (reference) | Primary illumination |
| Fill light / reflector | [--1 to --3 stops] | Shadow fill |
| Background light | [+1.5 to +2 stops vs. key at backdrop] | Background tone control |
| Hair / rim light | [+0 to +1 stops vs. key] | Edge separation |

---

### Setup Checklist

- [ ] Key light at correct clock position, height confirmed (measure angle or use posing to verify nose shadow)
- [ ] Modifier securely mounted, aimed at center of subject
- [ ] Fill source in position; ratio confirmed via test shot or incident meter reading both sides
- [ ] Background light aimed at backdrop center (or off-center for gradient); not spilling onto subject
- [ ] Hair/rim light aimed at subject's edge; grid or snoot confirmed to prevent lens flare (look through viewfinder with light on)
- [ ] All powered sources at identical color temperature; bi-color LEDs confirmed to same Kelvin value
- [ ] Camera white balance set; grey card or ColorChecker placed in first test frame
- [ ] Test shot taken at full power; review shadow edge on LCD (shadow should have clean, gradual falloff, not a hard cliff)
- [ ] Nose shadow check (portrait): shadow points down and does not cross the upper lip line
- [ ] Catchlight check (portrait): primary catchlight visible in iris at 10-11 o'clock or 1-2 o'clock position in the eye
- [ ] Background tone confirmed on histogram: [specific target, e.g., pure white = spike at far right, mid-grey = peak at center]
- [ ] Confirm no color cast from room walls bouncing onto subject (common in small rooms with colored walls)

---

### Troubleshooting Guide (Setup-Specific)

**Problem 1:** [Most likely problem for this specific setup]
- Cause: [specific cause]
- Fix: [specific corrective action]

**Problem 2:** [Second most likely problem]
- Cause: [specific cause]
- Fix: [specific corrective action]
```

---

## Rules

1. **Always use clock-position notation for every light.** Never describe a light position as "to the left" or "beside the subject" without a clock position. The camera is always at 6 o'clock. Left and right are ambiguous (camera left vs. subject left); clock positions are not.

2. **Always specify the key-to-fill ratio as both a ratio (e.g., 3:1) and a stop difference (e.g., 1.5 stops below key).** Ratios alone are opaque to photographers who think in stops. Stops alone are opaque to photographers who think in ratios. Always give both.

3. **Never specify modifier type without specifying modifier size.** A "softbox" is not a complete specification. A "3x4 foot softbox" or "24-inch softbox" is. Light quality is governed by the apparent source size relative to the subject, not by modifier type alone.

4. **Always specify key light distance in feet from the subject.** Distance is not optional information -- it directly controls both intensity (inverse square law) and light quality (apparent source size). "Nearby" and "close" are not specifications.

5. **Always specify hair and rim light flare prevention.** Every hair or rim light specification must include the grid size or snoot type and a note about confirming the light does not point toward the lens. A rim light without flare control is a common beginner error that destroys contrast and image quality.

6. **Never mix color temperatures without acknowledging the mismatch and specifying the correction strategy.** If the user is shooting in a room with daylight coming through windows and wants to add a tungsten continuous light, explicitly state the temperature conflict and recommend either gelling to match or separating the light zones.

7. **Product photography with reflective surfaces requires a fundamentally different approach -- flag and card positions matter as much as light positions.** Never give a standard portrait lighting setup for glass, metal, or jewelry. Always specify the use of large light sources through diffusion material and the placement of black flags to control reflections.

8. **Power levels must be described in relative stops from the key light (key = 0), not as percentages or dial positions.** "50% power" means different things on different units. "1 stop below key" is universally applicable and metered-verifiable.

9. **A setup checklist with test-shot verification is mandatory.** Every lighting specification ends with a checklist. The checklist must include at minimum: light position confirmation, ratio confirmation via test shot or meter, color temperature confirmation, and a nose shadow check (for portraits) or surface highlight check (for products).

10. **This skill produces pre-shoot specifications only -- no post-processing.** The lighting setup specification defines what exists in front of the camera. Any color grading, retouching, compositing, or tone adjustments belong to the `photo-editing-workflow` skill. Do not include post instructions in lighting output. The one exception is recommending grey card placement for WB correction -- that is a shoot-time action, not post-processing.

11. **Group photography (5+ subjects) requires lighting coverage analysis before modifier selection.** Before selecting a modifier for a group, calculate the spread needed: a 60-inch umbrella at 8 feet covers approximately a 6-foot horizontal spread at 50% evenness. If the group is wider than the light's coverage zone, use multiple lights or move the light further back and compensate with power.

12. **Never omit background light specification for white-background commercial work.** A white background that is not independently lit will go grey or off-white as the subject moves from the background. Always specify the background light power as a relative stop value measured at the backdrop surface, not at the subject position.

---

## Edge Cases

### Natural Light Only (No Studio Equipment)

When the user has no powered lights, the window becomes the key light and available materials become modifiers and fill.

- Treat the window as a large softbox. A large north-facing window on an overcast day is the equivalent of a 6x8 foot softbox -- extremely soft, diffuse, and flattering.
- Clock-position the window relative to the subject: if the subject faces the window, the window is at 6 o'clock (flat light). Rotating the subject so the window is at 4 o'clock creates loop lighting.
- Sheer curtains over a window reduce direct sunlight to diffuse light and lower the effective color temperature by roughly 300-500K warmer.
- Use white foam core boards (available at any art supply store, 20x30 or 30x40 inch) as reflectors. A white board at 2 feet from the shadow side of the face produces approximately a 3:1 ratio on a typical overcast window.
- For outdoor natural light: golden hour (30 minutes after sunrise or before sunset) gives a key light at a very low angle (equivalent to 3 or 9 o'clock at approximately 20-30 degrees above horizon) with warm 2500-3500K quality. This is a complete dramatic lighting setup with no equipment needed. Place the subject so the sun is at 4-5 o'clock position and use a white reflector at 8 o'clock for fill.
- Midday sun is a hard, nearly overhead key light (12 o'clock, 80-90 degrees above eye level). This creates unflattering downward shadows in eye sockets and under the nose. Solution: move subject into open shade (under an overhang or tree) where the open sky -- a giant soft source -- becomes the effective key light. The blue-shifted open sky (6500-7500K) needs a +1/4 to +1/2 CTO gel on any fill flash if flash is available, or must be corrected in post.

### Single Light Setup (One Strobe or Speedlight)

One powered source plus reflectors is a complete, professional-quality setup when executed correctly.

- The single strobe is always the key light. Choose the modifier carefully -- the modifier does the heavy lifting in a one-light setup.
- Place a white reflector (V-flat or 42-inch collapsible) directly opposite the key light. Distance from subject controls fill ratio: at 18 inches, a white reflector produces a 2:1 ratio; at 36 inches, approximately 3:1; at 5 feet, approximately 5:1.
- A silver reflector at 18 inches from the subject produces a near 2:1 ratio and can even produce catchlights in the eyes -- confirming it as a secondary source.
- For pure product photography with one light: position the light at 10-11 o'clock, 45 degrees above, and use a large white card opposite to fill the shadow side. This is a classic beauty-light-on-a-budget setup.
- On-location one-light portrait: mount a speedlight on a stand with a 24x24-inch softbox at 4 o'clock, 45 degrees above. Use a white foam board at 8 o'clock. This fits in a carry-on bag and produces professional results. Set the speedlight to 1/4 to 1/2 power for a typical f/5.6 at ISO 100, 1/200 second exposure.
- Do NOT attempt dramatic rim or hair lighting with one light -- there is no control over flare, and the subject's face will be underlit if the single light is placed behind.

### Reflective Product Photography (Glass, Jewelry, Metal, Ceramics)

Reflective products require an entirely different mental model. The product does not scatter light -- it mirrors it. Every highlight on a reflective product is a reflection of a specific light source or surface.

- The fundamental technique is "lighting the environment, not the product." Surround the product with large, evenly lit white surfaces (using a light tent, a sweep of white acrylic, or white cards on all sides). The product then reflects the white environment, producing clean, controlled highlights.
- For glass (bottles, glassware, perfume): backlight the product through a translucent white acrylic sweep or a large diffusion panel (3x3 feet minimum) placed behind and below the product. The front of the glass picks up the transmitted light and glows. Add a small black card flag in front, just outside the camera's view, to create a thin dark reflection on the front edge -- this defines the shape of the glass and prevents it from "disappearing" into the white background.
- For metal and jewelry: use two large softboxes (3x4 feet minimum) at 10 o'clock and 2 o'clock, aimed at white bounce cards rather than directly at the subject. Black card flags opposite each light create defining edge reflections. The ratio of black cards to white cards determines how many dark reflections (which reveal form) versus white reflections (which reveal surface quality) appear.
- For jewelry with gemstones: add a small, hard source (snoot or bare bulb) from directly above (12 o'clock, 90 degrees above) to create the "sparkle" or specular fire in faceted stones. This is a separate accent light, typically 2 stops brighter than the ambient environment lighting.
- Never use a small, direct softbox aimed at a reflective product -- the rectangular shape of the softbox will reflect clearly in the product surface and look like an equipment error.
- Always shoot on a surface that matches the intended presentation (white acrylic, black mirror tile, natural wood, etc.) -- the surface material appears in reflections and must be part of the lighting design.

### Group Photography (5+ Subjects)

Group photography has a single over-riding requirement: even illumination across all subjects. Dramatic ratios that look brilliant on one face look chaotic on a group.

- The maximum acceptable ratio for group portraits is 2:1 (1 stop). Any more and the subjects on the shadow side will be noticeably darker than those on the lit side.
- For groups of 5-8 people in a single row: use two large shoot-through umbrellas (60-inch minimum) at 4 o'clock and 8 o'clock symmetrically, both at 30 degrees above eye level. Each umbrella should be at least 6-8 feet from the nearest subject to allow the light to spread evenly across the group.
- For groups of 10+ people: a single key light creates a hotspot on subjects nearest to it and falloff on subjects farthest from it. The inverse square law means that a subject at 5 feet from a light receives 4x more light than a subject at 10 feet. Move the light to 12+ feet and compensate with power. Alternatively, use three lights across the full width of the group at equal distances.
- Background lighting for groups: use at least two background lights for groups wider than 6 feet. One light creates a gradient that makes the background tone uneven behind the group.
- Avoid dramatic patterns (Rembrandt, split) for groups. Flat or loop lighting is the only reliable choice.
- If any subject in the group wears glasses: position the key light higher (50-60 degrees above eye level). Glasses reflect any light source that appears in their reflection zone, which is directly opposite the camera axis at eye level. Higher key lights angle the reflection of the source upward and out of the frame.

### Outdoor Midday (Harsh Direct Sun)

Midday sun is the hardest, harshest light source a photographer will encounter -- equivalent to a bare bulb at 12 o'clock, 85 degrees above eye level. The shadows are dark, dense, and downward-pointing.

- **Option 1 -- Open shade:** Move the subject under a building overhang, beneath large trees, or into the shadow of a large reflective wall. The open sky becomes the effective key light: large, soft, directional. Set the subject so the brightest open sky is at 4-8 o'clock (from above) for the most flattering angle. The shadow fill is the reflected light from the ground and surroundings. No equipment needed.
- **Option 2 -- Diffusion panel:** Hold or mount a 6x6 foot diffusion panel (1-stop or 2-stop silk) directly above the subject. This converts the hard sun into a large, overhead soft source. A rim of natural sun around the panel's edges can create a natural-looking hair light. This requires a lighting assistant or a heavy stand.
- **Option 3 -- Fill flash:** Use a speedlight or battery-powered monolight as fill, pointed at the subject from the camera position (6 o'clock). Set the flash 1.5-2 stops below the ambient exposure of the subject's shadow side. The harsh sun becomes the key light; the flash lifts the shadow. This is the "dragging the shutter / high-speed sync" technique -- use HSS mode on the flash if the shutter speed needs to exceed 1/250 second in bright sun.
- **Option 4 -- Reflector as fill:** If flash is unavailable, a large silver reflector (48-inch or larger) held at the subject's fill-side position (opposite the sun) can lift shadow density by 1.5-2 stops, reducing a harsh 8:1 ratio to a more acceptable 4:1. The sun remains the hard key -- this is a dramatic, high-contrast look, not a soft one.
- Note for skin tones in midday sun: the color temperature of direct sun at 12pm clear sky is approximately 5500K -- clean and correct for strobes. Open shade reads 6500-7500K -- noticeably blue, especially on light skin and clothing. If shooting in shade, set camera WB to shade preset (approximately 7500K) or add a slight warming gel to any fill flash.

### Very Small Studio or Home Shooting Space (Under 12 Feet Deep)

Small spaces create specific problems: lights cannot be moved far enough from the subject, backgrounds cannot be separated from the subject, and room walls become uncontrolled fill sources.

- In a room smaller than 12x12 feet, white walls act as giant fill reflectors that inject light into every shadow. This flattens contrast even when the fill light is turned off or removed. Use black V-flats (foam board with black side facing the subject) on the shadow side of the subject to absorb wall bounce.
- To create a dark or black background in a small room: hang black muslin (not paper -- muslin absorbs more light) as close to the subject as possible and place the key light far to the side (3-4 o'clock range) to minimize spill on the backdrop. Use a grid on the key modifier to further reduce spill.
- For white seamless in a small space: the subject must be at least 3 feet from the backdrop but may not have room to accommodate a background light behind them at 12 o'clock. An alternative is to position the background light at 9 or 3 o'clock, aimed at the backdrop from the side, and accept a slight gradient.
- Ceiling height matters for key light angle: a standard 8-foot ceiling limits the maximum key light height. With a 6-foot subject and a ceiling at 8 feet, the maximum achievable key light angle is approximately 30-35 degrees above eye level -- this prevents a true Rembrandt triangle. Consider asking the subject to sit, which restores vertical space for proper key light angle.

### Clamshell Beauty Lighting (Two-Light Close-Coordination Setup)

Clamshell is a specialized beauty setup where a second light source placed below the subject's chin creates a fill that eliminates under-eye shadows and under-chin shadows entirely.

- **Top light (key):** Large octabox (47-60 inch) or large softbox at 6 o'clock, 45-60 degrees above eye level. This is the primary shaping light.
- **Bottom light (fill/clamshell):** A second large softbox or reflector panel placed below the camera at 6 o'clock, angled upward at 30-45 degrees, aimed directly at the underside of the chin and under-eye area. If using a second powered source, set it 1.5-2 stops below the top key. If using a reflector, a white or silver reflector rested on the subject's lap or on a table in front of them works extremely well.
- The defining visual signature of clamshell: nearly shadow-free under the chin and under the eyes, with a round catchlight at 12 o'clock (from top light) and 6 o'clock (from bottom fill) visible in the iris.
- Clamshell creates a very flat, shadow-minimal look. Add a hair light (strip box with grid at 1-2 o'clock, 60 degrees above) for dimension and subject separation.
- Warning: clamshell lighting aimed too aggressively upward from below creates the "interrogation" or "horror" shadow pattern (shadows above features, not below). The bottom source must be aimed at the underside of the chin, not at the forehead. Test by watching the nose shadow in real time: if the nose shadow points upward, tilt the bottom source further away from vertical.

---

## Example

**Input:** "I'm shooting perfume bottles for an e-commerce client. The bottles are dark glass with a metal cap and a rectangular shape. I need clean, white-background shots showing the bottle clearly with controlled highlights. I have two studio monolights, a large softbox, a small softbox, a set of black foam-core flags, and white bounce cards. Table-top setup."

**Output:**

## Lighting Setup: Perfume Bottle E-Commerce Product Photography

**Subject:** Dark glass perfume bottle with metal cap, approximately 6 inches tall, rectangular profile, table-top setup
**Mood / Look:** Commercial-clean, controlled highlights, white background
**Lighting Pattern:** Side-backlit product lighting with flagged indirect key (reflective surface technique)
**Light Count:** 2 powered monolights + white bounce cards + black foam-core flags
**Environment:** Table-top studio, white seamless sweep background

---

### Light Positions (Bird's-Eye View, Camera at 6 o'clock)

**Key Light (Indirect)**
- Position: 9-10 o'clock (camera right, slightly behind the bottle)
- Height: 30 degrees above the top of the bottle (aimed slightly downward at the white bounce card, NOT directly at the bottle)
- Distance: 18 inches from the bottle -- but aimed at the white bounce card placed at 9 o'clock, 6 inches from the bottle
- Source: Studio monolight
- Modifier: Large softbox (3x4 feet), horizontal orientation, placed so that its light hits the white bounce card rather than the bottle directly. The card becomes the effective light source.
- Starting Power: Set to achieve f/16 at ISO 100 at the bounce card surface -- the actual light reaching the bottle from the card will be 1-1.5 stops less
- Purpose: Creates a long vertical highlight running down the right edge and front face of the bottle. The soft rectangular card creates a smooth, defined highlight shape rather than the rectangular reflection of the softbox itself.

**Fill Source (Indirect)**
- Position: 2-3 o'clock (camera left, slightly in front of the bottle)
- Height: At bottle mid-height level, aimed at a second white bounce card at 3 o'clock, 6-8 inches from the bottle
- Source: Small softbox (24x24 inch) aimed at white bounce card
- Key-to-Fill Ratio: 3:1 (1.5 stops less than key), giving a definable shadow edge on the left side of the bottle that reveals the rectangular form without going fully dark
- Fill card distance: 8 inches from the bottle -- increase to 12 inches to reduce fill and increase drama; decrease to 4 inches for flatter, more even fill

**Background Light**
- Position: 12 o'clock low -- monolight placed behind and below the sweep, or positioned at 12 o'clock at table level aimed up at the vertical sweep behind the bottle
- Source: Studio monolight
- Modifier: Standard 7-inch bare reflector dish
- Power Relative to Key: +2 stops brighter than the key monolight's incident reading at the bottle surface -- this overexposes the background to pure white while the bottle remains correctly exposed
- Purpose: Creates a pure white background that reads as a spike on the far right of the histogram. The sweep creates the seamless transition from white background to white surface under the bottle.
- Gel: None

**Flags (Negative Fill)**
- Position 1: 6 o'clock, placed between the camera and the bottle on the camera-left side -- a 12x20-inch black foam-core card held just outside the frame, parallel to the bottle's left face
- Purpose: This black card reflects as a thin dark band on the left face of the bottle, defining the edge of the rectangular shape. Without this flag, the left face of a dark glass bottle "disappears" into the white background with no visible edge.
- Position 2: A second black card at 12 o'clock position (behind the bottle, just outside frame) prevents the background light from creating a specular flare on the bottle's top surface and metal cap.

**Hair / Rim Light:** Not applicable -- product photography. The background light serves as the separation source.

---

### Color Temperature

- Key monolight: 5500K
- Fill monolight: 5500K
- Background monolight: 5500K
- Gels applied: None -- all sources identical type
- Camera white balance: 5500K or Flash preset
- White balance reference: Place a grey card on the table surface in the first frame; confirm WB in post; remove for hero shots

---

### Power Summary (Relative to Key = 0)

| Light | Relative Power | Purpose |
|---|---|---|
| Key monolight (via bounce card) | 0 (reference) | Primary bottle highlight on right face |
| Fill monolight (via bounce card) | --1.5 stops | Gentle left-side fill, reveals bottle form |
| Background monolight | +2 stops (measured at backdrop surface) | Pure white background |
| Black card flag -- left edge | N/A (absorbs light) | Creates defining dark edge on bottle left face |
| Black card flag -- rear | N/A (absorbs light) | Prevents cap flare from background light |

---

### Setup Checklist

- [ ] White bounce cards positioned at 9 o'clock and 3 o'clock, confirmed that monolight faces are aimed at the cards not the bottle
- [ ] Both bounce cards at approximately the same height as the bottle's mid-point
- [ ] Key-side highlight verified as a smooth vertical band, not a hard rectangular reflection of the softbox (if softbox shape is visible, move the monolight further from the card and increase power)
- [ ] Left-side black flag positioned to create a thin dark band on the left face of the bottle -- this should be a 3-4mm dark line, not a large dark zone
- [ ] Rear black flag positioned to block background light from hitting the metal cap
- [ ] Background light confirmed to be pure white on histogram (spike hard against right wall) without affecting the bottle exposure
- [ ] Camera white balance set; grey card test frame taken
- [ ] Test shot reviewed at 100% crop: check that the bottle body shows a smooth highlight gradient from bright right to mid-tone left
- [ ] Check for "hot spot" reflections of the monolight or softbox in the metal cap -- if present, move the rear black flag higher or add a small flag directly above the cap
- [ ] Confirm the bottle's bottom edge is cleanly separated from the white sweep (adjust fill card angle if the base is going dark or clipping to pure black)
- [ ] Check that no light stands or cards are visible in the frame corners

---

### Troubleshooting Guide

**Problem 1:** The bottle looks flat -- no visible edge definition, both faces merge into white
- Cause: Insufficient negative fill. The white room or white bounce cards are reflecting light into all surfaces of the bottle equally, eliminating contrast.
- Fix: Move the black cards closer to the bottle. Ensure the left-side black card is within 4 inches of the bottle's left face. If the room walls are white, add additional black flags on both the 3 o'clock and 6 o'clock sides to block ambient bouncing. As a last resort, hang black muslin behind and beside the camera position to turn the camera zone into a dark, non-reflective environment.

**Problem 2:** The metal cap shows a bright, harsh rectangular reflection of the softbox
- Cause: The background light or the key monolight is at an angle that projects directly into the reflective cap surface, which acts like a mirror and shows the exact shape of the light source.
- Fix: First, raise the rear black card flag to shield the cap from the background light. Second, tilt the key monolight downward slightly so its angle of incidence on the cap reflects away from the camera lens rather than into it. Third, if the cap is a highly polished dome shape, tent the cap with a small piece of white diffusion material placed around -- but not touching -- the bottle neck, creating a soft white light environment the cap can reflect.
