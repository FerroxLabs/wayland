---
name: portrait-technique
description: |
  Produces a portrait session guide with lens selection rationale, distance,
  aperture for background separation, focus point placement, expression
  direction, and posing prompts for natural-looking poses. Applicable to
  any camera system with manual or semi-automatic controls.
  Use when the user asks to photograph portraits, headshots, or people,
  or wants guidance on posing, lens choice, or focus technique for portraits.
  Do NOT use for lighting setup (use lighting-setup), general composition
  (use composition-guide), or photo editing (use photo-editing-workflow).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "photography guide checklist"
  category: "design-creative"
  subcategory: "photography"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Portrait Technique

## When to Use

Use this skill when the user's request is specifically about capturing portraits of people with a camera -- whether discussing gear selection, in-session technique, subject direction, or technical settings.

**Trigger scenarios:**
- User asks how to photograph a professional headshot, LinkedIn profile photo, actor's comp card, or corporate portrait
- User wants lens recommendations for portrait work -- focal length, aperture, or specific gear decisions
- User asks how to pose a subject or group and wants specific direction language or body positioning guidance
- User asks why their portrait backgrounds are not blurry or why their subject's face looks distorted
- User wants to know where to place the autofocus point or which eye to focus on
- User is shooting a couple, family group, or team photo and needs depth-of-field or arrangement guidance
- User wants to know how close to stand, what camera distance gives the best facial perspective
- User asks about directing expressions or getting natural-looking photos from camera-shy subjects
- User is shooting an environmental portrait where the subject's context (office, workshop, outdoor location) matters to the composition

**Do NOT use when:**
- User is asking about studio light placement, modifier choices, or strobe power ratios -- use `lighting-setup`
- User needs post-processing guidance: skin retouching, frequency separation, dodge-and-burn, or Lightroom adjustments -- use `photo-editing-workflow`
- User asks about general framing, rule of thirds, or compositional theory not specific to portraiture -- use `composition-guide`
- User is photographing wildlife, architecture, sports, or street photography -- those subjects need their own technique frameworks
- User asks about printing or delivering portrait files to clients -- use `photography-delivery-workflow`
- User is asking exclusively about camera metering modes, histograms, or exposure theory -- use `exposure-fundamentals`

---

## Process

### Step 1: Gather the portrait context before recommending anything

Every portrait recommendation changes based on four variables. Establish all four before offering settings or technique.

- **Portrait type:** Tight headshot (eyes to collarbone), head-and-shoulders (top of head to mid-chest), half-body (waist up), three-quarter (mid-thigh up), full-body (head to toe), environmental (subject shown in their context with surrounding space)
- **Subject count:** Single person, couple (two people), small group (3-5), large group (6+). Group count drives aperture floor -- the most important single variable for sharpness across all faces.
- **Location type:** Controlled studio, outdoor natural light, indoor on-location (office, home, venue). Location affects background control, light direction, and background-to-subject distance.
- **Purpose:** Professional headshot (corporate, LinkedIn, actor), social or family, creative/editorial, engagement or couple, event (conference, graduation). Purpose affects how polished versus relaxed the direction should be.
- **Available lens(es):** Ask the focal length and maximum aperture. If the user names a camera body only, ask what lenses they have. The answer fundamentally changes every recommendation.
- **Subject characteristics (optional but valuable):** Camera-shy versus performer, body concerns that affect posing, glasses, age range. These details allow specific adjustments rather than generic guidance.

---

### Step 2: Select the lens and focal length for this portrait type

Focal length is the single biggest determinant of facial perspective. Wrong focal length produces distorted, unflattering results regardless of how good the lighting is.

**Focal length selection by portrait type:**

| Portrait Type | Recommended Range | Ideal Focal Length | Why |
|---|---|---|---|
| Tight headshot | 85mm -- 135mm | 105mm | Compresses facial features, eliminates nose projection, flattering for all face shapes |
| Head and shoulders | 70mm -- 105mm | 85mm | Classic portrait focal length. Pleasant compression, enough working distance for subject direction |
| Half-body | 50mm -- 85mm | 70mm | Covers torso without distorting proportions when shooting at appropriate distance |
| Three-quarter body | 50mm -- 70mm | 55-60mm | Wider field needed for framing mid-thigh, still above the distortion threshold |
| Full-body | 35mm -- 70mm | 50mm | Full body requires wider angle; stay at or above 50mm to keep proportions natural |
| Environmental portrait | 24mm -- 50mm | 35mm | Wide field of view shows the subject's environment; subject is a smaller element in the frame |
| Couple (tight) | 85mm -- 105mm | 85mm | Long enough for compression, wide enough to frame both faces |
| Small group (3-5) | 50mm -- 70mm | 50mm | Wider for group framing while staying flattering |
| Large group (6+) | 35mm -- 50mm | 35mm | Needs wide enough to fit all subjects, arrange subjects to minimize depth differences |

**Key perspective principles to explain to users:**

