---
name: exposure-triangle
description: |
  Recommends aperture, shutter speed, and ISO settings for a specific shooting
  scenario with depth-of-field, motion blur, and noise trade-off explanations.
  Produces camera-agnostic exposure settings applicable to any camera with
  manual or semi-automatic controls.
  Use when the user asks about camera settings, exposure, aperture, shutter
  speed, ISO, or how to achieve a specific look with their camera.
  Do NOT use for composition and framing (use composition-guide), lighting
  equipment setup (use lighting-setup), or post-processing (use
  photo-editing-workflow).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "photography guide beginner-friendly"
  category: "design-creative"
  subcategory: "photography"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Exposure Triangle

## When to Use

Use this skill when any of the following triggers appear in the user's request:

- The user asks for specific camera settings for a named scenario (portrait session, sports game, waterfall, nightscape, wedding reception, food photography, astrophotography, etc.)
- The user wants to understand why a photo came out too bright, too dark, motion-blurred, grainy, or lacking subject separation from the background
- The user is learning to shoot in Manual (M), Aperture Priority (Av/A), or Shutter Priority (Tv/S) mode and needs a framework for decision-making
- The user asks how to achieve a specific visual effect -- silky water, bokeh, frozen splash, star trails, light painting, panning blur, or high-key/low-key exposure
- The user mentions a specific lens aperture or focal length and needs to understand how to maximize or control depth of field for their situation
- The user has received conflicting advice about "expose to the right" (ETTR), the "Sunny 16 rule," or reciprocity and wants a clear explanation
- The user is switching from phone photography to a camera with manual controls and needs a conceptual and practical foundation

**Do NOT use this skill when:**
- The user needs advice about where to position the subject within the frame, rule of thirds, leading lines, or framing -- use `composition-guide` instead
- The user needs to place, modify, or balance flash units, softboxes, reflectors, or continuous LED panels -- use `lighting-setup` instead
- The user is asking about Lightroom, Capture One, Photoshop, or any post-processing step to recover shadow detail, reduce noise, or adjust exposure after the shot -- use `photo-editing-workflow` instead
- The user is asking about lens selection for optical properties (focal length compression, aberrations, sharpness profiles) rather than exposure -- use `lens-selection` if available
- The user is asking about white balance, color temperature, or tint settings -- these are technically separate from exposure, though you may briefly note white balance if mixed lighting causes metering confusion
- The user is asking about flash sync speed, guide number calculations, or off-camera flash exposure -- use `flash-photography` instead
- The user only wants to know how to clean a sensor, update firmware, or troubleshoot a hardware issue

---

## Process

### Step 1: Gather the Shooting Scenario (All Required Inputs)

Before recommending any settings, collect every input that materially affects the exposure triangle decision. Do not guess -- ask if anything is missing.

- **Subject type and behavior:** Is it stationary (landscape, product, portrait), predictably moving (parade, sports with known paths), or unpredictably moving (toddlers, wildlife, street moments)? Subject speed determines the shutter speed floor.
- **Light quantity and quality:** Assign a rough EV (Exposure Value) category: bright sun (EV 15), overcast (EV 12), open shade (EV 11), indoor window light (EV 9-10), indoor artificial (EV 7-8), candlelight/dim bar (EV 5-6), night street (EV 4-5), moonlit landscape (EV 1-3). These EV anchors drive every subsequent calculation.
- **Desired depth-of-field look:** Ask explicitly. "Blurred background" is aperture-priority thinking. "Everything sharp" is landscape/architecture thinking. "Subject sharp, background identifiable but soft" is environmental portrait thinking.
- **Camera sensor size:** Full-frame (36x24mm), APS-C (crop factor ~1.5x for Nikon/Sony/Fuji, ~1.6x for Canon), Micro Four Thirds (crop factor 2x), or 1-inch and smaller. Sensor size affects both native ISO performance and the effective depth of field for a given aperture.
- **Lens focal length and maximum aperture:** Both are critical. A 50mm f/1.8 on a full-frame body behaves differently from the same lens on APS-C (effective 75mm equivalent field of view but same depth of field in absolute terms). A 70-200mm f/4 lens cannot produce f/2.8 background blur no matter how the settings are pushed.
- **Output destination:** Web/social media at 2000px forgives more noise than a 20x30 inch print. Editorial journalism tolerates grain that a beauty advertisement does not.
- **Tripod or handheld:** Tripod use eliminates camera-shake-driven shutter speed minimums, unlocking arbitrarily slow shutter speeds. This completely changes the ISO and aperture calculus for landscapes, architecture, and long-exposure work.

---

### Step 2: Identify the Creative Priority -- The "Driver" Setting

One of the three settings controls the creative intent. The other two are servants that balance the exposure around it. This determines which mode to recommend.

