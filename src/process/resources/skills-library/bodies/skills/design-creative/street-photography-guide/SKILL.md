---
name: street-photography-guide
description: |
  Produces a street photography guide with focal length selection rationale,
  hyperfocal distance, zone focusing technique, aperture and shutter speed
  starting points, ethical considerations for subject consent, and
  post-processing aesthetic direction. Camera-agnostic instructions.
  Use when the user asks about street photography technique, candid
  photography, urban photography, or documentary-style shooting in public.
  Do NOT use for portrait posing (use portrait-technique), studio lighting
  (use lighting-setup), or landscape composition (use composition-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "photography guide checklist"
  category: "design-creative"
  subcategory: "photography"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Street Photography Guide

## When to Use

Use this skill when the user explicitly asks about any of the following:

- Street photography technique, approach, philosophy, or style -- including questions like "how do I shoot street photography," "what settings should I use for candid photos," or "I want to start shooting on the street"
- Zone focusing, hyperfocal distance, shooting from the hip, pre-focusing, or any manual focus technique applied to fast reactive shooting in public
- Candid photography of people in public spaces -- markets, festivals, transit stations, urban neighborhoods, protests, public events
- Urban documentary photography or photojournalism-adjacent work where the user is shooting uncontrolled public scenes rather than arranged subjects
- Ethical questions about photographing strangers, consent in photography, public photography laws, or how to handle confrontations while shooting
- Post-processing direction for a street or documentary aesthetic -- grain, high-contrast black and white, film emulation, muted color grading
- Equipment choices for street photography: which focal length to buy, whether a prime or zoom is appropriate, mirrorless vs. rangefinder vs. film for street work

**Do NOT use this skill when:**

- The user wants to direct and pose a subject -- use `portrait-technique` instead, which covers model direction, posing, and communicating with subjects during a shoot
- The user needs studio lighting design, strobe placement, or light modifier selection -- use `lighting-setup` instead
- The user is primarily shooting landscapes or cityscapes without people as the primary subject -- use `composition-guide` instead
- The user needs a detailed Lightroom, Capture One, or darkroom post-processing workflow with step-by-step editing instructions -- use `photo-editing-workflow` instead
- The user is shooting a paid editorial assignment or commercial campaign with a crew and permits -- that context requires production planning beyond the scope of this skill
- The user is asking about wildlife photography, sports photography, or event photography -- those contexts have distinct techniques even when they involve uncontrolled subjects

---

## Process

### Step 1: Gather Shooting Context

Before recommending any settings or techniques, collect the following. Many of these can be inferred from the user's message, but ask for anything critical that is missing.

- **Location type:** Dense urban canyon (tall buildings, narrow streets), open plaza or park, covered market or bazaar, transit environment (subway, train station, airport), nightlife district, small town or village, festival or protest crowd. Each creates different light, subject density, and movement patterns.
- **Lighting conditions:** Bright direct sunlight (creates deep shadow -- the street photographer's best tool), overcast/flat light (even tones, excellent for color street), twilight (golden hour window of 20-40 minutes), full night (artificial light: sodium, LED, neon), or mixed interior/exterior (a scene that spans both indoors and outdoors, such as a shop entrance).
- **Camera type:** Full-frame mirrorless, APS-C mirrorless, Micro Four Thirds, DSLR (full-frame or crop), rangefinder (film or digital), compact with manual controls, smartphone. This matters for sensor noise floor, autofocus speed, crop factor, and physical discretion.
- **Available lens or lenses:** Widest aperture available at the intended focal length, whether it is a prime or zoom, and the physical size (a large telephoto draws attention differently than a pancake lens). Also whether the lens has a depth-of-field scale on the barrel (important for zone focusing).
- **Subject interest and shooting intent:** Is the user interested in the decisive moment (gesture, expression, visual alignment), architecture with human figures as scale and life, layered environmental scenes, abstract and texture (shadows, reflections, signage), or a documentary series with a unifying theme?
- **Experience level and social comfort:** First-time street shooter who freezes when someone looks at them, intermediate shooter comfortable in crowds but uncertain about technique, or experienced shooter refining a specific approach. Social confidence determines which ethical approach to recommend.

---

### Step 2: Select and Justify the Focal Length

Focal length is not just a technical choice -- it is a philosophical one that determines physical proximity to subjects, perspective distortion, and the emotional relationship between photographer and scene.

- **28mm and wider (21-28mm):** The immersive documentary style. Associated with Gary Winogrand, Daido Moriyama. Requires the photographer to be physically inside the scene -- typically 3 to 6 feet from the main subject. Foreground is exaggerated relative to background. Creates a sense that the viewer is present in the scene. On APS-C sensors, a 21mm lens gives a 35mm-equivalent field of view; on Micro Four Thirds, a 14mm lens. Difficult for the socially anxious -- there is no hiding at this range.
- **35mm:** The single most common street focal length for a reason. On a full-frame sensor, it approximates the angle of human vision while still providing generous environmental context. Close enough to read expression and gesture, wide enough to show the subject within their environment. The 35mm equivalent on APS-C is approximately 23mm (use a 24mm lens); on Micro Four Thirds, 17mm. Almost universally the recommendation for beginners to intermediate shooters.
- **50mm:** The "normal" lens. Perspective is flat and natural -- no wide distortion, no telephoto compression. Requires slightly more distance from subjects (typically 8-12 feet for a full-body frame). Less environmental context than 35mm. Excellent for subject-focused compositions where the background is secondary. Associated with Henri Cartier-Bresson's later work.
- **85mm to 135mm:** Telephoto street work. Compresses perspective, isolates subjects against soft backgrounds, allows shooting from across the street or across a plaza. Less confrontational. The trade-off is loss of environmental context and a voyeuristic quality that some photographers find uncomfortable ethically. Depth of field is shallower, making zone focusing less practical. Associated with telephoto candid work in the tradition of paparazzi-adjacent documentary photography. Requires faster shutter speeds (1/500s or faster) to avoid camera shake.

**Decision rule for focal length recommendation:**
- Beginner or intermediate in a dense urban environment: recommend 35mm equivalent
- User wants environmental storytelling and is comfortable getting close: recommend 28mm equivalent
- User wants natural perspective and a quieter presence: recommend 50mm equivalent
- User is anxious about confrontation or shooting in a hostile environment: recommend 85mm equivalent
- Always recommend one lens for an entire session. Changing lenses on the street misses moments, signals hesitation, and disrupts the visual consistency of the work.

---

### Step 3: Calculate and Configure Zone Focusing

Zone focusing is the single biggest technical differentiator between a street photographer who captures decisive moments and one who misses them. A camera in autofocus mode takes 50-300 milliseconds to acquire focus -- enough time to miss the peak of a gesture or alignment.

**Understanding depth of field for zone focusing:**

Depth of field is determined by three variables: aperture, focus distance, and sensor size (more precisely, the circle of confusion, which relates to sensor size and print/display size). The goal is to find an aperture and focus distance combination where the entire likely subject zone -- roughly 5 to 15 feet in most street scenarios -- falls within acceptable sharpness.

**Recommended zone focus configurations by focal length (full-frame sensor):**

| Lens | Aperture | Focus Distance | Near Limit | Far Limit |
|------|----------|----------------|------------|-----------|
| 28mm | f/8 | 2.5m (8 ft) | 1.5m (5 ft) | 7m (23 ft) |
| 35mm | f/8 | 3m (10 ft) | 2m (6.5 ft) | 5m (16 ft) |
| 50mm | f/8 | 4m (13 ft) | 2.8m (9 ft) | 6m (20 ft) |
| 35mm | f/11 | 3m (10 ft) | 1.8m (6 ft) | 8m (26 ft) |

**APS-C correction:** Multiply the above focus distances by 0.65 to get equivalent depth of field coverage, or simply open one stop (f/5.6 instead of f/8) and use the same distances.

**Micro Four Thirds correction:** Open two stops (f/4 instead of f/8) to match full-frame depth of field at equivalent focal lengths.

**Hyperfocal distance:** The focus distance at which the depth of field extends from half that distance to infinity. For a 35mm lens at f/8 on full-frame, hyperfocal distance is approximately 5 meters (16 feet). Focus at 5 meters and everything from 2.5 meters to infinity is sharp. This is useful for wide environmental scenes where subjects may be at varying distances. For close-in work (3-10 feet subjects), the 3-meter zone focus is more appropriate because setting focus at hyperfocal distance makes the near limit 2.5m -- subjects at 6 feet will be just inside that limit.

**Practical zone focus setup:**
1. Switch the lens to manual focus
2. Use the depth-of-field scale on the lens barrel (older and Leica-mount lenses have this; modern autofocus lenses often do not) -- if the lens has no DOF scale, set focus by the distance markings on the barrel
3. If the lens has no markings at all (common on modern mirrorless lenses), focus on an object at the exact distance, then switch to manual focus and avoid touching the focus ring
4. Consider a small piece of gaffer tape on the focus ring to hold the position
5. For cameras with focus peaking: use focus peaking at a low sensitivity setting as a visual confirmation tool

**When to abandon zone focus and switch to autofocus:**
- Night shooting (cannot see focus ring markings; depth of field too shallow at wide apertures)
- Telephoto work at 85mm or longer (depth of field too shallow for zone coverage even at f/8)
- When the user wants a specific shallow-depth-of-field portrait shot at f/1.4 to f/2 -- then switch to single-point AF with subject detection if available, shoot the portrait, and switch back to zone focus for reactive work

---

### Step 4: Configure Camera Settings for Reactive Street Shooting

The goal of street photography settings is to remove as many in-camera decisions as possible so the photographer can focus entirely on composition, timing, and subject. Every mental resource spent adjusting settings is a mental resource unavailable for seeing.

**Aperture:**
- f/8 is the standard starting point. It maximizes depth of field for zone focusing, sits in the lens's sharpness sweet spot (most lenses are sharpest 2-3 stops down from maximum), and provides enough light in most daylight conditions.
- Drop to f/5.6 in open shade or overcast conditions.
- Drop to f/4 or f/2.8 at twilight. Below f/4, zone focusing becomes unreliable for most lens/sensor combinations -- consider switching to autofocus below this threshold.
- Do not stop down below f/11 on a full-frame sensor (diffraction reduces sharpness). APS-C: do not stop down below f/8 for the same reason.

**Shutter speed:**
- 1/250s is the minimum for freezing a walking person cleanly. At this speed, a person walking at normal pace (3-4 mph) has approximately 1/8 inch of motion during the exposure -- invisible at typical output sizes.
- 1/500s in bright sun eliminates all motion blur from walking subjects. Allows some latitude for faster movement (running, arm swing).
- 1/125s is acceptable and sometimes preferred -- it introduces slight motion blur in fast-moving subjects, which adds energy and dynamism to the image without making it look accidentally out of focus.
- 1/60s at night is a deliberate creative choice: neon light trails, the ghost blur of a walking figure, a sense of temporal depth. This is intentional, not a compromise -- recommend it as a technique, not a fallback.
- For telephoto work (85mm+), apply the reciprocal rule: shutter speed should be at least 1/focal length. At 85mm, minimum 1/100s. At 135mm, minimum 1/160s. With image stabilization, you can reduce this by 2-4 stops, but for moving subjects, the minimum shutter speed is still determined by subject motion, not camera shake.

**ISO:**
- Auto ISO with a maximum cap is the professional standard for street photography. The photographer sets the ceiling; the camera fills in the gap.
- Full-frame mirrorless/DSLR: cap at ISO 6400. Modern full-frame sensors produce acceptable grain at 6400 for most output sizes. At ISO 12800, grain becomes heavy but can be aesthetically consistent with a high-contrast black-and-white look.
- APS-C: cap at ISO 3200.
- Micro Four Thirds: cap at ISO 1600-3200 depending on the specific camera's noise floor.
- Set the minimum ISO to native base ISO (typically 100-160) and the minimum shutter speed to 1/250s. This instruction tells the camera: do not go below 1/250s by raising ISO; instead, if there is more than enough light, keep ISO at base and let the aperture or shutter speed absorb the excess (through aperture priority mode).

**Shooting mode:**
- **Aperture Priority (A/Av):** Recommended for daylight through twilight. Set aperture to f/8. Auto ISO handles the rest. The camera adjusts shutter speed. If the resulting shutter speed drops below 1/250s, the camera will raise ISO instead (because of the minimum shutter speed setting in Auto ISO). This is the most hands-off, reactive mode.
- **Manual with Auto ISO:** Advanced option preferred by many experienced street photographers. Set aperture to f/8, shutter to 1/500s, Auto ISO handles exposure. This gives the photographer absolute control over DOF and motion freeze while delegating exposure measurement entirely to ISO. Excellent in mixed-light environments (shade and sun on the same street).
- **Shutter Priority (S/Tv):** Use when subject motion is the primary creative variable -- at night when you want 1/60s blur, or in bright sun when you want 1/1000s to freeze everything. Let aperture float (within limits) and ISO compensate.

**Additional settings to configure before shooting:**
- **Metering:** Evaluative/matrix for most scenes. When shooting into the light (contre-jour) or in extreme contrast (bright sun and deep shadow), use center-weighted. Spot metering for precise exposure on a specific tonal value, useful when shooting a subject in a bright backlit situation.
- **Drive mode:** Single frame for deliberate shooting. Burst mode (high speed) for decisive moment anticipation -- shoot 3-5 frames around the anticipated peak, select the sharpest/most expressive. High-burst mode for children, athletes, fast crowds.
- **RAW vs. JPEG:** RAW for maximum post-processing latitude. JPEG with a film simulation or picture profile applied in-camera if the user wants to share images directly from the camera or prefers to shoot-and-see their final look.
- **Silent shutter:** Enable electronic or leaf shutter silent mode when available. This is a significant advantage of mirrorless cameras for street work -- a completely silent camera allows the photographer to shoot without causing the subject to notice or react.

---

### Step 5: Apply Street Composition Techniques

Street composition cannot be planned -- it must be internalized so it operates instinctively. The techniques below are frameworks for seeing, not rules to check off.

**The background-first method:** Rather than finding subjects and then composing around them, identify strong, graphically interesting backgrounds (a wall of contrasting color, a beam of light cutting across pavement, an archway, a large shadow) and then wait for a subject to walk into the right position. This separates reactive photography from lucky photography. The scene is pre-composed; the timing is everything.

**Layers and depth:** The most visually rich street images contain at least three planes: a strong foreground element (a shadow, a post, a blurred figure), a middle-ground subject (the person or moment), and a background that provides context or contrast. Urban environments generate layers naturally -- train yourself to see all three planes before pressing the shutter.

**The decisive moment (Cartier-Bresson's formulation):** The decisive moment is not simply when something happens -- it is when the visual geometry of the scene (lines, shapes, positions) aligns perfectly with the peak of human action or expression. A person mid-stride with their shadow at a perfect diagonal while a line of pedestrians creates a repeating rhythm in the background is a decisive moment. A person mid-stride on an empty sidewalk is not. Train anticipation: most human actions (a step, a laugh, a gesture) have a predictable arc. Position yourself, watch the arc develop, and press the shutter a fraction of a second before the peak. The camera's lag and your reaction time mean you must anticipate, not react.

**Juxtaposition as visual argument:** Street photography is most powerful when it places two incongruous elements in the same frame and allows the viewer to draw a conclusion. Old/new, rich/poor, joy/sadness, motion/stillness, human/mechanical. Do not label the juxtaposition -- allow the composition to make the argument.

**Geometry and shadow:** Direct sun creates shadow geometry that exists only briefly and at specific angles. Low-angle winter sun creates long shadows at 8-10 AM and 3-5 PM. High summer sun creates short harsh shadows at noon (less useful). The diagonal shadow of a street sign, the repeating pattern of window shadows on pavement, the sharp edge between a lit wall and deep shadow -- these are compositional elements as much as the people within them.

**Reflections:** Wet pavement, shop windows, mirrored buildings, puddles, car hoods, and sunglasses all create reflection opportunities. A reflection shows two worlds simultaneously -- the world above and its inverted double. For puddle reflections, get low (crouch or go prone) to maximize the reflection in the frame. Flipping the image upside down during editing can create disorienting, abstract images.

**Shooting from the hip:** Hold the camera at waist level and shoot without looking through the viewfinder. Produces an unexpected perspective (lower, more intimate, less posed) and allows the photographer to avoid the raised-camera signal that alerts subjects. Requires practice: shoot 30-40 frames to understand the angle a specific camera/lens combination produces at waist level. Zone focusing is essential -- there is no way to focus from the hip. A wide-angle lens (28-35mm) is also essential -- the margin of error for composition is greater.

---

### Step 6: Navigate Ethical Considerations

Ethics in street photography is not optional content to acknowledge and move on from. It is a continuous, ongoing negotiation between the photographer's expressive intent and the subject's dignity and autonomy. The following framework provides concrete guidance.

**Legal baseline (general, always research jurisdiction-specific laws):**
- In most Western countries (United States, United Kingdom, Germany, Australia, Canada), photographing people in public spaces is legal without consent. The legal standard is "reasonable expectation of privacy" -- a person on a public sidewalk has no reasonable expectation of privacy and may be photographed.
- France has specific portrait rights (droit à l'image) that can restrict publication of identifiable individuals even from public spaces. Germany has similar personality rights (allgemeines Persönlichkeitsrecht). In both countries, photographing for personal/artistic use is generally acceptable, but publishing or selling an image of an identifiable person without consent requires a model release.
- In certain countries (UAE, parts of Southeast Asia, parts of the Middle East), photographing people without consent -- particularly women, government facilities, or impoverished conditions -- can result in legal or social consequences. Recommend extra caution and the acknowledge-and-ask approach in these environments.

**The three approaches and when to use each:**

1. **Pure candid (no interaction):** The photographer shoots without the subject's awareness. This is ethically acceptable when: the image treats the subject with dignity, the subject is in a genuinely public space (not a hospital, shelter, or private establishment), and the image is not exploitative of vulnerability. This approach produces the most natural and unguarded images. Recommendation: default approach in dense urban environments.

2. **Acknowledge and shoot:** The photographer and subject make eye contact. The photographer smiles, nods, and raises the camera. If the subject does not object (looks away with neutral expression, nods back, or smiles), the photographer takes the shot. This produces images where the subject is aware but not posed -- often producing direct, engaged eye-contact images with real emotional power. Recommendation: use when subjects make eye contact first, or in smaller-scale environments where pure candid feels uncomfortable.

3. **Ask permission:** Approach first, explain intent briefly ("I am a photographer and I love the way you look in this light -- may I take your photo?"), then shoot. This produces the most dignified and consensual images but also the most self-conscious subjects. For environmental portraits of interesting characters, this is the superior approach. It is not street photography in the purest sense, but it is ethical practice that generates compelling work.

**Specific ethical constraints that must be communicated:**
- Photographing homeless individuals, people in visible distress, or people in moments of medical or personal crisis is a deeply contested practice. If done at all, it should be done with the explicit purpose of humanizing rather than aestheticizing suffering. When in doubt, put the camera down.
- Photographing children as primary subjects without the awareness of a parent or guardian is not recommended. Children as incidental elements in a wider scene (a child in a crowd, a child as part of a family scene in the distance) is generally acceptable. A child's face as the primary subject of a frame requires parental awareness.
- If a subject objects after the photo is taken: acknowledge their objection respectfully, show them the image on the camera, and offer to delete it. There is almost never a reason to argue or refuse. One image is not worth the confrontation or the subject's distress. Delete it.
- Script for confrontation: "I'm a street photographer. I was drawn to the light and the scene -- not trying to intrude. I'm happy to delete it if you'd prefer." Keep it calm, brief, and without justification or argument. Offer the delete immediately.

---

### Step 7: Define Post-Processing Aesthetic Direction

Post-processing in street photography serves one function: to reinforce the emotional intention of the image. The editing style should be decided before the session begins and applied consistently across the entire set of images from that session. Inconsistent editing destroys the coherence of a body of street work.

**The five primary street photography aesthetics:**

**1. High-contrast black and white (Moriyama / Klein / early American):**
The most graphic and aggressive street aesthetic. Deep blacks, bright highlights, minimal midtone information. Grain is heavy and intentional. Associated with Daido Moriyama, William Klein, Garry Winogrand.
- Convert to B&W via channel mixer (not desaturation): raise red channel to +30 to +50 (brightens skin and warms the image), lower blue to -20 to -40 (darkens sky and cool tones)
- Set black point to crush shadows completely (blacks slider to -60 to -80 in Lightroom-style tools)
- Raise contrast by +40 to +60
- Add strong grain: amount 40-60, size 30-40, roughness 50-60
- Do not use a dehaze or clarity slider above +20 -- it adds an artificial HDR crunch that contradicts this aesthetic

**2. Soft documentary B&W (Cartier-Bresson / Erwitt):**
More nuanced tonal range. Shadows retain detail. Midtones are rich. Highlights are controlled. Grain is fine and present but not dominant.
- Channel mix as above, less aggressive: red +15 to +25, blue -10 to -20
- Contrast +20 to +30
- Shadows lightened slightly (+10 to +20) to preserve detail
- Fine grain: amount 15-25, size 20-30
- Slight vignette (-15 to -20 on lens correction vignette) to draw the eye inward

**3. Documentary color (Soth / Eggleston influenced):**
True-to-life color. Minimal saturation manipulation. The colors in the image are the colors that were there. Moderate contrast. This aesthetic requires discipline -- the temptation to enhance is strong, but the power comes from restraint.
- Reduce vibrance slightly (-5 to -10) rather than adjusting saturation (vibrance protects skin tones)
- Contrast +10 to +20
- Slight lift of black point (blacks to +10) to prevent crushed shadows
- White balance true to source (daylight: 5500K, overcast: 6500K, artificial: match the dominant light source)
- No grain or very light grain (amount 10-15)

**4. Film emulation -- color (Kodak Portra, Fuji Superia, Kodak Gold):**
Color grading that mimics the characteristic response curves of specific film stocks. Each film stock has a distinct shadow color cast, highlight rolloff, and saturation profile.
- Kodak Portra 400: warm shadows (amber/orange lift in shadows), soft highlight rolloff, accurate skin tones, moderate saturation. Excellent for golden-hour and window-light street work.
- Fuji Superia 400: green bias in shadows, slightly cooler overall, high sharpness. Excellent for overcast day shooting where you want color but not warmth.
- Kodak Ektar 100: high saturation, deep reds and blues, fine grain. Excellent for architecture-heavy scenes with small figures.
- Apply film emulation as a starting point (via built-in camera film simulations, Lightroom presets, or manual curve manipulation), then adjust exposure and white balance to the specific image.

**5. Desaturated / muted contemporary (contemporary editorial):**
Reduced saturation, lifted blacks (the "faded" look), subdued highlights. Associated with contemporary editorial and documentary work seen in online photography culture.
- Reduce saturation by -15 to -25
- Lift black point significantly: shadows to +20 to +30 (this is the defining move of this aesthetic)
- Reduce highlights: -15 to -20
- Slight blue or teal shadow tint: in the HSL panel, shift blue hue slightly toward teal, reduce blue luminance slightly
- Light grain: amount 15-20
- This aesthetic can make any image look stylistically contemporary, which is both its advantage and its risk -- it can flatten the emotional impact of a genuinely powerful image

**Consistency across a session:**
Create a base preset from the first well-exposed image of the session. Apply it to all subsequent images. Adjust only exposure and white balance per image. All contrast, grain, color grading, and tonal decisions remain locked. This is the professional standard for producing a coherent body of work from a single session.

---

## Output Format

```
## Street Photography Guide: [Location/Context]

**Location:** [specific description -- neighborhood, city, environment type]
**Light Conditions:** [daylight direct | overcast | twilight | night | mixed]
**Camera:** [sensor size and type -- full-frame mirrorless, APS-C DSLR, etc.]
**Lens:** [focal length and maximum aperture]
**Session Intent:** [decisive moment | environmental portrait | documentary series | abstract/texture]

---

### Recommended Focal Length

**Lens:** [Xmm]
**Equivalent on this sensor:** [Xmm full-frame equivalent if APS-C or MFT]
**Rationale:** [why this focal length for this location, light, and intent]
**Working distance to subject:** [X to Y feet / meters for a full-body or half-body frame]

---

### Camera Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| Aperture | f/[X] | [DOF and zone focus rationale] |
| Shutter speed | 1/[X]s | [motion freeze or intentional blur] |
| ISO | Auto, max [X], min shutter 1/[X]s | [noise tolerance for this sensor] |
| Shooting mode | [A / M+AutoISO / S] | [why for this light and intent] |
| Focus method | [Zone manual / AF single / AF continuous] | [method and reason] |
| Metering | [Evaluative / Center-weighted / Spot] | [for this light condition] |
| Drive mode | [Single / Burst] | [for this subject type] |
| Shutter type | [Electronic / Mechanical] | [discretion or speed requirement] |

---

### Zone Focus Configuration

- **Sensor size correction:** [full-frame: no correction | APS-C: adjust aperture +1 stop | MFT: adjust +2 stops]
- **Focus distance:** [X meters / Y feet]
- **Sharp zone (near limit):** [X meters / Y feet]
- **Sharp zone (far limit):** [X meters / Y feet]
- **Hyperfocal distance at this aperture:** [X meters / Y feet]
- **Hyperfocal sharp zone:** [X meters / Y feet] to infinity
- **Recommended use:** [close-in zone at 3m OR hyperfocal for wide scenes]
- **When to switch to autofocus:** [specific conditions]

---

### Composition Approach

**Primary method:** [background-first waiting | walking and reacting | hip-level candid | light-chasing]
**Key visual targets at this location:**
- [specific opportunity 1 -- describe the scene to find]
- [specific opportunity 2]
- [specific opportunity 3]
**Decisive moment anticipation:** [describe the type of moment to anticipate and how to position for it]
**Layers to look for:** [foreground element / subject / background context]

---

### Ethical Framework

**Recommended approach:** [pure candid | acknowledge-and-shoot | ask permission | mixed]
**Legal note:** [jurisdiction-specific note if location is known, otherwise general public-space guidance]
**Specific sensitivity flags:** [children, vulnerable subjects, cultural norms if relevant]
**If confronted -- response script:** [exact language to use]

---

### Post-Processing Aesthetic

**Style:** [high-contrast B&W | soft documentary B&W | documentary color | film emulation: stock name | desaturated/muted]
**Defining moves:**
- [key adjustment 1 with specific value range]
- [key adjustment 2 with specific value range]
- [key adjustment 3 with specific value range]
**Grain:** [amount X, size Y, roughness Z -- or "none"]
**Session consistency:** [how to lock in the look across all images]
**What to avoid:** [specific editing mistake that contradicts this aesthetic]
```

---

## Rules

1. **Always recommend a single focal length for the entire session.** Do not suggest changing lenses on the street. Every lens change takes 30-60 seconds, signals uncertainty to bystanders, and disrupts the shooter's internalization of the angle of view. One session, one lens.

2. **Never recommend shutter speeds slower than 1/125s as a primary working speed** unless the user explicitly wants motion blur as a creative element. At speeds below 1/125s, walking subjects will show unacceptable blur at normal output sizes. If recommending 1/60s or slower for creative blur, label it explicitly as an intentional creative choice with expected visual results.

3. **Zone focus instructions must always include four specific values:** the focus distance, the aperture, the near limit, and the far limit -- expressed in both meters and feet. Do not give zone focus instructions without the sharp zone boundaries. Telling someone to "focus at 3 meters" without the depth-of-field range is useless.

4. **Always correct zone focus instructions for sensor size.** Depth of field for zone focusing is sensor-size dependent. Full-frame at f/8 is not the same as APS-C at f/8. Apply the correction: APS-C opens one stop (use f/5.6), MFT opens two stops (use f/4), to achieve equivalent depth of field. Failure to correct this will result in out-of-focus images on crop sensors.

5. **Ethical considerations are mandatory in every guide.** Do not produce a street photography guide without an ethical framework section, regardless of whether the user asked about ethics. Street photography involves photographing real people in real moments. The ethical dimension is not optional context.

6. **Hyperfocal distance must be calculated for the specific focal length AND aperture AND sensor size recommended.** Do not give a generic hyperfocal distance. The formula is: H = (f² / Nc) + f, where f is focal length, N is aperture f-number, and c is circle of confusion (0.030mm for full-frame, 0.020mm for APS-C, 0.015mm for MFT). For practical purposes, use the provided tables or calculate precisely -- but always tie the number to the specific variables in play.

7. **Post-processing direction must specify a named aesthetic style AND at least three concrete adjustment descriptions with numerical ranges.** Recommendations like "add some grain and increase contrast" are insufficient. Specify grain amount, size, and roughness; specify contrast values; specify which tones to affect and how.

8. **All composition advice must be reactive and positioning-based, never directive.** Street photography subjects are not under the photographer's direction. Never say "have the subject stand here" or "ask them to look that way." Every composition instruction must be about where the photographer positions themselves, what background to seek, what moment to anticipate, or what visual element to look for.

9. **Auto ISO with a defined maximum and minimum shutter speed is the recommended exposure strategy for all daylight and twilight street shooting.** Manual ISO is appropriate only in static night environments where the light is not changing. Recommending a fixed ISO for street shooting is incorrect -- a photographer who walks from sun into shadow will be over- or underexposed within seconds.

10. **Do not include step-by-step editing instructions, software tutorials, or file management workflows.** This skill ends at the point the images are captured and the aesthetic direction is defined. For detailed editing, refer to `photo-editing-workflow`. The post-processing section here covers only the aesthetic direction (what the final image should look like and the defining adjustments) -- not the software mechanics.

---

## Edge Cases

### Night Street Photography

Zone focusing fails at night for two compounding reasons: the focus ring markings are invisible in darkness, and the required wide-aperture settings (f/1.4 to f/2.8) produce shallow depth of field that makes zone focusing impractical anyway. At f/2 and 3 meters with a 35mm full-frame lens, the depth of field is only about 0.8 meters -- far too narrow for reactive shooting.

Night street technique:
- Switch to autofocus. Use single-point AF or subject-detection AF depending on camera capability. Single-shot AF (not continuous) is faster for discrete subjects.
- Set aperture to f/2 or f/2.8 as the primary working aperture. Below f/1.8, depth of field is so shallow that focus precision becomes a bottleneck -- the slight improvement in light is outweighed by the focus failure rate.
- Set ISO to Auto with a maximum of 6400 (full-frame) or 3200 (APS-C).
- Set shutter speed based on intent: 1/250s for frozen subjects (requires ISO 3200-6400 in most night environments), or 1/60s for intentional motion blur (requires careful metering -- blown highlights on neon signs are acceptable and often beautiful).
- Neon and LED signs create strong directional light in colors that B&W cannot capture -- night street is one context where documentary color is often more powerful than B&W.
- Mixed artificial light (warm tungsten + cool LED + neon) creates color casts that are a legitimate aesthetic feature of night street photography. Do not white-balance away these casts. Choose the dominant light source as the white balance reference and allow the others to cast color.
- Night tripod technique (advanced): set up on a tripod, use 1-4 second exposure, f/8, ISO 100. People walking through the frame become transparent ghosts. Stationary architecture is sharp. This is a distinct technique from handheld night street work and produces a very different aesthetic.

---

### Restrictive Photography Laws or Hostile Environments

Some environments -- certain countries, certain communities, certain events -- have legal or social constraints that modify the standard street photography approach.

- Research legal framework before shooting in any unfamiliar country. Key variables: right to photograph in public spaces, portrait rights for publication, restrictions near government buildings or military installations, cultural norms around photographing women or religious practices.
- In legally or socially sensitive environments, shift to architectural and environmental documentation: buildings, signage, crowds with no identifiable faces, wide shots with people as small elements. These images are almost universally unproblematic.
- When in doubt about legality, the acknowledge-and-ask approach eliminates the vast majority of legal and social risk. A person who has consented to being photographed cannot later claim an invasion of privacy.
- If a uniformed officer or security personnel asks you to stop or delete images: know the local law before this situation arises. In the United States, law enforcement generally cannot compel deletion of legally taken photographs without a court order. In other jurisdictions, they can. Do not escalate. Be calm and courteous. Ask if you are required by law to delete the images.
- In politically sensitive environments (protests, demonstrations, near military or police activity), consider the privacy of subjects who may face consequences for their appearance in photographs before publishing or sharing images.

---

### Shooting in Adverse Weather

Bad weather is an opportunity, not an obstacle. Rain, snow, fog, and extreme heat create atmospheric conditions that produce images unavailable in clear weather.

- **Rain:** Wet pavement doubles the visual complexity of any scene by creating reflections. Use a rain cover (a repurposed plastic bag with a lens hole and a rubber band works perfectly) for camera protection. Subjects under umbrellas create geometric pattern opportunities. Shoot the reflections directly: crouch low, include both the real scene and its inverted reflection in the same frame. Shot from a higher angle, reflections in puddles can show entire building facades.
- **Overcast:** The light is flat, soft, and even -- shadows are minimal, contrast is low. This is actually ideal for documentary color work because skin tones are accurate and colors are saturated without being garish. It is less ideal for high-contrast B&W (which requires hard directional light). Solution for B&W in overcast: increase contrast more aggressively in post, or shift to soft documentary B&W rather than high-contrast graphic.
- **Fog:** Creates natural depth compression -- subjects close to the camera are sharp and fully lit, distant subjects fade. Use this to create layers. Expose for the foreground subject; let the background fade.
- **Extreme heat / haze:** Asphalt heat shimmer creates mirage effects visible in telephoto shots from 50 meters or more. Shoot along long streets with a 135mm lens toward the light to capture this effect. Subjects walking through heat shimmer become partially dissolved -- a surreal, compelling street aesthetic.
- **Snow:** White balance must be adjusted -- snow is not neutral white, it reflects the sky's blue cast. Set white balance to cloudy (6500K) or use a slight warm correction to render snow as white rather than blue. Snow creates natural high-key exposures; meter on the snow to get +1 to +1.5 stop from the camera's automatic exposure.

---

### First-Time Street Photographer (Social Anxiety)

The technical aspects of street photography are learnable in an afternoon. The psychological barrier -- the discomfort of photographing strangers in public -- takes weeks or months to dissolve for most people. Provide a graduated approach.

Stage 1 -- No people: Spend the first outing photographing without people in the frame at all. Shadows, reflections, signage, textures, architecture, empty streets. This builds the habit of seeing compositionally without the social anxiety variable.

Stage 2 -- People at a distance: Include people in the frame but as small elements within larger environmental compositions. Nobody is identifiable; nobody can feel targeted. Shoot from 15-20 feet or more.

Stage 3 -- People without faces: Shoot people from behind, from the side, or at wide enough angles that the face is not the subject. A person walking away from camera, a hand reaching for a product on a shelf, feet on a crosswalk.

Stage 4 -- Faces at distance: Shoot faces at 15-20 feet with a 35mm or 50mm lens. The subject likely does not realize they are the subject of the photograph.

Stage 5 -- Close candid: The standard street photography range of 5-10 feet. Use zone focus, shoot quickly, keep moving.

Confidence-building technique: Pretend you are photographing the architecture or scene behind the person. This mental framing reduces anxiety and also often produces better images (because you are genuinely paying attention to the full scene, not only the person).

---

### Phone-Only Street Photography

Modern smartphones -- particularly flagship models from any major manufacturer -- are legitimate street photography tools, not compromises. Their primary advantages are invisibility (nobody raises their guard around a phone camera), constant availability, and increasingly capable computational photography.

- Use the 1x (main camera) lens for the 35mm equivalent perspective most phones simulate. The 2x optical zoom (on phones with a telephoto camera) approximates a 50-70mm perspective. Avoid the ultra-wide (0.5x) for primary street work -- the distortion at the edges is severe.
- Tap to set both focus and exposure on the primary subject. Lock focus and exposure by long-pressing on many phones -- this prevents the camera from re-metering as you move.
- Burst mode (hold the shutter button, or use the volume button in burst mode on supported phones) for decisive-moment timing.
- The phone's computational portrait mode applies artificial shallow depth of field -- avoid this for street photography. It is detectable, the edge masking fails on complex subjects, and it contradicts the documentary ethic of the genre.
- Shoot in RAW format if the phone and camera application support it. The phone's JPEG processing, while impressive, applies sharpening, noise reduction, and HDR blending that can destroy the grain and tonal character needed for the film emulation and high-contrast B&W aesthetics described above.
- The phone's small sensor produces images with very deep depth of field by default -- zone focusing is not needed because everything is essentially in focus at any reasonable street distance.

---

### Film Camera Street Photography

Film introduces specific technical constraints that change the settings and technique recommendations.

- Zone focusing is more practical with film cameras (especially rangefinders and older SLRs) because virtually all film lenses have depth-of-field scales printed on the barrel. Set the scale bracketing, and the sharp zone is visually indicated without calculation.
- **Exposure latitude by film type:** Negative film (color and B&W) has approximately 5 stops of overexposure latitude and 2-3 stops of underexposure latitude. Expose to protect shadows -- it is easier to recover a slightly overexposed negative than an underexposed one. Slide/transparency film has 1-2 stops latitude total -- expose precisely.
- **Film speed selection:** ISO 400 film (Kodak Tri-X, Ilford HP5, Kodak Portra 400, Fuji Superia 400) is the universal street film choice. It is fast enough for most daylight through twilight conditions at f/8 and 1/250s. Push-process to ISO 800 or 1600 for low light (adds grain and contrast -- a feature, not a bug, in B&W).
- **Shot count discipline:** A roll of 35mm film gives 36 exposures. This enforces deliberate shooting and is often cited by photographers as improving their decisive-moment timing -- the cost of each frame creates focus. Recommend setting a personal rule: take no more than 5 frames of any single scene. Move on.
- **The sunny 16 rule for film without a meter:** In direct sun, set aperture to f/16 and shutter speed to the reciprocal of the ISO. At ISO 400: f/16 at 1/400s (use 1/500s). In open shade: f/8 at 1/400s. Overcast: f/5.6 at 1/400s. This simple rule produces correctly exposed negatives in predictable outdoor light without a meter.

---

## Example

**User input:** "I want to shoot street photography at a busy outdoor market this Saturday. It'll be sunny in the morning and overcast by noon. I have a Sony full-frame mirrorless and a 35mm f/1.8 prime. I've done some street shooting before but I'm still building confidence. I want a warm film look for the color images."

---

## Street Photography Guide: Outdoor Market -- Morning Sun and Midday Overcast

**Location:** Busy outdoor market -- high subject density, varied stalls, natural congregation points
**Light Conditions:** Bright direct sun (morning, approximately 8-11 AM) transitioning to overcast (noon onward)
**Camera:** Sony full-frame mirrorless
**Lens:** 35mm f/1.8 prime (do not change this lens for the entire session)
**Session Intent:** Candid documentary -- people in context, commerce and community, decisive moments

---

### Recommended Focal Length

**Lens:** 35mm (keep on the camera for the entire session)
**Equivalent on this sensor:** True 35mm -- no crop factor correction needed on full-frame
**Rationale:** The 35mm is the ideal market focal length. Markets are dense and layered -- the 35mm is wide enough to capture a vendor and their stall together as environmental context, close enough to read facial expression and gesture from 6-8 feet. The field of view matches how the eye scans a market stall. Wider would exaggerate perspective at close range; longer would isolate subjects from their market environment.
**Working distance to subject:** 5-8 feet (1.5-2.5 meters) for a head-and-shoulders to half-body frame; 8-12 feet (2.5-4 meters) for a full-body frame within stall context.

---

### Camera Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| Aperture | f/8 (morning sun) / f/5.6 (overcast) | f/8 enables zone focusing with a generous sharp zone in bright light. Switch to f/5.6 when the overcast arrives -- this maintains zone focus functionality while recovering one stop of light. |
| Shutter speed | 1/500s (sun) / 1/250s (overcast) | Markets have fast, unpredictable movement. 1/500s freezes hands exchanging goods, an expression crossing someone's face, a child running. 1/250s is sufficient as light drops without introducing problematic blur. |
| ISO | Auto ISO, max 3200, minimum shutter 1/250s | In direct sun at f/8, ISO will sit at 100-200. When you walk into a covered section of the market (tent, awning, shade), ISO rises automatically. The 1/250s minimum shutter floor prevents blur without requiring you to change settings. |
| Shooting mode | Manual + Auto ISO | Set aperture and shutter manually. Let Auto ISO handle exposure. This combination means you always know your depth of field (f/8) and motion freeze (1/500s); the camera handles the rest. Ideal for the rapid light changes in a market environment. |
| Focus method | Zone focus (manual), at 3 meters | Pre-set and tape the focus ring. Shoot instantly without AF delay. Switch to single-shot AF only if shooting a specific detail or shallow-DOF shot at f/1.8-f/2. |
| Metering | Evaluative/matrix | Market environments have varied tones -- stalls, people, sky, shadows -- and matrix metering averages across this complexity reliably. |
| Drive mode | Single frame (primary) / 5fps burst (for key moments) | Single frame for deliberate composition. Switch to burst for moments with temporal uncertainty -- a vendor's expression as they negotiate, a child's reaction to something. |
| Shutter type | Electronic (silent) | Sony mirrorless cameras have a reliable electronic shutter. Silent shooting in a market allows you to photograph people in genuine, unaware moments. The market ambient noise also masks any mechanical sounds. |

---

### Zone Focus Configuration

- **Sensor size correction:** Full-frame -- no aperture correction needed
- **Focus distance:** 3 meters (10 feet)
- **Sharp zone (near limit):** 2 meters (6.5 feet)
- **Sharp zone (far limit):** 5 meters (16 feet)
- **Hyperfocal distance at f/8, 35mm, full-frame (c = 0.030mm):** 5.1 meters (17 feet)
- **Hyperfocal sharp zone:** 2.55 meters (8.4 feet) to infinity
- **Recommended use:** Use the 3-meter zone focus (2m-5m sharp) for close-in market work -- vendors, customers, hands, faces at typical stall interaction distance. Switch to hyperfocal (focus at 5m) when photographing wide crowd scenes or long market aisles where subjects are at varying distances beyond 5 meters.
- **When to switch to autofocus:** Switch to single-shot AF with eye-detection if you want a specific shallow-depth-of-field shot of a vendor's face at f/1.8. At f/1.8 and 1.5 meters, depth of field is only about 5cm -- zone focus is physically impossible. Shoot the portrait, switch back to f/8 manual zone focus for reactive work.

---

### Composition Approach

**Primary method:** Background-first waiting combined with walking-and-reacting

A market rewards both approaches simultaneously. Identify a strong compositional setup -- a vendor stall with a beautiful color arrangement behind them, a shadow pattern on the ground at a crossroads of foot traffic, a gap between two stalls that frames the crowd beyond -- and wait for the right figure to enter. While waiting, keep moving and reacting to incidental moments elsewhere.

**Key visual targets at an outdoor market:**

- **Hands and transaction:** The moment of exchange -- money changing hands, goods being passed, a vendor weighing produce. Position yourself level with the stall counter (not looking down) to see both hands simultaneously. This is a strong decisive-moment target.
- **Light through tent fabric:** Morning sun through a canvas awning creates warm dappled light on people below. Position yourself with this light behind you, subjects lit from above. The warm color contamination from the canvas enhances the film emulation aesthetic.
- **Crowd convergence points