- Wide-angle focal lengths (24-35mm) exaggerate features closest to the camera. The nose projects forward toward the lens and appears larger. The ears appear further away and smaller. This makes faces look rounder, wider, and unnatural in tight headshots.
- Telephoto focal lengths (85-200mm) compress the relative distances between facial planes. The nose, cheeks, and ears all appear to be at nearly the same distance. This is what photographers mean by "flattering compression."
- The 85mm f/1.8 lens is the single most recommended portrait lens across camera systems because it achieves flattering compression, reasonable working distance (6-10 feet for headshots), and wide maximum aperture for background separation.
- On APS-C (crop sensor) cameras: multiply focal length by 1.5x (Nikon, Sony, Fuji) or 1.6x (Canon) to get the effective focal length. A 50mm on a Canon APS-C behaves like an 80mm portrait lens -- this is actually useful for portraiture.
- On phones: use the telephoto lens (usually labeled 2x or 3x) for any portrait tighter than full-body. The main wide lens at close distance will distort the subject's face significantly.
- Minimum focal length for any headshot or half-body portrait: 50mm equivalent. Below this threshold, facial distortion becomes noticeable to untrained eyes and unflattering.

---

### Step 3: Set aperture for background separation and adequate depth of field

Aperture controls both background blur (bokeh) and how much of the subject stays sharp from front to back. These two goals are in tension -- wider aperture blurs the background but also narrows the sharp zone across the face.

**Aperture selection table:**

| Subject | Recommended Aperture | Depth of Field at 85mm, 8 feet | Notes |
|---|---|---|---|
| Single subject, maximum background blur | f/1.4 -- f/2.0 | ~3-5 inches | Dangerous at f/1.4 -- one eye often soft. Only use if eye-detect AF is confirmed working. |
| Single subject, reliable sharpness | f/2.0 -- f/2.8 | ~6-9 inches | Both eyes sharp, ears begin to soften. Most professional headshots shot here. |
| Single subject, background recognizable | f/4 -- f/5.6 | ~18-30 inches | Background blurred but identifiable. Good for environmental portraits. |
| Couple (faces at same depth) | f/2.8 -- f/4 | ~9-18 inches | Works if both faces at the same distance from lens. Widen if faces at different depths. |
| Couple (faces at different depths) | f/4 -- f/5.6 | ~18-30 inches | Necessary when one person is behind the other (even by 6 inches at f/1.8). |
| Small group (3-5, single row) | f/5.6 -- f/8 | ~30-60 inches | Ensures all faces in a single tight row are sharp. |
| Small group (3-5, two rows) | f/8 | ~60 inches | Two rows of faces need significant depth. Don't go wider. |
| Large group (6+, multiple rows) | f/8 -- f/11 | 60+ inches | Deep depth required. Use aperture AND ensure shutter is fast enough to freeze motion. |

**Critical depth-of-field understanding to communicate:**

- Depth of field is determined by three factors working together: aperture, focal length, and subject distance. Changing any one of them changes the result.
- Getting closer to the subject narrows depth of field even with the same aperture and focal length. At 85mm f/2.8 at 6 feet, DOF is roughly 5 inches. At 85mm f/2.8 at 10 feet, DOF is roughly 14 inches.
- Background-to-subject distance matters for bokeh quality. A background that is 20 feet behind the subject blurs more than a background 5 feet behind the subject, at the same aperture. Move the subject further from the background for more separation.
- The "sweet spot" for most professional headshots is f/2.0 -- f/2.8 at 85mm shot from 7-9 feet. This range consistently delivers both eyes sharp and a beautifully blurred background.
- For couples: the safest rule is to ensure both faces are within the same plane of focus. Have the couple touch foreheads or lean in so their faces are at the same distance from the lens, then use f/2.8 -- f/4.

---

### Step 4: Set the focus point precisely

Focus placement is the difference between a technically excellent portrait and a wasted shot. At wide apertures, the margin for error is measured in inches.

**Focus placement rules by subject:**

- **Single subject, any aperture:** Focus on the nearest eye -- specifically the iris, not the eyelash or eyebrow. The iris is the sharpest point to resolve and the most visually important element in a portrait. If one eye is slightly closer to the camera (subject at an angle), that eye must be sharp.
- **Single subject, both eyes at same depth:** Either eye. Most photographers default to the eye that carries more catchlight (light reflection visible as a small white spot in the iris) because catchlights add life to the portrait.
- **Group:** Focus on the face that is at the midpoint depth of the entire group. In a two-row arrangement, focus on the back of the front row or the front of the back row -- this places the sharpest zone through the middle of the group.

**AF mode selection:**

- **Eye-detection AF (Sony, Canon, Nikon, Fuji -- all modern mirrorless systems have this):** Use it for single subjects whenever available. It tracks the near eye in real time, handles subject movement, and eliminates the center-recompose error. Enable it for any aperture wider than f/2.8.
- **Single-point AF (stationary subject):** Place the AF point directly on the eye. Do not use center-point-focus-and-recompose at apertures wider than f/2.8. The recomposing arc shifts the focus plane by 2-6 inches depending on how far you recompose -- enough to miss an eye at f/1.8 -- f/2.0.
- **Continuous AF (moving subject, candid, walking shots):** Use face-tracking or eye-tracking continuous AF. Do not use zone AF or wide-area AF for portraits -- it will grab the nose, forehead, or clothing instead of the eye.
- **Manual focus (stationary subject, studio, tripod work):** Zoom the live view display to 100% magnification on the eye to confirm focus before shooting. Useful for critical headshot work where precision matters more than speed.

**Common focus failures and their causes:**