- **Aperture is the driver** when depth of field defines the image: portraiture (shallow), landscape (deep), real estate (deep), product (controlled), macro (critically shallow). Recommend Aperture Priority (Av/A) mode.
- **Shutter speed is the driver** when motion -- frozen or deliberately blurred -- defines the image: sports (frozen), wildlife (frozen), waterfall (silky), panning (streaked background, sharp subject), light painting (multi-second). Recommend Shutter Priority (Tv/S) mode.
- **Manual mode is required** when both aperture and shutter speed must be locked simultaneously: studio strobe work (sync speed must hold, aperture controls strobe exposure, ISO stays at base), astrophotography (aperture wide open, shutter calculated by the 500-rule, ISO raised to compensate), video (shutter speed locked to 180-degree rule -- double the frame rate -- forever).
- **ISO is never the driver.** ISO is the amplifier of last resort. It is set to the lowest value that achieves a correct exposure after aperture and shutter speed are optimized. Raising ISO above sensor-native base introduces luminance noise (grain) and color noise (chroma splotches) that degrade fine detail and smooth gradients.

---

### Step 3: Set Aperture for Depth of Field

Depth of field (DOF) is controlled by three physical factors: aperture f-number, focal length, and subject-to-camera distance. Understanding all three prevents the common mistake of blaming only aperture for flat-looking portraits.

| Desired Effect | f-Stop Range | Practical Notes |
|---|---|---|
| Extreme subject isolation (portrait, macro) | f/1.2 -- f/2.0 | At f/1.4 on an 85mm full-frame lens at 6 feet, DOF is approximately 2.5 inches -- eyelashes can fall out of focus. Best for single-eye focus or product hero shots. |
| Strong subject separation (general portrait) | f/2.0 -- f/2.8 | The standard portrait sweet spot. Enough DOF for a face at 6-8 feet, smooth background. f/2.8 is the fastest available on most zoom lenses. |
| Environmental portrait (subject + context) | f/4 -- f/5.6 | Subject is sharp, background is recognizable but soft. 2-3 person groups fit in the DOF at f/5.6. |
| Group portraits (5+ people, spread depth) | f/7.1 -- f/8 | Safe group setting. At f/8, a group of 10 at 12 feet on a full-frame body will be acceptably sharp front-to-back. |
| Landscape / architecture (deep DOF) | f/8 -- f/11 | Optimal sharpness zone for most lenses. Diffraction has not yet softened corners. |
| Extended landscape (hyperfocal required) | f/11 -- f/16 | Focus at the hyperfocal distance for the lens/aperture combination to maximize sharpness from half the hyperfocal distance to infinity. |
| Starburst sunstar effect | f/16 -- f/22 | Narrow aperture diffracts light at bright point sources into star shapes. The number of points equals the number of aperture blades times two for even-bladed irises. |

**Critical DOF modifiers to explain:**
- Moving the camera 3 feet closer to the subject has a larger effect on background blur than opening the aperture one full stop.
- At 200mm and f/5.6, background blur rivals 85mm at f/2.8 -- focal length compression matters as much as aperture.
- Micro Four Thirds users need to open the aperture one additional stop (f/2.8 on MFT ≈ f/5.6 full-frame for DOF) to match full-frame background blur. This is a real constraint with shallow-DOF photography on smaller sensors.
- Diffraction softening becomes visible on 24-36 megapixel sensors at f/16 and above. For maximum sharpness in landscapes, f/11 is often the practical ceiling.

---

### Step 4: Set Shutter Speed for Motion Control

Shutter speed simultaneously controls two things: subject motion blur and camera shake blur. Always address both.

| Motion Requirement | Shutter Speed | Notes |
|---|---|---|
| Freeze birds in flight, motorsports | 1/2000s -- 1/4000s | Wing position, tire spray, and impact detail all require this range. |
| Freeze running athletes, jumping subjects | 1/1000s -- 1/2000s | Peak action freezing. 1/1000s is the reliable floor for running. |
| Freeze walking adults, children playing | 1/500s -- 1/1000s | Safe handheld street photography. Freezes all but the fastest hand gestures. |
| Freeze casual gestures, slow movement | 1/250s -- 1/500s | Portrait sessions with still subjects. Event photography crowd movement. |
| Safe minimum handheld (reciprocal rule) | 1/[effective focal length] | 50mm lens on full-frame: 1/50s minimum. 50mm on APS-C: effective 75mm, so 1/75s minimum -- use 1/80s or 1/100s. With IBIS rated at 5 stops: 1/50s extends to 1/1.6s theoretically, but 1/10s is the practical handhold floor for most shooters. |
| Imply motion (panning, flowing hair) | 1/30s -- 1/125s | Pan the camera with the subject. Background streaks horizontally, subject stays sharp if tracking is smooth. |
| Silky water movement (small stream) | 1/2s -- 2s | Smooth, painterly water surface. Tripod required. Subject must be stationary. |
| Silky water (large waterfall, ocean) | 5s -- 15s | Cotton-candy texture. ND filter often required to achieve this speed in daylight. |
| Light trails (cars, city at night) | 10s -- 30s | Vehicle lights become continuous streaks. Shutter stays open for full light-trail length. Tripod required. |
| Star points (astrophotography) | Use 500-rule: 500 ÷ effective focal length | 24mm full-frame: 500 ÷ 24 = 20.8s maximum before stars trail. On APS-C with 24mm (effective 36mm equivalent for this calculation): 500 ÷ 36 = 13.9s. Some astrophotographers use the 400-rule for tighter stars. |
| Star trails (intentional long trails) | 20 minutes -- several hours, or interval stacking | Requires an intervalometer, fully charged battery, and dark sky. Interval stacking 30-second frames in post is preferable to a single very-long exposure. |

**Shutter speed warnings:**
- At slow shutter speeds below 1/10s, even breathing can introduce camera shake. Use a remote shutter release or the camera's 2-second self-timer to isolate the vibration of pressing the button.
- Mirror slap on DSLR cameras introduces vibration at shutter speeds between approximately 1/30s and 1s -- use mirror lock-up for critical landscape or macro work in this range.
- High-speed sync (HSS) with a flash allows shutter speeds above the camera's native sync speed (typically 1/200s -- 1/250s). Without HSS, shooting faster than the sync speed produces a dark band across the frame from the second curtain.

---

### Step 5: Set ISO as the Balancing Variable

ISO amplification raises the signal level from the sensor but amplifies noise simultaneously. Setting ISO correctly requires knowing the camera's native base ISO and its usable upper limit.

| Light Condition (approximate EV) | Starting ISO | Practical Notes |
|---|---|---|
| Bright sun, EV 15 | 100 -- 200 | Lowest native ISO. Zero visible noise at any print size. Sunny 16 reference: f/16, 1/ISO, ISO 100 = 1/100s at f/16 in full sun. |
| Lightly overcast, EV 13 | 200 -- 400 | One to two stops below full sun. Shadows are softer. Still essentially noise-free on any camera made after 2015. |
| Open shade, cloudy, EV 11 | 400 -- 800 | Two stops below overcast. Crop sensors begin to show micro-contrast noise in flat areas (sky gradients) at ISO 800. Full-frame cameras are clean. |
| Indoor window light (daytime), EV 9-10 | 800 -- 1600 | Shooting a portrait 6 feet from a large window. This is where crop sensors diverge meaningfully from full-frame. On Micro Four Thirds, luminance noise is visible at ISO 1600 at 100% zoom. |
| Indoor artificial (well-lit room), EV 7-8 | 1600 -- 3200 | Restaurant / reception lighting. Modern full-frame cameras (post-2018) show only fine-grained, film-like luminance noise at 3200. Crop sensors at 3200 show chunky chroma noise. |
| Dim indoor, concert, candlelight, EV 5-6 | 3200 -- 6400 | Noise is visible but printable at 8x10. In black and white conversion, grain at ISO 6400 often reads as aesthetic rather than defective. |
| Night street with some lights, EV 3-4 | 6400 -- 12800 | Noise management in post-processing is required. If the camera has a dual-gain or multi-conversion ISO (Sony's at ISO 640/800, Fuji's at ISO 1600), stay at or above that threshold for best noise performance. |
| Very dark scenes, EV 1-2 | 12800 -- 25600 | Photojournalism-acceptable. Evaluate on a case-by-case basis. Subject clarity over technical perfection. |
| Astrophotography | 3200 -- 6400 (full-frame) | Higher ISO requires shorter exposures to stay within star-trail limits. Balance between total signal collected and noise amplification. |

**ISO architecture knowledge:**
- Every camera sensor has a true native base ISO (usually 100 or 200) where the analog signal is processed before any amplification. This is the cleanest ISO.
- Many modern cameras have a second native ISO (dual-gain architecture): Sony A7 series at ISO 640, Nikon Z series at ISO 800, some Fuji cameras at ISO 1600. At or above the second native ISO, per-pixel read noise actually drops, making these ISOs surprisingly clean -- often cleaner than halfway between the two native values.
- Auto ISO with a minimum shutter speed limit is the most practical setting for dynamic shooting: set minimum shutter speed to 1/[focal length] or faster, set maximum ISO to the camera's usable ceiling (e.g., 6400), set aperture in Av mode. The camera handles the balance and only introduces noise when optical means are exhausted.
- Pushing ISO in post-processing from a correct-exposure RAW file at a lower ISO produces cleaner results than shooting at a very high ISO. This is the "expose to the right" (ETTR) principle: expose as brightly as possible without clipping highlights, then pull down in post. The extra photons collected reduce shot noise in the shadows.

---

### Step 6: Verify the Exposure Triangle Balance

After setting all three values, perform a consistency check. The fundamental exposure relationship is rigid: each setting change must be compensated by an equal and opposite change.

**Stop arithmetic:**
- One stop = doubling or halving light. Aperture stops: f/1.4 -- f/2 -- f/2.8 -- f/4 -- f/5.6 -- f/8 -- f/11 -- f/16 -- f/22. Each step right = one stop darker.
- One stop of shutter speed: 1/15 -- 1/30 -- 1/60 -- 1/125 -- 1/250 -- 1/500 -- 1/1000 -- 1/2000 -- 1/4000 -- 1/8000. Each step right = one stop darker.
- One stop of ISO: 100 -- 200 -- 400 -- 800 -- 1600 -- 3200 -- 6400 -- 12800. Each step right = one stop brighter.
- Most cameras also support 1/3-stop increments within each control. Fluency with these is important for fine-tuning.