- Sharp ears, soft eyes: Focus was placed too far back. Usually caused by center-recompose at wide aperture, or AF tracking the hair or ear instead of the eye.
- Both eyes soft, background elements sharp: AF was not on the subject at all -- grabbed the wall, the background foliage, or a distant object. Use face or eye detection to prevent this.
- One eye sharp, the other soft: Subject's face is angled and the depth of field is narrower than the distance between the near and far eye. Stop down by one stop (f/2.0 to f/2.8, for example) or ask the subject to face the camera more directly.
- Eyelashes sharp, iris slightly soft: AF hit the eyelashes at f/1.4 -- f/1.8. Focus deeper into the eye, aiming for the center of the iris.

---

### Step 5: Determine shooting distance and camera height

Distance and camera height are often overlooked but fundamentally change the portrait's perspective and how flattering it is.

**Shooting distance by portrait type and focal length:**

| Portrait Type | Focal Length | Recommended Distance | Frame Fill |
|---|---|---|---|
| Tight headshot | 105mm | 8-12 feet | Eyes to collarbone fills the frame |
| Tight headshot | 85mm | 6-10 feet | Same result at slightly shorter distance |
| Head and shoulders | 85mm | 8-12 feet | Top of head to mid-chest |
| Half-body | 70mm | 7-10 feet | Waist to top of head |
| Full-body | 50mm | 12-18 feet | Full person with slight space above and below |
| Environmental | 35mm | 10-20 feet | Subject occupies roughly one-third of the frame, environment fills the rest |

**Camera height rules:**

- **Headshot and head-and-shoulders portraits:** Camera at eye level or 1-3 inches above eye level. Slightly above eye level creates a subtle downward angle that elongates the neck, minimizes the chin area, and creates a more polished look.
- **Full-body portraits:** Camera at mid-torso height (approximately 3-4 feet from the ground). This is lower than most photographers instinctively hold the camera. A camera held at eye level (5-6 feet) when shooting full-body creates a foreshortening effect that makes legs appear shorter.
- **Never from below:** Camera below chin level for headshots or half-body portraits produces double-chin compression and an unflattering upward angle. Avoid this in any serious portrait context.
- **Children's portraits:** Lower the camera to the child's eye level. Shooting down at children from adult standing height produces a diminutive, disconnected portrait. Kneel or sit on the ground.
- **Seated subjects:** Adjust camera to seated eye level. Do not shoot down at a seated subject from a standing position.

---

### Step 6: Direct the subject's expression

Natural-looking expressions come from conversational prompts and psychological techniques, not instructions. The word "smile" produces a social reflex -- the same tense, toothy grimace everyone has in their worst ID photo.

**Expression direction framework:**

**For warmth and genuine smiles:**
- "Think of the last time someone made you genuinely laugh -- and I don't mean politely laugh, I mean that uncontrollable laugh where you couldn't breathe." Wait for the memory to register, then shoot. The anticipation of the memory produces more natural expressions than recalling it.
- "Tell me about your favorite person." A short, genuine statement produces genuine warmth.
- "What was the most ridiculous thing that happened to you recently?" The slight embarrassment and amusement of telling the story produces layered expression.
- The pre-laugh moment: ask a genuinely funny question, shoot as the subject begins to react before the full smile appears. This captures the most natural version of a happy expression.

**For relaxed, serious, or professional expressions:**
- "Take a slow breath in through your nose. Now let it out through your mouth, even slower." The exhale relaxes jaw muscles, softens eye tension, and settles the shoulders. Shoot immediately after the exhale.
- "Look down at your feet. Close your eyes. When I say 'now,' look up at me." Count silently to 3, say "now." This produces a fresh, open-eyed, alert expression without the tension of holding a pose.
- Peter Hurley's squinch technique: "Slightly tighten the lower eyelid -- like you're squinting from the sun but only the lower half." This technique narrows the eye openness from wide-open (anxious) to slightly narrowed (confident). Wide-open eyes read as surprised or frightened; slightly squinched eyes read as engaged and confident.
- "Push your forehead slightly toward me." This micro-movement engages the neck muscles, creates jaw definition, and prevents the slack expression caused by a relaxed face.

**Between shots -- expression reset:**
- After 3-5 frames, the subject's expression becomes frozen or performative. Reset with: "Shake your shoulders out. Drop everything. Now -- look at me."
- The look-away reset: "Look over my shoulder at the tree for a second. Now back to me." This resets eye muscle tension and produces fresher eye contact.
- Use humor not for the expression itself but for the recovery. Say something surprising immediately after a bad shot. The genuine surprise reaction is often better than the posed smile.

**For professional subjects who over-perform:**
- Corporate subjects often have a "professional face" they put on for cameras -- slightly forced, overly composed. Say: "I need you to stop acting professional for one second and just look at me like I'm a colleague telling you something interesting." The shift from performance to conversation produces authentic expression.

---

### Step 7: Direct the pose

Posing is body architecture. Each element -- weight, angle, hands, chin, shoulders -- contributes to the overall read of the image. Good posing makes clothing fit better, body shapes slimmer, and subjects appear relaxed and confident simultaneously.

**The foundational posing sequence (apply in this order for every subject):**

1. **Weight placement first:** "Shift your weight to your back foot." For a subject standing with feet parallel (the default standing position), this is the single most impactful change. It creates a hip shift, relaxes the front shoulder, and produces a natural lean rather than a rigid stance.

2. **Body angle second:** Turn the body 30-45 degrees from the camera. The body angle matters more than the face angle for subject shape. A body angled 30-45 degrees appears slimmer because the camera sees the narrower side profile rather than the full frontal width. The wider the subject wants to appear, the more directly they should face the camera. The narrower, the more they should angle away.

3. **Face angle third:** Once the body is positioned, bring the face toward the camera. The classic portrait position is body at 45 degrees, face at 30 degrees from the lens -- the face returns more toward the camera than the body. This creates dimension without the frozen, straight-on look.

4. **Chin placement fourth:** "Push your chin slightly toward me, then bring it down just a fraction." This two-part move -- forward then down -- accomplishes two things: it extends and defines the jawline (the forward component) and prevents the chin-up angle that shows nostrils and creates neck compression (the down component). Virtually every subject benefits from this direction.

5. **Shoulder placement fifth:** "Roll your shoulders back and let them fall." Cameras read tense, raised shoulders as anxiety or discomfort. Dropped shoulders read as confidence. The verbal cue of "let them fall" produces a deeper drop than "relax your shoulders."

6. **Hands last:** Idle hands are the most common problem in portrait photography. Hands that have nothing to do -- hanging at the sides, stiffly placed on hips, symmetrically palmed on thighs -- look constructed and awkward. Give the subject's hands a task:
   - In front pockets with thumbs out (not fully pocketed -- the thumb creates a graceful leading edge)
   - One hand in pocket, one hand resting on the opposite forearm
   - Loosely clasped in front of the body (not tightly folded/arms-crossed)
   - Resting on a surface (table, ledge, railing) -- the hand conforms naturally to the surface
   - Holding a meaningful object (coffee cup, tool of their trade, book)
   - For headshots where hands are not in frame: have the subject hold something out of frame (a phone, a card) -- the act of holding an object relaxes the arms and prevents the tension of "just standing there"

**Posing adjustments by subject:**

- **Women (general):** The S-curve: weight shift creates a hip displacement, body angle creates a waist definition, slightly bent front knee (if full-body) adds an organic curve. Avoid squared-up, confrontational stances unless the purpose is editorial dominance.
- **Men (general):** Wider stance, more direct body angle. Leaning slightly forward at the waist (not backward) creates engagement and confidence. Jacket lapels pulled slightly outward with both hands creates a polished, CEO-portrait look.
- **Both shoulders the same height:** A very common posing error that makes the subject look rigid. One shoulder should always be slightly lower than the other. For women, the shoulder closest to the camera is typically lower. For men, either direction works depending on the look.
- **Seated subjects:** "Perch on the front third of the chair, don't sink into it." Sinking into a chair creates postural collapse that reads as defeated or uninspired. Perching on the front edge creates an engaged, upright posture naturally.

---

### Step 8: Structure the session flow

A portrait session should follow a progression from loose and exploratory to tight and decisive. Jumping between framings randomly disorients both the photographer and the subject.

**The standard portrait session arc:**

1. **Establish (first 10-15% of time):** Start wide. Full-body or environmental framing. This serves three purposes: the subject doesn't feel scrutinized by a tight lens while warming up, the photographer can read the subject's natural posture and movement, and test shots for exposure/light check cost nothing at this stage.

2. **Standard delivery (middle 50-60% of time):** Move to the primary portrait type requested. Head-and-shoulders for a headshot session. Half-body for most social portraits. Work through posing systematically (follow the 6-step sequence above). Work through expression prompts. Shoot 15-25 frames per posing variation before changing anything. This gives the editor (you or the client) real choice.

3. **Variation (next 20-25% of time):** Change one variable. Move the camera 2-3 feet to the left or right. Change the subject's body angle to the opposite side. Try the same lighting condition from a slightly different perspective. Two distinct looks from the same session location double the deliverable options.

4. **Strong finish (final 10-15% of time):** Return to the best-performing configuration from the session. By the end of the session, the subject is warmed up, the photographer knows what works, and the expression direction has been calibrated to this specific subject. The best frames of many sessions come in the final minutes. Don't end with experimentation -- end with execution.

---

## Output Format

When producing a portrait guide for a user, structure the output as follows:

```
## Portrait Guide: [Portrait Type] -- [Purpose]

**Subject:** [Description of subject or group]
**Portrait Type:** [tight headshot | head-and-shoulders | half-body | three-quarter | full-body | environmental | group]
**Location:** [studio | outdoor | indoor on-location | mixed]
**Purpose:** [professional headshot | LinkedIn | corporate | actor | social | family | engagement | editorial | event]

---

### Recommended Camera Settings

| Setting | Recommended Value | Rationale |
|---|---|---|
| Focal length | [Xmm] | [Why this focal length for this portrait type] |
| Aperture | f/[X] | [DOF rationale -- how many faces, what background effect] |
| Shutter speed | [1/[X]s minimum] | [Freeze subject movement at this focal length] |
| ISO | [Starting point] | [Exposure baseline for stated location/light] |
| AF mode | [Eye-detect | Single-point | Continuous face-track] | [Why for this subject] |
| Focus point | [Nearest eye | Center subject | Specific eye] | [Focus strategy] |
| Camera height | [Eye level | Slightly above | Mid-torso] | [Height rationale] |
| Shooting distance | [X -- Y feet] | [Distance to achieve correct framing at stated focal length] |

---

### Background Separation Strategy

- **Current background distance:** [Estimated feet from subject to background]
- **Recommendation:** [Move subject, change angle, use existing distance]
- **Expected bokeh at stated settings:** [Describe what background will look like]
- **Alternative if more separation needed:** [Specific adjustment]

---

### Posing Direction

**Step-by-step direction language:**

1. **Weight:** "[Exact verbal cue]"
2. **Body angle:** "[Exact verbal cue] -- [X] degrees from camera"
3. **Face:** "[Exact verbal cue]"
4. **Chin:** "[Exact verbal cue]"
5. **Shoulders:** "[Exact verbal cue]"
6. **Hands:** "[Exact verbal cue and placement]"

**Final check before shooting:**
- [ ] One shoulder lower than the other
- [ ] Chin forward and slightly down (not up, not retracted)
- [ ] Weight clearly on one foot, not evenly split
- [ ] Hands occupied or intentionally out of frame

---

### Expression Direction Prompts

**For warmth and approachability:**
- "[Conversational prompt 1]"
- "[Conversational prompt 2]"

**For professional/serious expression:**
- "[Breath or reset prompt]"
- "[Engagement prompt]"

**Expression reset between bursts:**
- "[Reset cue to use every 3-5 frames]"

---

### Session Flow

| Phase | Duration | Activity | Notes |
|---|---|---|---|
| Warm-up | [X min] | [Wide/establishing shots, exposure check] | [Subject comfort note] |
| Primary delivery | [X min] | [Main portrait type, posing sequence, expression direction] | [Key technique focus] |
| Variation | [X min] | [Angle change, body direction flip, expression series] | [What changes, what stays the same] |
| Strong finish | [X min] | [Return to best configuration, final expression prompts] | [Why this phase matters] |

---

### Common Mistakes to Avoid for This Session

- [ ] [Specific mistake 1 for this portrait type / location / subject]
- [ ] [Specific mistake 2]
- [ ] [Specific mistake 3]
- [ ] [Specific mistake 4]
- [ ] [Specific mistake 5]
```

---

## Rules

1. **Always focus on the nearest eye -- without exception.** A portrait where the nearest eye is sharp and the far ear is soft is a successful portrait. A portrait where the ear is sharp and the nearest eye is soft is unusable regardless of how good everything else is. When in doubt, stop down one stop to widen the in-focus zone across both eyes rather than gambling at the widest aperture.

2. **Never recommend a focal length shorter than 50mm (full-frame equivalent) for any portrait tighter than full-body.** At 35mm or shorter, the camera must get close enough to the subject to fill the frame, and at that distance, facial perspective distortion is visible and unflattering. Wide-angle distortion in a headshot is a fundamental technical error, not a stylistic choice.

3. **Always specify aperture relative to subject count.** A single-subject aperture recommendation is never safe for a group. f/1.8 for a group of four people will have at minimum one person with a soft face. The aperture floor rises with every additional person added to the group.

4. **Never recommend "center-focus-and-recompose" at apertures wider than f/2.8.** The arc of recomposing from center to off-center shifts the focus plane backward by a distance that depends on focal length and recompose angle. At 85mm f/1.8, recomposing 15 degrees off-center shifts the focus plane by approximately 3-6 inches -- easily enough to miss an eye. At f/2.8 this matters. At f/1.8 it consistently produces misses.

5. **Expression prompts must be conversational or scenario-based. Never use the word "smile" as a direction.** "Smile" produces a muscular reflex that looks forced in photographs. Natural smiles come from thought, memory, or genuine interaction. Every expression direction in this skill must be a prompt that produces a reaction, not an instruction that demands a performance.

6. **The chin-forward-and-down instruction is mandatory for all headshot and half-body portraits.** This single technique eliminates the most common portrait flattery problem (soft jawline/double chin) regardless of the subject's build. Omitting it in a headshot guide is an oversight.

7. **Camera height must be specified and must be appropriate to portrait type.** Camera below the subject's chin produces a perspective that compresses the chin area unfavorably. Camera significantly above eye level for tight headshots makes the subject appear small or childlike. Eye level or 1-3 inches above is the correct starting position for adult headshots.

8. **Shooting distance must be specified alongside every focal length recommendation.** Focal length alone does not determine perspective -- distance to subject determines perspective. The combination of focal length and distance determines both perspective and the resulting frame fill. A user told "use 85mm" without a distance may stand too close and still distort the face.

9. **Background separation recommendations must include background distance, not just aperture.** Aperture determines the degree of blur potential; background-to-subject distance determines how much of that potential is realized. A subject standing 2 feet in front of a wall will have a less blurred background than the same subject at f/1.8 with the wall 30 feet away. Both variables must be addressed.

10. **Session flow must always progress from wider and exploratory to tighter and decisive.** Starting a session with a tight 85mm headshot while the subject is still nervous, stiff, and unwarmed produces technically correct but expressively flat portraits. The warm-up phase at wider framing is not optional -- it serves a psychological purpose in the subject's comfort arc that directly improves the quality of the tighter frames that follow.

11. **All recommendations must be camera system-agnostic.** Refer to aperture, focal length, and f-stop numbers. Reference eye-detection AF and face-tracking AF as generic features (present on virtually all modern mirrorless systems) without brand-specific menu navigation instructions.

12. **When a user's available lens is suboptimal for their stated portrait type, explicitly address the mismatch before providing other guidance.** If a user has a 24-70mm f/4 kit lens and wants tight headshots, they need to know the 70mm end is usable but the f/4 aperture limits background separation significantly -- before receiving posing tips. The gear constraint shapes every downstream recommendation.