**The Sunny 16 rule as a sanity check:**
In bright direct sunlight, correct exposure is: f/16, shutter speed = 1/ISO, and any ISO value. At ISO 200, that is f/16, 1/200s. At ISO 400, f/16, 1/400s. Any equivalent exposure (f/2.8, 1/6400s, ISO 200) is mathematically the same exposure value.

**Using the camera's exposure meter:**
- The exposure meter aims for 18% middle gray. This is correct for average scenes but wrong for high-key or low-key subjects.
- Bright scenes (snow, white sand, white dress): the meter will underexpose by 1-2 stops. Apply +1 to +2 stops of exposure compensation.
- Very dark scenes (black tuxedo, dark forest at night): the meter will overexpose by 1-2 stops. Apply -1 to -2 stops of exposure compensation or trust spot-metering on a neutral mid-tone.
- Spot metering on the subject's skin (aim for Zone V -- middle gray) is the most reliable method when the background does not represent the subject's tonal value.

---

### Step 7: Select and Recommend the Appropriate Shooting Mode

Match the mode recommendation to the creative driver identified in Step 2.

- **Aperture Priority (Av/A):** Ideal for portrait, landscape, product, event, travel, and street photography where depth-of-field drives the creative decision. Set the aperture and ISO limit; the camera selects shutter speed. Risk: in rapidly changing light, the camera-selected shutter speed may drop below the camera-shake threshold. Mitigate with Auto ISO + minimum shutter speed constraint.
- **Shutter Priority (Tv/S):** Ideal for sports, wildlife, children, waterfalls, and any scenario where motion control is the primary concern. Set shutter speed and ISO limit; camera selects aperture. Risk: in low light, the camera may run out of aperture (hit maximum aperture) and underexpose. Watch the aperture readout -- if it stops changing and the scene is dark, raise ISO or slow the shutter.
- **Manual (M) with Auto ISO:** The "pro hybrid" mode. Photographer locks both the aperture (for DOF) and the shutter speed (for motion). Camera adjusts only ISO. This removes all guesswork from creative settings while letting the camera handle light variation automatically. Highly recommended for wedding receptions, concerts, and indoor sports where light is inconsistent.
- **Full Manual (M) with fixed ISO:** Required for studio strobe, astrophotography, video, and any situation with consistent artificial light. The photographer controls everything. Expose using either the in-camera meter or an external light meter (incident metering is more accurate for studio work than reflective metering).
- **Program (P):** Not recommended for users following this skill -- it removes creative control from both aperture and shutter speed simultaneously and does not help the user learn the relationship between settings.
- **Bulb (B):** Used for exposures longer than 30 seconds. The shutter stays open for as long as the remote shutter release is held. Used for astrophotography, light painting, and very long fireworks exposures. Always use with a lockable remote shutter release to avoid camera shake.

---

### Step 8: Build and Deliver the Formatted Recommendation

Compile all decisions into the Output Format below. Include: primary recommended settings, the rationale chain for each setting, trade-off consequences of adjusting each setting in either direction, alternative configurations for 2-3 common variations on the request, and the quick-reference anchors.

---

## Output Format

```
## Exposure Settings: [Scenario Name]

**Subject:** [What is being photographed and its behavioral characteristics]
**Light Conditions:** [Specific light quality, EV estimate, direction if relevant]
**Desired Look:** [Explicit visual goal -- shallow DOF / deep DOF / frozen motion / motion blur / clean detail]
**Sensor:** [Full-frame / APS-C / MFT -- affects DOF equivalence and ISO performance]
**Lens:** [Focal length + maximum aperture]
**Handheld or Tripod:** [Determines minimum shutter speed requirements]

---

### Recommended Settings

| Setting | Value | Rationale |
|---|---|---|
| Aperture | f/[X] | [DOF result at this focal length and subject distance. What is sharp. What is blurred.] |
| Shutter Speed | 1/[X]s | [Motion result. Is subject frozen? Is there intentional blur? Is camera shake risk addressed?] |
| ISO | [X] | [Noise level expected. Is this base ISO, moderate ISO, or a noise-visible ISO?] |
| Shooting Mode | [Av / Tv / M+AutoISO / M] | [Why this mode serves the creative priority.] |
| Metering Mode | [Evaluative / Center-weighted / Spot] | [Why this metering pattern matches the lighting situation.] |
| Exposure Compensation | [+/- X stops, or "none"] | [Required if meter is likely to mis-read the tonal balance of the scene.] |

---

### Stop-by-Stop Trade-off Analysis

**Aperture:**
- One stop wider (f/[X-1]): [Effect on DOF, exposure, diffraction at extremes]
- One stop narrower (f/[X+1]): [Effect on DOF, exposure, diffraction at extremes]

**Shutter Speed:**
- One stop faster (1/[X*2]s): [Motion result, exposure compensation needed]
- One stop slower (1/[X/2]s): [Motion risk, camera shake risk, exposure gain]

**ISO:**
- One stop lower (ISO [X/2]): [Noise reduction gain, exposure shortfall if any]
- One stop higher (ISO [X*2]): [Noise increase, acceptable or not for this output destination]

---

### Alternative Configurations

| Goal | Aperture | Shutter Speed | ISO | Notes |
|---|---|---|---|---|
| [Alt goal 1: e.g., "Maximum background blur"] | f/[X] | 1/[X]s | [X] | [Brief note] |
| [Alt goal 2: e.g., "More DOF while keeping subject sharp"] | f/[X] | 1/[X]s | [X] | [Brief note] |
| [Alt goal 3: e.g., "If clouds roll in"] | f/[X] | 1/[X]s | [X] | [Brief note] |

---

### Quick Reference Anchors

- **Minimum handheld shutter speed (reciprocal rule):** 1/[effective focal length]s
  (e.g., 200mm on full-frame = 1/200s. 200mm on APS-C = 1/320s minimum.)
- **Sunny 16 check for this scenario:** f/16, 1/[ISO value]s, ISO [X]
  Equivalent to recommended settings: [confirm the math]
- **Maximum usable ISO for clean output (output-dependent):**
  Web: up to ISO [X]. 8x10 print: up to ISO [X]. 20x30 print: up to ISO [X].
- **Depth of field at recommended settings:**
  Approximate DOF at [subject distance]: [near focus distance] to [far focus distance]
  Hyperfocal distance at this aperture and focal length: [X]m / [X]ft (if relevant)
- **Autofocus mode recommendation:** [AF-S for static subjects / AF-C (AI Servo) for moving subjects / zone vs. tracking mode]
- **Drive mode recommendation:** [Single / Burst low / Burst high / Silent]
```