---

## Edge Cases

**Subject who is uncomfortable, camera-shy, or anxious:**
Start at the widest framing available (full-body or environmental). At this distance, the subject is smaller in the frame and feels less scrutinized. Maintain a continuous, low-key conversation about topics entirely unrelated to photography -- their work, a recent trip, a common interest. The goal is to make the camera irrelevant in the interaction. Progress to tighter framing only after 5-10 minutes of warmer interaction. At tight headshot distance, an anxious subject will have visibly tense shoulders, wide eyes, and a rigid jaw -- all of which are visible in the photograph. Use the breathing reset technique (slow inhale, slower exhale) before every series of tight shots. Expect to shoot 40-50% more frames than with a relaxed subject and select the 3-5 best expressions from a larger pool.

**Group with significant height differences (adults and children mixed, or wide height range in adults):**
Arrange subjects in layers but prioritize keeping all faces at the same focal plane depth, not just the same height. A tall adult standing at the back and a seated child in the front can both be at the same focal plane if the arrangement is managed correctly. Use posing tools -- steps, stools, seated arrangements -- to bring faces to the same level when photographically necessary. For a standing group with height differences, have taller subjects sit on a low bench while shorter subjects stand. For very large groups, shoot from a slightly elevated position (a stepladder) to reduce the apparent height spread and flatten the group into a more workable depth plane. At f/8 and above, height arrangement matters less than depth arrangement.

**Outdoor portrait in harsh midday sun (10am -- 3pm in most latitudes):**
Direct overhead sun produces the worst possible portrait light: deep shadows under the eyes (raccoon eyes), harsh nose shadow, flat unflattering skin texture, and subject squinting. First solution: find open shade. A building edge, a covered porch, under tree canopy, inside a parking garage. Open shade provides soft, directional light from the sky without direct sun harshness. Second solution if shade is unavailable: position the subject with the sun behind them to use it as a hair light and rim light, then use a reflector or off-camera flash to fill the face. This transforms the problem (bright sun) into a tool (backlight) and solves the harshness. Third option: tilt the subject's chin down and use a reflector below the chin pointing up -- this fills the eye shadows from below. Do not attempt to use direct overhead sun as a key light in any portrait context.

**Subject wearing glasses:**
Glasses create two distinct problems: lens reflections (from light sources) and distortion of the eyes through thick lenses. For reflections: tilt the glasses slightly downward by gently bending the earpieces -- this angles the lens surface away from the key light and redirects reflections out of the camera's line of sight. Alternatively, raise the key light source higher (above the glasses' reflective angle to the camera) to push the reflection off the upper rim rather than the center of the lens. If neither resolves the issue, have the subject remove the lenses from the frames and shoot without lenses (the frames define their look without the reflection problem). For thick corrective lenses that magnify or minimize the eyes: this is an optical property of the lens and cannot be eliminated through photography technique. Position the camera directly at eye level so the optical distortion is minimized (shooting at an angle to thick lenses worsens the apparent distortion).

**Self-portrait (photographer is subject):**
Mount the camera on a tripod at eye level. Set a 10-second self-timer or use a wireless remote shutter release (Bluetooth remote triggers are inexpensive and available for all camera systems). Pre-focus using a stand-in: place an object (a light stand, a bag) at the exact spot where you will stand, focus on it manually or with single-shot AF, then switch the lens to manual focus to lock the position. Mark your standing position with a piece of tape on the ground. Enable face or eye detection AF in continuous mode as a safety net for slight position variation. Shoot in continuous burst mode (not single frame) so each remote press produces 5-10 frames -- this captures expression variation across the burst. Expect a higher rejection rate than directed portrait work because there is no feedback loop during the shoot. Review frames in playback and adjust position, chin angle, and expression direction for the next series.

**Portrait with unavoidable distracting background (shooting on location without background control):**
When background control is impossible (office environment, event venue, outdoors in a busy public space), use three techniques in combination. First, maximize aperture to blur the background as much as possible given subject count constraints. Second, move the subject as far as possible from the background elements -- even 5 additional feet of subject-to-background distance significantly increases background blur at wide apertures. Third, change camera angle to replace distracting backgrounds with cleaner ones -- shooting downward at a seated subject with the floor as background, or shooting upward at a subject with the sky or ceiling as background. A clean, featureless background is always preferable to a "interesting" background that competes with the subject's face.

**Portrait in low light without flash (indoor, evening, available light only):**
At ISO 3200-6400 on a modern full-frame or APS-C camera, noise is manageable. At 85mm, the minimum shutter speed to freeze subject movement is 1/100s -- 1/160s (the reciprocal rule -- 1/focal length -- is the minimum; for portraits where small movements matter, double it). Open the aperture as wide as depth-of-field constraints allow. If on a tripod, a stationary subject can be photographed at 1/30s -- but any subject movement (breathing, slight body sway) will create motion blur. Use continuous AF because subject micro-movements at close distance will shift focus enough to miss the eye at wide apertures. Position the subject near the strongest available light source in the room -- a window, a practical lamp, an illuminated screen -- and treat this as a makeshift directional light.