---

## Rules

1. **ISO is always set last.** Aperture controls depth of field (a permanent creative decision in the final image). Shutter speed controls motion (a permanent creative decision). ISO only controls noise -- a quality penalty. Never lead with ISO recommendations.

2. **State the depth-of-field consequence of every aperture recommendation explicitly.** "f/2.8" means nothing without context. "f/2.8 at 85mm and 6 feet on a full-frame sensor produces approximately 3 inches of depth of field" is actionable.

3. **State the motion consequence of every shutter speed recommendation explicitly.** "1/500s" means nothing without context. "1/500s freezes a running adult's limbs cleanly; a running dog at 25 mph may still show foot blur at this speed -- use 1/1000s" is actionable.

4. **Always include the reciprocal rule minimum handheld shutter speed AND adjust it for sensor crop factor.** A 50mm lens on an APS-C camera has an effective field of view of 75-80mm, and the camera-shake reciprocal rule must use the effective focal length, not the printed focal length on the lens barrel.

5. **Account for sensor size in both ISO performance and depth-of-field equivalence.** A Micro Four Thirds sensor at ISO 3200 shows significantly more noise than a Sony full-frame at ISO 3200. A Micro Four Thirds lens at f/2.0 produces the same depth of field as f/4.0 on full-frame. These are not interchangeable and must be called out.

6. **Never recommend an ISO above 6400 without explicitly noting:** (a) that significant noise will be visible, (b) that noise reduction in post-processing is advisable, and (c) that a sharp-but-noisy image is preferable to a clean-but-blurry image in action/documentary scenarios.

7. **When recommending slow shutter speeds (below 1/30s), always specify tripod requirement and camera vibration mitigation.** This includes: electronic or remote shutter release, 2-second self-timer mode, mirror lock-up on DSLRs for 1/30s -- 1/1s range, and the impact of IBIS (in-body image stabilization) rating on practical handheld limits.

8. **Provide the Sunny 16 equivalence check for every outdoor recommendation.** It is the fastest sanity check for whether a recommended exposure is reasonable. If the math does not close, the recommendation is wrong.

9. **When the desired effect requires physically incompatible settings** (very shallow DOF AND very fast shutter AND low ISO in bright sun, for example, which would overexpose) -- explicitly diagnose the conflict and offer the neutral-density (ND) filter as the solution. A 6-stop ND filter allows f/1.8, 1/1000s, ISO 100 in full sunlight.

10. **Never recommend f/22 as a default for "everything sharp."** f/22 triggers diffraction softening on sensors above 16 megapixels. The correct recommendation for maximum sharpness across the frame is the lens's diffraction-limited aperture (usually f/11 on full-frame), combined with focusing at the hyperfocal distance. f/22 is acceptable only when DOF depth is so critical that some diffraction softening is the lesser evil.

11. **When the user has a zoom lens, specify which end of the zoom range to use** for the desired effect. Wide end (24mm on a 24-70) maximizes DOF and minimizes background blur. Long end (70mm on a 24-70) compresses background, enhances subject separation, and is preferred for flattering portrait perspective.

12. **The metering mode is part of the exposure recommendation.** Evaluative/matrix metering for evenly lit scenes. Center-weighted for backlit subjects. Spot metering when the subject and background have dramatically different tonal values. An incorrect metering mode produces an otherwise-correct-settings image that is wrongly exposed.

---

## Edge Cases

### 1. Shooting in Extreme Bright Conditions (Snow, Beach, White Sand Desert)
The camera's evaluative meter reads excessive brightness and attempts to render it as 18% middle gray, causing underexposure of the entire scene by 1.5 -- 2.5 stops. The result is gray snow, dark blue ocean water, and underexposed skin tones on subjects in the scene.

**Handling:** Apply +1.5 to +2.0 stops of positive exposure compensation when shooting in Av or Tv mode. In Manual mode, trust a skin-tone spot reading over the camera's meter. Confirm histograms show the snow/sand highlights near the right edge without clipping. The "blinkies" (highlight alert) should show minimal clipping on bright surfaces -- a small amount of specular highlight clipping on snow is acceptable and correct.

### 2. Fast-Moving Subjects in Low Light (Indoor Sports, Concert Photography, School Events)
This is the most demanding exposure triangle scenario because it creates a three-way conflict: wide aperture needed for light, fast shutter needed for motion, but low ISO needed for noise -- and all three objectives cannot be fully satisfied simultaneously.

**Handling:** Resolve the priority hierarchy strictly. First, set aperture to the widest available (f/2.8 if the lens allows). Second, set shutter speed to the minimum needed to freeze the specific motion (1/500s for basketball, 1/1000s for gymnastics). Third, raise ISO until the exposure meter reads correctly -- accept whatever ISO that requires. A sharp-but-noisy photo is always superior to a clean-but-blurry photo for action subjects. For a 200mm f/2.8 lens at ISO 6400, in dim indoor sports light, the exposure may still be 2/3 of a stop underexposed. Apply +0.7 stops exposure compensation and recover in RAW processing rather than raising ISO further. In concert photography, the three-song rule and venue lighting temperature (typically 2700-3200K with colored gels) also affects metering -- set a manual white balance or shoot RAW.

### 3. Mixed or Competing Light Sources (Indoor Rooms with Both Window and Artificial Light)
When daylight (5500-6500K) from a window and tungsten/LED artificial light (2700-4000K) illuminate the scene simultaneously, two problems emerge: (a) exposure metering is confused by the brightness difference between the window and the artificial-lit subject, and (b) white balance cannot be correct for both simultaneously.

**Handling:** Meter exclusively on the subject using center-weighted or spot metering -- ignore the window in the exposure calculation. The window will typically blow out (overexpose), which is usually acceptable and natural-looking. If the window needs detail, exposure must be reduced to preserve it, the subject will be underlit, and fill light (a reflector or off-camera strobe) is required to balance -- this crosses into `lighting-setup` territory. Set white balance to match the dominant light source illuminating the subject's face. Flag this as a mixed-light situation in the recommendation and note that RAW capture allows white balance adjustment per-light-source in post-processing.

### 4. Astrophotography and Night Sky
The exposure triangle for astrophotography has unique constraints that override normal rules: the star-trail limit from Earth's rotation, the minimum aperture needed to collect enough light from faint stars, and ISO so high that noise management becomes the dominant image quality concern.

**Handling:** Calculate the maximum shutter speed using the 500-rule (some practitioners use the 400-rule for tighter, more pinpoint stars): 500 ÷ effective focal length in mm. A 24mm full-frame lens: 500 ÷ 24 = 20.8 seconds maximum. An APS-C with 24mm (effective ~36mm field of view): 500 ÷ 36 = 13.9 seconds -- round down to 13 seconds. Set aperture as wide as the lens allows without serious coma aberration (many fast lenses soften star points at maximum aperture -- f/2.8 or f/3.5 instead of f/1.8 may produce sharper stars). Set ISO between 3200 -- 6400 on full-frame, 1600 -- 3200 on APS-C. Focus manually using live-view magnification on a bright star or distant light. Star-tracker mounts extend exposure time beyond the star-trail limit by counter-rotating the camera, allowing ISO reduction and multi-minute exposures.

### 5. Long Exposure Without a Tripod
Sometimes the desired long exposure effect (silky water, light trails, dusk cityscapes) must be achieved without a tripod.

**Handling:** Exploit every available stabilization technique in sequence. Use in-body image stabilization (IBIS) -- a 5-stop IBIS system theoretically extends a 1/50s handheld limit to approximately 1/1.6s; in practice, 1/4s is the reliable floor for most shooters. Brace the camera against a solid surface (wall, fence, railing, beanbag on stone). Use the 2-second self-timer or a remote shutter release to eliminate button-press vibration. Shoot in burst mode and examine for the sharpest frame. On DSLRs, enable mirror lock-up for exposures in the 1/30s -- 1s range where mirror slap causes camera-frequency vibration. Accept that tripodless exposures below 1/4s will have a keeper rate under 20%.

### 6. Neutral Density (ND) Filter Use in Bright Light
When both shallow depth of field AND a slow shutter speed are desired simultaneously in daylight, the exposure triangle is mathematically overloaded -- there is too much light for the settings required.