**Portrait in full sun with a lens that does not reach high shutter speeds at wide aperture (sync speed limitation with flash):**
Without flash, this is purely an exposure issue: at f/2.0 in full sun at ISO 100, the correct exposure may be 1/8000s or faster -- beyond some cameras' maximum shutter speed. Use a Neutral Density (ND) filter (3-stop or 6-stop) to reduce exposure by the equivalent of 3-6 stops, allowing wide aperture shooting in bright sun without overexposure. A 6-stop ND filter at f/2.0 in full sun at ISO 100 reduces the required shutter speed from 1/8000s to 1/125s -- within the normal range of any camera.

---

## Example

**Input:** "I need to take a professional headshot for my colleague. We're shooting indoors at the office -- a tech company. She needs a LinkedIn headshot. I have a 50mm f/1.8 lens on a full-frame mirrorless camera and there's a plain gray wall in the conference room we can use. She's a bit nervous about being photographed. She wears glasses."

**Output:**

## Portrait Guide: Professional LinkedIn Headshot -- Indoor Office

**Subject:** Woman, professional, glasses, camera-shy
**Portrait Type:** Head and shoulders (top of head to mid-chest)
**Location:** Indoor, on-location -- office conference room
**Purpose:** LinkedIn profile headshot

---

### Recommended Camera Settings

| Setting | Recommended Value | Rationale |
|---|---|---|
| Focal length | 50mm | The only lens available. 50mm is at the lower edge of the flattering range for a headshot -- compensate by shooting from slightly further away (8-10 feet) to improve facial perspective. At 10 feet on a full-frame camera, 50mm produces head-and-shoulders framing with less distortion than at 6 feet. |
| Aperture | f/2.0 -- f/2.5 | Single subject, stationary -- use wide aperture for background separation. At 50mm f/2.0 at 8 feet, DOF is approximately 12-15 inches -- enough for both eyes to be sharp. Opening to f/1.8 at 50mm narrows DOF to roughly 8-10 inches, still workable but less forgiving. |
| Shutter speed | 1/100s minimum (1/160s preferred) | Freeze micro-movements at this distance. Subject motion (breathing, head sway) is the primary motion risk, not camera shake with a mirrorless at 50mm. |
| ISO | 400 -- 1600 | Depends on office light level. Expose to the right of the histogram without clipping highlights. Indoor offices commonly need ISO 800 -- 1600 at f/2.0 with typical fluorescent or LED overhead lighting. |
| AF mode | Eye-detection AF (continuous) | Subject is nervous and may move. Continuous eye detection handles micro-movements and ensures the nearest eye is tracked even with slight head turns. At f/2.0, manual AF point recomposition risks missing the eye. |
| Focus point | Nearest eye, tracked by eye-detect AF | Enable eye-detection on the camera. If eye-detect struggles with the glasses (some cameras briefly lose tracking at glasses reflections), switch to single-point AF placed directly on the near eye iris. |
| Camera height | 1-2 inches above eye level | Creates a subtle downward angle that elongates the neck and creates a composed, confident impression. Do not go higher than 3 inches above eye level -- excessive height makes the subject appear small. |
| Shooting distance | 8-10 feet from subject | At 50mm on full-frame at 10 feet, head-and-shoulders fills the frame with natural-looking facial perspective. Closer than 6 feet at 50mm begins to introduce visible wide-angle distortion in facial features. |

---

### Background Separation Strategy

- **Current background:** Plain gray conference room wall -- this is actually ideal. Featureless background requires no additional management.
- **Optimal subject-to-wall distance:** Move the subject 6-10 feet from the gray wall. At f/2.0 and 50mm with 8 feet of background distance, the wall will blur to a smooth, uniform gray tone with no texture visible -- clean and professional.
- **If the room is too small to achieve 6 feet of subject-to-wall distance:** Still workable at 3-4 feet. The wall will be less blurred but a plain gray wall even at f/2.0 with limited background distance reads as a professional studio backdrop -- this is not a problem in the same way a textured or busy background would be.
- **Avoid:** Office clutter in the background behind the subject if using a different wall. The gray conference room wall is the best available option -- use it.

---

### Glasses Management

- Before shooting begins, gently tilt the earpieces of her glasses slightly downward (the temples that rest behind the ears). This tilts the lens surface forward, redirecting reflections from overhead lighting downward and out of the lens.
- If the office has overhead fluorescent or LED panels, position her slightly to the side of the light source rather than directly beneath it. The reflection angle from a light source directly overhead will appear in the top portion of the lenses.
- Ask her to sit or stand with her face slightly angled (30 degrees from camera) -- this angles the glasses lens surface and reduces the camera-facing reflection area.
- If reflections persist: have her tilt her chin down 5-10 degrees. This angles the glasses lens downward and physically redirects the overhead reflection below the camera's line of sight.
- Test: before the main shoot, take a test frame and zoom into the lenses at 100% in playback. If reflections are present, adjust before the session proceeds.

---

### Posing Direction (step-by-step verbal cues)

1. **Weight:** "Shift your weight onto your right foot. Let your left foot relax -- you can even lift the heel slightly." (This creates a natural hip shift that breaks rigid symmetry.)

2. **Body angle:** "Turn your body so your right shoulder points slightly toward me -- maybe 30 degrees." (Body at 30-35 degrees from camera; this is enough to create slimming but not so much that she feels twisted.)

3. **Face:** "Now turn your face back toward me. So your body is on an angle but your eyes are looking right at me." (Face at 15-20 degrees from camera.)