**Handling:** Diagnose the conflict explicitly. Example: f/2.8, 1/30s, ISO 100 in full sun is approximately 5-6 stops overexposed (Sunny 16 says f/16, 1/100s, ISO 100 -- moving to f/2.8 is 5 stops more light, moving to 1/30s is 2 stops more light -- total overexposure is 7 stops). A variable ND filter rated 6-9 stops resolves this directly by reducing the light entering the lens without changing the optical settings. For video, where the 180-degree shutter rule locks the shutter speed at twice the frame rate (1/50s for 25fps, 1/60s for 30fps), an ND filter is mandatory for outdoor daytime shooting at f/2.8 or wider.

### 7. Macro and Close-Up Photography
Macro photography (1:1 or greater magnification, subject fills the frame when 1-inch subject fills a 1-inch sensor) creates unique exposure challenges that standard exposure triangle thinking does not fully address.

**Handling:** Depth of field at 1:1 magnification is measured in millimeters regardless of aperture. At f/5.6, 1:1 macro, DOF may be only 1-2mm -- a single insect's eye may be sharp while its antennae are blurred. Recommend f/11 -- f/16 as a minimum for identifiable macro subjects, understanding that diffraction will soften the image but DOF requirements override sharpness optimization at this scale. Additionally, at macro distances, the effective aperture is wider than the marked f-stop -- at 1:1 magnification, the effective aperture is 2 stops smaller than marked (f/5.6 behaves as f/11 for exposure purposes). This "bellows factor" means the camera's TTL (through-the-lens) metering compensates automatically, but manual exposure users must account for it: Effective f-stop = marked f-stop × (1 + magnification ratio). For macro, always recommend focus stacking (multiple images at different focus planes combined in post) for subjects requiring more than 2mm of depth, and flash (ring flash or twin macro flash) to both illuminate and freeze microscopic subject movement.

---

## Example

**User Input:** "I want to photograph the Milky Way from a dark sky location. I have a Sony full-frame mirrorless camera. My widest lens is a 20mm f/1.8. I've never done this before. What settings should I use?"

---

## Exposure Settings: Milky Way Photography (Dark Sky, Full-Frame, 20mm f/1.8)

**Subject:** Milky Way galactic core -- static (stars appear to rotate due to Earth's rotation, creating trail limit)
**Light Conditions:** Dark sky site, no moon. Approximate EV: 1-2 for the sky. Ground foreground at EV -1 to 0.
**Desired Look:** Sharp star points (no trailing), visible Milky Way band with color and structure, identifiable foreground element for compositional scale
**Sensor:** Sony full-frame mirrorless (excellent high-ISO performance; dual-native ISO architecture typically at ISO 640 and ISO 2500-3200)
**Lens:** 20mm f/1.8 prime
**Handheld or Tripod:** Tripod required -- exposure is 15-25 seconds

---

### Recommended Settings

| Setting | Value | Rationale |
|---|---|---|
| Aperture | f/2.0 | f/1.8 is wide open maximum but many 20mm lenses show coma aberration at f/1.8 -- stars appear comet-like at frame edges. f/2.0 (1/3 stop down) typically eliminates coma on most modern lenses while retaining 90% of the light gathering benefit. Test your specific lens to confirm. |
| Shutter Speed | 20 seconds | 500-rule: 500 ÷ 20mm = 25 seconds maximum theoretical. However, many photographers use the 400-rule (400 ÷ 20 = 20s) for tighter stars. Set 20 seconds as the conservative choice. Stars will be round points. |
| ISO | 3200 | Sony full-frame sensors render ISO 3200 with fine luminance noise that post-processing handles cleanly. Chroma noise is minimal. Sony's second native ISO is typically around 2500-3200 -- landing near or at the second native ISO provides a real noise advantage. At ISO 6400, noise increases substantially for questionable sky brightness gain. |
| Shooting Mode | Manual (M) with fixed ISO | Auto ISO is inappropriate for astrophotography -- the camera would be confused by the dark scene and boost ISO far beyond the usable maximum. All three settings must be manually locked. |
| Metering Mode | N/A (manual exposure -- trust calculated settings, not the meter) | The in-camera meter is not useful in near-darkness. The histogram after the first test frame is the only reliable exposure guide. |
| Exposure Compensation | None (irrelevant in full Manual mode) | Evaluate the histogram after the first 20-second exposure. The peak should sit in the left-center of the histogram, not touching the right edge (the sky should not clip). Some photographers add 1/3 stop of extra exposure by extending to 25 seconds if ISO 3200 appears too dark on the first test. |

---

### Stop-by-Stop Trade-off Analysis

**Aperture:**
- One stop wider (f/1.8, maximum): Gains 1/3 stop of light. Stars at frame edges may show coma -- test your lens and examine corner stars at 100% zoom on the camera LCD. The only reason to open to f/1.8 is if the Milky Way is still underexposed at f/2.0, ISO 3200, and 20s, which is unlikely at a genuine dark sky site.
- One stop narrower (f/2.8): Loses one full stop of light. Either extend shutter to 40 seconds (star trailing becomes visible at 40s on a 20mm lens -- approaching too long) or raise ISO to 6400 (visible noise increase). Not recommended unless the lens is significantly sharper at f/2.8, which is rarely the case for coma correction purposes.

**Shutter Speed:**
- One stop faster (10 seconds): Requires ISO 6400 or opening to f/1.8 to compensate. Stars will be tighter and rounder -- an option if star quality matters more than noise. Useful near the southern horizon where Earth's rotation is faster at higher declinations.
- One stop slower (40 seconds): Crosses the star-trail limit at 20mm (400-rule threshold is 20 seconds). Stars will become visible short streaks at the edges of the frame. Some photographers consider very subtle trailing at 30-35s artistically acceptable; 40s will be clearly visible.

**ISO:**
- One stop lower (ISO 1600): The Milky Way core will be significantly dimmer. Fainter star detail disappears. Only justified if noise is unacceptable at ISO 3200 after post-processing. Rarely a good trade-off for astrophotography.
- One stop higher (ISO 6400): Increases brightness of the sky and reveals fainter nebulosity. Noise increases noticeably -- most visible in the dark shadow areas of the foreground. Acceptable for a single-shot approach when the foreground is featureless (ocean, flat desert). Not ideal for foreground-detail images.

---

### Alternative Configurations

| Goal | Aperture | Shutter Speed | ISO | Notes |
|---|---|---|---|---|
| Tighter, rounder stars (no coma tolerance) | f/2.8 | 15s | 6400 | Accept noise increase. Best when pixel-level star quality is the priority, lens is not sharp until f/2.8. |
| Brightest Milky Way for single exposure | f/1.8 | 25s | 6400 | Maximum light gathering. Expect coma at edges and visible noise. Good for quick documentation but not gallery prints. |
| Foreground and sky in one frame (blue hour) | f/2.8 | 20s | 1600 | Shoot during astronomical twilight (sun 12-18° below horizon). Sky retains faint blue and the foreground is lit by ambient twilight. Stars begin appearing but full Milky Way requires full astronomical dark. |
| Multi-frame sky stacking for noise reduction | f/2.0 | 20s | 3200 | Shoot 10-20 identical frames. Stack in post-processing software (Sequator, Starry Landscape Stacker, or Photoshop star-alignment scripts). Stacking 16 frames reduces random noise by 4 stops (square root of 16), effectively giving you ISO 200-equivalent noise at ISO 3200. |
| Star trail intentional effect | f/4.0 | 1800s -- 3600s (or interval stacking) | 800 -- 1600 | Keep the shutter open 30-60 minutes for dramatic arcs. Or shoot 30-second intervals and stack in StarStax or Lightroom. Requires intervalometer, fresh battery, or AC power. Dew heater on lens recommended for multi-hour sessions. |

---

### Quick Reference Anchors

- **Maximum shutter speed before star trailing (400-rule):** 400 ÷ 20mm = 20 seconds
- **Maximum shutter speed (500-rule, slightly more permissive):** 500 ÷ 20mm = 25 seconds
- **Star points will remain round at:** 20 seconds or less at 20mm focal length on full-frame
- **Sunny 16 check (irrelevant here -- night scene):** For a sanity check: at f/2.0, 20 seconds, ISO 3200, the effective EV is approximately 1.5-2, consistent with a true dark sky site. If this exposure is correct in daylight, the scene would be EV 16 (bright sunlight), confirming this is a 14-stop departure from sunlight -- the math confirms it is a very dark scene.
- **Depth of field at f/2.0, 20mm, focused at infinity:** Hyperfocal distance = (20mm × 20mm) ÷ (0.03mm circle of confusion × 1000) ≈ 13 meters. Set focus to 13 meters (manual focus, live-view zoom on a star or distant light), and everything from approximately 6.5 meters to infinity will be acceptably sharp. Do NOT rely on the ∞ (infinity) mark on the lens barrel -- modern lens focusing can extend past true infinity for temperature compensation; confirm focus via live-view 10x magnification on a bright star.
- **Maximum usable ISO for clean output:**
  - Web / social media (2000px): up to ISO 6400
  - 8x10 inch print: up to ISO 3200 (with post-processing noise reduction)
  - 20x30 inch print: ISO 3200 requires significant noise reduction; ISO 1600 preferred, achievable only via sky stacking
- **Autofocus mode:** AF is useless in near-darkness. Manual focus only. Use live-view at maximum magnification (10x) on a bright star or a distant streetlight. Focus until the point source is the smallest, sharpest dot possible.
- **Drive mode:** 2-second self-timer or electronic remote shutter release. Never press the shutter button manually for a 20-second astrophotography exposure -- vibration from button press is detectable on the final image.
- **Lens and sensor dew management:** At dark sky sites, nighttime humidity causes dew to form on lens elements within 30-60 minutes. A USB-powered heated lens band (dew heater) wrapped around the lens barrel prevents this. Without one, carry a clean lens cloth and wipe the front element periodically between frames -- inspect for condensation after every 10-frame sequence.
- **Battery behavior:** Cold temperatures (below 10°C / 50°F) reduce battery capacity by 30-50%. Carry 2-3 fully charged batteries. Keep spare batteries in an inner pocket (body heat maintains charge). Budget no more than 60-80 exposures per battery at cold temperatures for long exposures.