4. **Chin:** "Push your chin slightly toward me -- like you're leaning in to hear something. Now bring it just a tiny bit down. Perfect." (The forward-and-down move. Confirm her jawline is defined. If it's still soft, ask for slightly more forward.)

5. **Shoulders:** "Roll your shoulders back, and then just let them drop completely. Like you just got home and sat down on the couch." (The word "drop" produces a deeper release than "relax.")

6. **Hands:** Since this is a head-and-shoulders crop, hands will not appear in frame. To prevent arm tension showing in the shoulders: "Hold your phone in your left hand at your side." The act of holding something relaxes the arms naturally and prevents the "what do I do with my hands" anxiety from reaching the shoulders.

**Pre-shoot checklist:**
- [ ] Left shoulder slightly lower than right (or one visibly lower than the other)
- [ ] Chin pushed forward and angled down -- jawline visible
- [ ] Weight clearly on back foot -- natural lean
- [ ] Shoulders dropped, not elevated toward ears
- [ ] No glasses reflections visible in test frame

---

### Expression Direction

**Because she is nervous, start every series with a reset before going into expression prompts.**

**Reset protocol:** "Take a breath in through your nose -- slow. Now let it out through your mouth even slower. Good. Now look at me."

**For warmth and approachability (LinkedIn wants friendly and professional):**
- "Tell me the best part of working here. What's something you actually like about the job?" Wait for her to begin answering -- shoot during the answer, not after. The engaged, thoughtful look while forming an answer is more natural than any posed smile.
- "Think about landing this role -- the moment you knew you got the job. Not the polished version, the actual moment." The mix of pride and relief produces layered, genuine warmth.

**For the professional/confident expression:**
- "Take a breath and let it out. Now -- push your forehead slightly toward me. Good. Keep looking at me." (Breathing resets tension; the chin-forward engagement creates a confident, direct expression.)
- "Squint your lower eyelids up just slightly -- like you're in slight sun. Just the bottom, not the top." (Peter Hurley squinch technique. Creates confident narrowing of the eye that reads as engagement rather than openness or surprise.)

**Expression reset between every 5 frames:**
- "Look down at the floor for a second. Now -- look right at me." (This look-up produces a fresh open expression and resets held-smile tension.)

**Handling the nervous subject specifically:**
- Do not point out that she looks nervous -- this compounds anxiety. Instead, talk about the subject matter of the prompts and let the conversation do the work.
- After the first 5 minutes, show her 2-3 frames on the camera screen. Choose the most flattering frame to show her. Seeing a good image of herself early in the session dramatically reduces camera anxiety and improves subsequent frames.
- If she stiffens up or expression goes flat: step back from the camera and have a 30-second completely off-topic conversation. Return to the camera after she's re-relaxed.

---

### Session Flow

| Phase | Duration | Activity | Notes |
|---|---|---|---|
| Setup and test | 3-5 min | Position subject and camera, check exposure, test frame for glasses reflections and background separation | Adjust glasses tilt, confirm wall distance, solve any reflection issues before session starts |
| Warm-up | 5-7 min | Slightly wider framing (waist-to-head). Work through posing sequence. Keep conversation going. | She is nervous -- this phase is about relaxing her, not getting the shot. No pressure on expression yet. |
| Primary delivery | 10-15 min | Tighten to head-and-shoulders framing. Work expression prompts systematically. Shoot 15-20 frames per prompt series. Show her a flattering frame after the first few minutes. | This is where the best frames will come. Take time with each prompt -- don't rush through them. |
| Variation | 5 min | Move camera 2-3 feet to her left for a second look. Slightly change her body direction to angle the other way. | Two different looks from the same session location. |
| Strong finish | 3-5 min | Return to the first angle (the one that produced the best frames). Run through the look-down-look-up reset 4-5 times with minimal other direction. | By this point she is warm. These final frames often deliver the best expressions of the session. |

---

### Common Mistakes to Avoid for This Session

- [ ] **Shooting closer than 8 feet at 50mm** -- perspective distortion becomes noticeable at 5-6 feet with a 50mm lens on a headshot. Stay at 8-10 feet and crop in post if needed.
- [ ] **Not checking for glasses reflections before the main shoot** -- a test frame and a 30-second glasses adjustment saves re-shooting an entire session.
- [ ] **Saying "smile" or "look happy"** -- she is already nervous. An instruction to perform an emotion produces a tense, forced expression. Use the conversational prompts above.
- [ ] **Chin too high** -- this is especially common with nervous subjects who instinctively raise the chin to seem confident. High chin shows nostrils, compresses the neck, and reads as arrogant rather than confident. Bring the chin forward and down before every series.
- [ ] **Shooting from slightly below eye level** -- in a conference room, the table height may tempt the photographer to shoot from a lower position. Camera must be at or above eye level for a professional headshot. Stand up fully; use the height.
- [ ] **Symmetrical, stiff body position** -- if the posing sequence was not completed, the subject may default to standing with both feet together, shoulders even, facing directly at the camera. This reads as a passport photo. The 30-degree body angle and weight shift are non-negotiable for a natural result.
- [ ] **Rushing through the session** -- a nervous subject in a 10-minute shoot will produce 10 minutes of nervous frames. Budget at least 25-30 minutes including warm-up. The quality of the final frames scales directly with the time given to the warm-up phase.
