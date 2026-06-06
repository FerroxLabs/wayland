---
name: video-storyboard
description: |
  Produces a video storyboard as a shot-by-shot table with shot type, camera
  movement, subject action, audio notes, and duration for each shot. Use when
  the user asks to create a storyboard, plan video shots, build a shot list,
  or visualize a video sequence before filming.
  Do NOT use for writing video dialogue or narration (use video-script-writing),
  YouTube metadata strategy (use youtube-video-strategy), or short-form video
  hooks (use short-form-video-planning).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "video-production planning template"
  category: "design-creative"
  subcategory: "video-audio"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Video Storyboard

## When to Use

Use this skill when the user needs a structured, shot-by-shot visual plan for a video production -- before a single frame is filmed or animated.

**Trigger scenarios:**
- User asks to storyboard a video concept, ad, demo, explainer, or branded film and needs the result as a shot table rather than a script
- User has a script or creative brief and needs it translated into production-ready camera direction -- shot types, movements, durations, and audio cues
- User needs a shot list to hand to a director of photography, videographer, or editor who has not yet read the concept
- User is preparing a pre-production package and needs a visual planning document to accompany a treatment or script
- User wants to pressure-test a video concept for pacing problems, missing coverage, or duration overruns before committing to a shoot day
- User is coordinating a multi-camera production (interview, live event, panel) and needs to assign camera roles per shot
- User needs to pitch a video concept to a client, brand stakeholder, or producer and wants a professional pre-visualization document

**Do NOT use when:**
- User needs spoken dialogue, on-camera narration text, or scripted voiceover copy -- use `video-script-writing` instead
- User is planning a YouTube video's title, thumbnail, tags, or SEO strategy -- use `youtube-video-strategy` instead
- User needs a hook, caption, or content flow for a sub-60-second social reel or TikTok -- use `short-form-video-planning` instead
- User only wants a single-paragraph video treatment or concept summary -- that is a creative brief, not a storyboard
- User is asking for video editing instructions, color grading decisions, or post-production workflows -- this skill ends at pre-production
- User needs a podcast or audio-only production plan -- there is no visual component to storyboard

---

## Process

### Step 1: Extract the Production Brief

Before designing a single shot, gather all inputs that constrain the production. Missing information at this stage causes structural rework later.

- **Required inputs:** Video concept or script (even a paragraph summary works), target duration, intended platform or distribution format, video style (commercial, narrative, tutorial, documentary, talking-head, montage, explainer/animation), and intended audience
- **Equipment constraints:** Single vs. multi-camera, availability of stabilization (gimbal, dolly, slider, crane/jib, drone), lighting setup (natural only, studio, on-location), and lens availability -- these dictate which shots are physically possible
- **Subject count:** Number of on-camera people, products, or objects that need to appear. More subjects per scene means more coverage shots needed
- **Location count:** Each physical location requires its own scene block. More locations add logistical complexity and setup time that affects the shot count per scene
- **If inputs are incomplete:** Do not stall. Build the storyboard based on reasonable assumptions for the stated video style, then flag each assumption explicitly in a "Production Assumptions" block at the top of the output. Ask the user to confirm or correct them.
- **Identify the single most important visual moment:** Every effective video has one "hero moment" -- the shot the whole piece builds toward. Identify it early and protect it in the structure.

---

### Step 2: Establish Scene Architecture

Scenes are continuous sequences in a single physical location or a contiguous time block. Breaking the concept into scenes before designing shots prevents coverage gaps.

- **Scene count benchmarks by duration:** A 60-second commercial typically has 3--5 scenes; a 2--3 minute product demo has 4--7 scenes; a 5--8 minute tutorial or documentary-style video has 6--12 scenes. More scenes than these benchmarks means fragmented storytelling -- fewer means insufficient visual variety
- **Assign a narrative function to every scene:** Set-up/problem, product/solution introduction, feature demonstration, social proof or testimonial, benefit summary, and call-to-action are the standard commercial narrative blocks. Documentary and narrative fiction use: establishing, inciting incident, rising action, climax, and resolution. Every scene must earn its place by advancing one of these functions
- **Label each scene with:** Scene number, location, lighting condition (natural/artificial, time of day, quality: hard/soft), and narrative purpose (what the viewer learns or feels by the end of this scene)
- **Estimate scene duration in proportion to narrative weight:** Introductory and CTA scenes are typically 10--20% of total duration each. Core demonstration or story scenes carry 50--60%. Don't allocate equal time to all scenes -- that creates flat pacing
- **Flag location-change transitions early:** Moving from a controlled studio environment to a natural location mid-shoot requires a wardrobe, prop, and continuity plan. Note these dependencies before designing shots

---

### Step 3: Design Individual Shots Within Each Scene

Each shot is a single continuous recording from one camera position. Design shots to serve the scene's narrative function -- not to show off technique.

- **Shot type vocabulary -- use these exact terms:**
  - **EWS (Extreme Wide Shot):** Full environment, subject is small or absent. Used to establish geography or scale
  - **WS (Wide Shot):** Subject full-body visible with significant environment. Used to establish location and body language
  - **MS (Medium Shot):** Waist to head. Used for conversational scenes and product context
  - **MCU (Medium Close-Up):** Chest to head. The workhorse shot for interviews and dialogue -- most broadcast news uses MCU as default
  - **CU (Close-Up):** Face fills frame, or a product feature fills frame. Used for emotional peaks and critical detail
  - **ECU (Extreme Close-Up):** Single feature: eyes, hands, a button, a texture, a label. Used to isolate detail that a CU cannot isolate
  - **Insert:** A cutaway shot of an object or action directly referenced in the scene. Not a character shot -- a thing shot (a phone screen, a key turning, a signature on paper)
  - **OTS (Over-the-Shoulder):** Camera behind one subject's shoulder looking at another. Standard for two-person interactions
  - **POV (Point of View):** Camera placed where the subject's eyes would be. Creates first-person immersion
  - **Aerial/Drone:** High-angle shot establishing geography from above. Requires specific equipment and permits in many jurisdictions

- **Camera movement vocabulary -- use these exact terms:**
  - **Static:** Camera locked on tripod. Zero movement. The default for interview and product shots
  - **Pan left / Pan right:** Horizontal rotation on a fixed axis. Used to reveal environment or follow lateral movement
  - **Tilt up / Tilt down:** Vertical rotation on a fixed axis. Used for reveals and to convey scale
  - **Track forward / Track back:** Camera physically moves toward or away from subject on a linear path. Requires dolly, slider, or gimbal. Distinct from zoom -- perspective changes
  - **Dolly left / Dolly right:** Lateral physical movement of the entire camera. Creates parallax depth
  - **Handheld:** Camera operator holds camera without stabilization. Introduces organic movement and energy. Use deliberately for tension, not as a default
  - **Gimbal:** Motorized 3-axis stabilization. Allows movement without shake. The modern substitute for a dolly on smaller productions
  - **Crane / Jib up / Jib down:** Camera rises or descends on an arm. Creates dramatic reveals and authority
  - **Zoom in / Zoom out:** Focal length change without physical camera movement. Perspective does NOT change. Use sparingly -- it reads as a stylistic choice, not neutral coverage

- **Subject action must be specific and active:** "Person speaks" is not an action. "Person picks up bottle, reads the label, then sets it down" is. Every shot should describe what is physically happening in the frame
- **Assign duration in whole seconds, minimum 2 seconds per shot:** Wide establishing shots typically run 4--6 seconds. Dialogue or demo shots run 3--8 seconds. ECU and insert shots run 2--4 seconds. CTA end cards run 4--8 seconds
- **Handle time:** Add 1--2 seconds to every shot's duration estimate as buffer for editing. A 4-second shot should be filmed as 6 seconds. Note handle time in the Production Summary, not per-shot

---

### Step 4: Apply Shot Construction Rules for Visual Grammar

These are not aesthetic preferences -- they are the established principles of visual continuity and pacing that professional editors and directors use to keep audiences oriented.

- **The 180-degree rule:** In any scene with two subjects or a moving subject, pick one side of the action and never cross it with the camera. Crossing the axis reverses left-right spatial relationships and disorients the viewer. Note the axis in the scene header for complex scenes
- **Shot size jumps:** When cutting between two shots of the same subject, the shot size must change by at least two levels (e.g., MS to CU, not MS to MCU). Cutting between similar framings of the same subject creates a "jump cut" that reads as a mistake unless it is an intentional stylistic choice (music video, talking-head energy)
- **The rule of thirds:** Subjects should be framed so their eyes (or the primary visual element) are on the upper third intersection, not dead center. Note this as a framing instruction in the shot's Notes column when it matters for the shot type
- **Shot variety rhythm:** No more than 2--3 consecutive shots of the same size (e.g., three MCUs in a row flattens energy). Alternate between wider shots for context and tighter shots for detail. A useful default rhythm: WS → MS → CU → Insert → MS is a complete coverage block for one action
- **Every scene must have an establishing shot:** The first shot of a new location must orient the viewer geographically. This is non-negotiable. The only exception is an intentional mystery reveal where location ambiguity is a narrative device
- **Eye-line matching:** If subject A looks screen-right in Shot X, subject B (who A is looking at) must look screen-left in the next shot. Mismatched eye-lines break spatial logic
- **Lead room and head room:** In moving subjects, camera framing must leave space in the direction of movement (lead room) and appropriate space above the subject's head (head room). Note framing adjustments in the Notes column

---

### Step 5: Write Audio Notes for Every Shot

Audio design happens in pre-production, not in post. Every shot needs an audio annotation that guides both the production shoot and the editor.

- **Audio source types:** Sync sound (live microphone recorded on location), voiceover/VO (narration recorded separately), music (background or featured track), ambient/nat sound (room tone, environment noise), SFX (specific sound effects: notification ping, mechanical click, crowd murmur), and silence (intentional audio absence for impact)
- **Voiceover timing:** If a shot carries VO, quote the first and last word of the VO that plays over it (e.g., VO: "Most people forget to..." → "...until it's too late."). This links the storyboard to the script and lets an editor know what line the shot must support
- **Music notes:** Specify the emotional quality needed (driving, uplifting, tense, sparse, warm) and the structural moment in the music (music begins, music builds, drop, peak, music fades out). Do not name specific songs -- describe the function
- **Ambient sound:** For location shots, always note "record room tone for 30 seconds at start of scene setup." This is a production instruction that prevents dead silence in the edit
- **Sync dialogue:** If a subject speaks on camera, note the first few words of their line so the storyboard is linked to the script. If dialogue is unscripted, mark as "improvised dialogue" and note the topic (e.g., "improvised: subject describes their morning routine")
- **J-cut and L-cut flags:** When audio from the next scene should begin before the visual cut (J-cut) or continue past the visual cut (L-cut), mark this in the Transition block between scenes. These are some of the most powerful editorial decisions and they must be planned, not discovered in post

---

### Step 6: Calculate Duration and Flag Coverage Risks

A storyboard that runs 40% over target duration is not production-ready. Duration math is part of the deliverable.

- **Sum all shot durations** and compare to the target. Report both figures
- **Acceptable tolerance:** Within ±15% of target is production-ready. 15--25% over: mark lowest-priority shots as "OPTIONAL CUT" in the Notes column. More than 25% over: restructure scenes, not just individual shots
- **Coverage ratio:** Every scene should have enough shots to give the editor meaningful choices. A 10-second scene with one 10-second shot gives the editor zero flexibility. Plan a minimum of 3 shots per scene. Documentary and interview scenes should have 2x coverage (enough shots to edit down to 50% of raw duration)
- **Estimated shoot time formula:** Total planned video duration × 6 to 10 = realistic shoot time in minutes. A 90-second video requires a 9--15 minute shooting window of actual recording time, but total production hours (travel, setup, direction, retakes, teardown) are much longer -- estimate 3--5 hours per location for a small crew, 6--10 hours per location for a full crew
- **Per-shot setup time benchmark:** Simple static talking-head shots take 5--10 minutes to set up per setup. Product shots on a controlled surface: 15--30 minutes. Multi-light setups or camera movement rigs: 30--60 minutes per setup. Use these benchmarks to produce the "Estimated Shoot Time" figure in the Production Summary
- **Flag missing coverage types:** If no B-roll or insert shots exist in a scene that will require editing, flag it. A talking-head interview with no insert shots or cutaways cannot be edited -- the editor has no way to cut around mistakes or pauses

---

### Step 7: Define Scene Transitions and Overall Flow

The transitions between scenes are pre-production editorial decisions. They define pacing and tone.

- **Cut (hard cut):** Immediate jump from last frame of one scene to first frame of next. The default for commercial, tutorial, and high-energy content. Implies continuity of time or a sharp shift
- **Dissolve (cross-dissolve):** Gradual blend between two scenes. Signals passage of time, memory, or a softer emotional transition. Overused in amateur work -- use deliberately
- **Match cut:** The outgoing and incoming shots share a visual or conceptual element (a spinning wheel dissolves to a spinning gear; an open hand reaches toward camera and the next scene opens with a hand extending in greeting). The most sophisticated transition and should be planned at storyboard stage
- **J-cut:** Audio from Scene 2 begins before the visual cut from Scene 1. Pulls the viewer forward emotionally. Very effective for documentary and narrative work
- **L-cut:** Audio from Scene 1 continues over the first frames of Scene 2. Creates reflective, contemplative pacing. Common in interview documentaries
- **Wipe / Graphic transition:** A stylistic transition (a brand color wipe, a logo reveal). Note the direction (left-to-right, top-to-bottom) and style
- **Smash cut:** An abrupt, unexpected cut used for comedy or shock. The outgoing and incoming shots have maximum tonal contrast

---

### Step 8: Write the Production Summary

The Production Summary converts the storyboard into a production logistics brief. This is the document a producer uses to schedule, budget, and staff a shoot.

- **Total shots and total planned duration**
- **Estimated shoot time per location** (using the formula from Step 6)
- **Equipment list:** Camera body type (mirrorless, cinema camera, phone), stabilization needed (tripod, gimbal, dolly, drone), lens requirements (wide angle for EWS, standard for MS/MCU, macro or telephoto for ECU/Insert), lighting (natural, portable LED panel, softbox, practical)
- **Props and set dressing per scene**
- **Wardrobe continuity notes:** If a subject appears across multiple locations in a single-day shoot, note whether they must maintain the same outfit for continuity
- **Talent notes:** Number of on-camera subjects per scene, any doubles or stand-ins needed
- **Permits and access notes:** Outdoor locations, public spaces, and aerial shots often require permits. Flag these risks explicitly

---

## Output Format

```
## Video Storyboard: [Video Title]

### Production Assumptions
[List any assumptions made where inputs were missing or ambiguous]

---

### Brief Summary
**Target Duration:** [MM:SS]
**Platform / Format:** [broadcast | social | web | internal | pitch]
**Style:** [commercial | narrative | tutorial | documentary | talking-head | montage | explainer]
**Total Scenes:** [count]
**Total Shots:** [count]
**Total Planned Duration:** [MM:SS] ([over/under/within] target by [X]%)
**Audience:** [one-sentence description]

---

### Scene [N]: [Scene Title]
**Location:** [specific location]
**Lighting:** [natural/artificial, quality: soft/hard, time of day or color temperature]
**Narrative Purpose:** [what the viewer learns or feels by the end of this scene]
**Scene Duration:** [estimated seconds]

| Shot | Type | Movement | Subject Action | Audio | Duration | Notes |
|------|------|----------|----------------|-------|----------|-------|
| [N]A | [type] | [movement] | [specific action] | [source: content] | [X]s | [framing, prop, continuity] |
| [N]B | [type] | [movement] | [specific action] | [source: content] | [X]s | [framing, prop, continuity] |
| [N]C | [type] | [movement] | [specific action] | [source: content] | [X]s | [framing, prop, continuity] |

**Scene [N] Total:** [X]s
**Transition to Scene [N+1]:** [transition type] -- [description of how the transition works visually/aurally]

---

[Repeat Scene block for each scene]

---

### Production Summary

**Shot Totals**
- Total shots: [count]
- Total planned duration: [MM:SS]
- Handle time buffer: +[X]s per shot ([total] seconds total)
- Estimated raw footage duration: [MM:SS]

**Schedule Estimate**
| Location | Shot Count | Setup Type | Estimated Shoot Time |
|----------|------------|------------|----------------------|
| [location] | [count] | [static/movement/product] | [X hours] |
| [location] | [count] | [static/movement/product] | [X hours] |
| **Total** | [count] | -- | [X hours] |

**Equipment Requirements**
- Camera: [type recommendation based on style and shot requirements]
- Stabilization: [tripod / gimbal / dolly / slider / handheld rig / none required]
- Lenses: [focal lengths needed based on shot types specified]
- Lighting: [natural / portable LED / softbox / practical / mixed]
- Audio: [on-camera mic / lavalier / boom / no sync audio needed]

**Assets and Props**
- Props: [itemized list per scene]
- Set dressing: [per scene]
- Screen/UI assets: [phone mockups, app screenshots, screen recordings if needed]

**Talent and Wardrobe**
- On-camera subjects: [count and description]
- Wardrobe continuity: [same outfit across scenes? changes flagged?]
- Continuity risk shots: [shots where matching is critical]

**Coverage Risks**
- [Flag any scenes with fewer than 3 shots]
- [Flag any scenes with no B-roll or insert coverage]
- [Flag any required permits, location access, or equipment not yet confirmed]
- [Flag optional cut shots if duration exceeded target by more than 15%]
```

---

## Rules

1. **Never design a shot that cannot be physically executed.** If the user has stated "no dolly," do not specify a dolly shot. If natural-light-only is the constraint, do not specify a softbox or studio light setup. Every shot in the storyboard must be achievable with the stated equipment
2. **Never place two shots of the same size back to back unless a jump cut is intentional.** Consecutive WS → WS or MCU → MCU of the same subject creates an editing dead end. The shot size must jump by at least two levels or the camera angle must change by at least 30 degrees
3. **Every scene must open with an establishing shot.** The only valid exception is when location ambiguity is a deliberate narrative device -- and that intent must be noted explicitly in the scene's Narrative Purpose field
4. **Every shot must have a specific, active subject description.** "Person stands" or "product is shown" are not acceptable actions. Describe what physically changes during the shot: movement, gesture, interaction with an object, facial expression shift, or a process step
5. **Audio must be annotated for every single shot.** Silence is a valid audio note but must be written as "Silence (intentional)" -- not left blank. A blank audio field means the storyboard is incomplete
6. **Duration minimums are enforced:** 2 seconds minimum for any shot. ECU and insert shots are typically 2--4 seconds. If a shot duration is under 2 seconds, the shot exists only as a stylistic flash cut -- mark it as such and justify it
7. **The 180-degree rule must be respected across the entire storyboard.** In scenes with two subjects or a moving camera following a subject in one direction, note the axis. Crossing the axis without flagging it as intentional is a production error that creates an unusable edit
8. **Scene transitions must be specified with enough detail to execute.** "Cut" is sufficient. "Dissolve" needs a duration note (fast 12-frame dissolve vs. slow 48-frame dissolve). A match cut must identify the shared visual element in both the outgoing and incoming shot descriptions
9. **The Production Summary is mandatory, not optional.** A storyboard without a Production Summary is an incomplete pre-production document. The summary must include shot counts, duration math, estimated shoot time, and equipment requirements
10. **Optional cut shots must be marked explicitly when total duration exceeds target by more than 15%.** Marking them "OPTIONAL CUT" in the Notes column allows the production team to film everything but gives the director and editor a clear first-cut priority. Never silently drop shots -- always flag and explain
11. **Do not include color grading, motion graphics specs, VFX instructions, or editing software directions.** This is a pre-production planning document. Post-production decisions belong in a post-production brief, not a storyboard
12. **Voiceover references must quote specific lines from the script** when a script exists, or describe the specific topic and tone when VO will be written later. "VO plays here" is not an acceptable audio note

---

## Edge Cases

**Talking-head video with no b-roll assets identified:**
A single-subject talking-head video with no insert shots or cutaways is un-editable -- the editor has no way to cut around stumbled lines, long pauses, or pacing problems. When a user provides a talking-head concept with no B-roll, generate insert shot suggestions based on the subject matter (screen recordings of tools mentioned, product close-ups, relevant environment details, animated text overlays). Label each insert as "B-roll suggestion" with a note that these shots require either additional filming or stock footage sourcing. Plan a minimum of one insert per 15--20 seconds of total duration.

**No script provided -- concept-only brief:**
When a user provides only a high-level concept ("a 2-minute video about our new app"), build the storyboard from narrative beats first. Map the beats: problem → solution → feature 1 → feature 2 → social proof → CTA. Then assign shots to each beat. Mark all VO audio notes as "VO [TOPIC]: to be scripted" so the storyboard is clear that copy has not been written. Flag this prominently in the Production Assumptions block. Do not block the storyboard -- proceed with the beat structure and make the assumption explicit.

**Multi-camera production (interview, panel, event):**
Add a "Camera" column to every shot table. Assign each shot to Camera A, Camera B, or Camera C. Flag shots where multiple cameras roll simultaneously -- these are marked "ALL CAMS" -- and note that simultaneous rolling is essential for any unscripted interaction that cannot be re-performed. In interview setups, Camera A is typically the MCU of the primary subject, Camera B is the OTS from the interviewer's position, and Camera C (if available) is a wide two-shot. Multi-camera setups require an additional column in the Production Summary for camera operator assignments.

**Animation or motion graphics (no physical camera):**
Replace physical camera terminology with animation equivalents throughout: "Track forward" becomes "virtual camera push in," "Pan right" becomes "viewport pan right," "Handheld" becomes "subtle camera shake (2--3px oscillation)." Add a "Visual Style" column specifying the animation technique per shot: 2D flat animation, 3D render, kinetic typography, whiteboard/explainer, screen recording composite, or mixed media. Duration is more critical in animation than in live action -- every second of animation represents 4--8 hours of production time depending on complexity. Flag shots with complex movement or transitions as "HIGH PRODUCTION COST" in the Notes column.

**Documentary with unscripted subjects:**
Divide shots into two categories and mark each explicitly: "PLANNED" (the camera position, framing, and general action can be set up in advance) and "REACTIVE" (the shot describes a type of moment to capture, not a scripted action). Reactive shots should describe: the emotional or behavioral quality sought, the minimum shot size, and the audio source. Example: "REACTIVE | CU | Subject's face during emotional memory -- capture natural reaction, no direction." Add 30--50% more shots than a scripted production of equal duration would need, because documentary ratio (ratio of shot footage to used footage) is typically 10:1 to 20:1.

**Very short video (under 30 seconds):**
At sub-30-second duration, every shot carries enormous weight. Reduce total shot count to 5--10 maximum. Each shot should be between 2--5 seconds. Prioritize product or subject over environment -- establishing wide shots can often be eliminated when time is this constrained. Every audio note must be tight: VO lines over these shots must be 3--7 words maximum per shot. Flag any shot over 5 seconds as potentially too slow for the format.

**Vertical format (9:16 aspect ratio for mobile):**
Vertical framing changes every composition rule. Add a "Format" note in the Brief Summary: "9:16 Vertical -- all framing instructions are for vertical composition." In vertical format, head room shrinks significantly, full-body WS shots become difficult (subject fills too much of the vertical frame), and text/graphic overlays typically occupy the bottom third rather than lower third. OTS shots are often replaced with side-by-side vertical framing. Flag any shot type that is difficult to execute vertically -- drone/aerial shots in vertical format require specific equipment settings and planning.

**Product launch video requiring legal review:**
When the video includes product claims, before-and-after comparisons, testimonials, or competitive comparisons, add a "Legal Review Required" flag in the Notes column for those specific shots. Include a note in the Production Summary: "The following shots contain claimable content and require legal or compliance review before production: [list shot numbers]." This is particularly important for health products, financial products, and regulated industries. Flag that specific language in VO annotations must be pre-approved.

---

## Example

**Input:** "Create a storyboard for a 2-minute SaaS product demo video for a project management tool called Taskframe. The video should show how it reduces team confusion in remote work. Target audience is mid-sized tech company managers. We have a 2-person crew, one mirrorless camera, a gimbal, a softbox kit, and access to a real office space and two actors."

**Output:**

## Video Storyboard: Taskframe -- "No More Chaos"

### Production Assumptions
- Voiceover will be recorded separately in post -- VO lines are drafted here as placeholders linked to the narrative beat; final copy to be written using `video-script-writing`
- Phone/laptop app UI will be screen-recorded separately and composited as insert shots in post
- Two actors are the primary subject (manager) and secondary subject (team member in a separate location, shown via a video call on screen)
- No drone equipment listed -- no aerial shots included
- Music will be licensed separately -- described functionally here

---

### Brief Summary
**Target Duration:** 2:00
**Platform / Format:** Web (company website, sales deck embed)
**Style:** Commercial/product demo hybrid
**Total Scenes:** 5
**Total Shots:** 18
**Total Planned Duration:** 1:58 (within target, -1.7%)
**Audience:** Engineering and product managers at 50--500 person tech companies

---

### Scene 1: The Problem -- Remote Team Confusion
**Location:** Open office space, desk area
**Lighting:** Natural light from windows (morning/midday quality), supplemented with softbox positioned off-camera left to fill shadows
**Narrative Purpose:** Establish the relatable pain point -- tasks falling through cracks in a remote team -- so the viewer self-identifies before the product is introduced
**Scene Duration:** 28s

| Shot | Type | Movement | Subject Action | Audio | Duration | Notes |
|------|------|----------|----------------|-------|----------|-------|
| 1A | WS | Static | Manager at desk surrounded by open browser tabs, sticky notes on monitor, phone and laptop both showing notifications | Ambient: open office, keyboard sounds, distant conversation | 5s | Establish location and chaos visually before VO begins; rule of thirds -- manager left of frame, desk chaos fills right |
| 1B | CU | Tilt down | Starts on manager's tense face, tilts down to reveal hands hovering over keyboard, not typing -- frozen, overwhelmed | VO: "Your team is working. Tasks are moving." | 4s | Convey cognitive overload through stillness, not action; shot begins on eyes |
| 1C | Insert | Static | Laptop screen showing three different apps open: a chat tool, a spreadsheet, a calendar -- all showing different "urgent" flags | VO: "But nobody knows who's doing what." | 3s | Screen content must be legible -- use large font mockup. Record screen at 1080p minimum |
| 1D | MCU | Static | Manager picks up phone, squints at it, sets it back down without responding -- small frustrated exhale | Ambient: notification ping sound | 4s | Small, grounded performance -- no exaggeration. Eye-line matches existing screen position |
| 1E | OTS | Static | Over manager's shoulder, laptop screen shows a group chat message: "Who's handling the Mercer deadline?" with no replies | VO: "Sound familiar?" | 3s | Camera is behind manager's right shoulder. Screen must fill the frame -- use macro or 85mm+ lens |
| 1F | CU | Zoom in slow | Manager's face -- slight look of resignation, then determination | Music begins: sparse, slightly tense, building -- single piano | 4s | This shot ends the problem block. Zoom is slow and subtle (5% increase) -- signals a shift is coming. Hold 1 extra second on static after zoom completes |

**Scene 1 Total:** 23s (VO begins at shot 1B and carries through 1E)
**Transition to Scene 2:** Match cut -- manager's hand reaches toward the laptop trackpad, and Scene 2 opens on a hand clicking to open Taskframe on a clean desktop. The reaching motion is the shared visual element.

---

### Scene 2: Product Introduction -- First Look at Taskframe
**Location:** Same office desk -- cleared and clean (set dress change between scenes)
**Lighting:** Same softbox setup -- desk is now clean and ordered to contrast with Scene 1
**Narrative Purpose:** Introduce the product as the solution in a visual-first, feature-second way. Viewer sees the interface before hearing what it does.
**Scene Duration:** 22s

| Shot | Type | Movement | Subject Action | Audio | Duration | Notes |
|------|------|----------|----------------|-------|----------|-------|
| 2A | Insert | Static | Laptop screen: Taskframe dashboard opens -- clean, color-coded project view. Cursor moves naturally through the interface | Music: brightens slightly, tension resolves | 5s | Screen recording composite -- plan 30-second screen recording to allow edit flexibility. App UI must be final version or high-fidelity mockup |
| 2B | MCU | Static | Manager's expression changes -- genuine interest, leans slightly forward | VO: "This is Taskframe." | 3s | Natural lean should be directed -- ask actor to feel like they are reading something interesting for the first time |
| 2C | MS | Gimbal slow track left | Camera moves slowly from laptop screen to reveal manager's full upper body -- creates reveal of person behind the tool | VO: "One place for every task, every deadline, every person." | 5s | Gimbal track is slow and deliberate -- 3-foot lateral move over 5 seconds. This is the hero shot of this scene |
| 2D | Insert | Static | Laptop screen: zoom into a specific task card -- shows owner name, due date, status badge ("In Progress") | VO: "No emails. No spreadsheets. No guessing." | 4s | Three claims = three visual elements must be on screen. Design the task card UI to show all three |

**Scene 2 Total:** 17s
**Transition to Scene 3:** L-cut -- VO line "No guessing" from Scene 2 continues over the first 2 seconds of Scene 3's establishing shot. Audio bridges the scenes; visual cuts hard.

---

### Scene 3: Feature Demonstration -- Assigning and Tracking Tasks
**Location:** Office desk (same setup) and video call on screen showing remote team member
**Lighting:** Softbox maintained. A second small LED panel (or bounce card) should be added to eliminate shadows on the laptop screen during insert shots
**Narrative Purpose:** Show the manager using Taskframe to assign a task to a remote team member -- demonstrate the core workflow in real time
**Scene Duration:** 32s

| Shot | Type | Movement | Subject Action | Audio | Duration | Notes |
|------|------|----------|----------------|-------|----------|-------|
| 3A | MCU | Static | Manager types in Taskframe, creating a new task card | VO: "Assign a task in seconds." | 4s | Show hands on keyboard in this shot -- framing should capture both face and keyboard action. Consider slightly low angle to capture screen glow on face |
| 3B | Insert | Static | Screen recording: task card creation -- field fills: task name, assignee selected (team member's name), due date set, priority marked | VO: "Set the owner, the deadline, and the priority." | 5s | This shot must be timed to sync with VO -- each UI action happens on the corresponding VO word. Plan screen recording to hit these beats |
| 3C | MS | Static | Manager leans back slightly, confident -- clicks "Assign" | SFX: satisfying soft click sound | 2s | The click is a micro-moment of completion. Keep this shot short -- it is a punctuation shot |
| 3D | WS | Static | Pull back to show manager at desk with laptop open -- the room now feels ordered, in contrast to Scene 1 | Ambient: office sounds return, calmer now | 4s | This is the first WS of Scene 3. Place manager left of frame, clean desk visible. Use the same desk position as Scene 1 for visual continuity -- the contrast should be obvious |
| 3E | Insert | Static | Laptop screen: notification view in Taskframe shows team member has accepted the task and marked it "In Progress" | VO: "Your team gets notified instantly." | 4s | Screen recording -- team member's avatar/name must appear clearly |
| 3F | MCU | Static | Manager nods slightly, moves to next item on dashboard -- calm, in control | VO: "And you can see every update in real time." | 4s | Performance note: this is the "relief" shot. The actor should feel like a weight has lifted. No exaggerated smile -- a quiet confidence is more believable |

**Scene 3 Total:** 23s
**Transition to Scene 4:** J-cut -- music from Scene 4 (warmer, more energetic) begins 1 second before the visual cut. The audio energy shift signals the move to social proof.

---

### Scene 4: Team Perspective -- The Remote Team Member
**Location:** Separate home office or second desk setup (different visual environment from Scene 1--3)
**Lighting:** Natural light from window, single LED panel fill to match exposure to Scene 1--3 footage
**Narrative Purpose:** Shift perspective to the team member to show that Taskframe works for both sides of the manager/contributor relationship -- doubles the audience identification
**Scene Duration:** 22s

| Shot | Type | Movement | Subject Action | Audio | Duration | Notes |
|------|------|----------|----------------|-------|----------|-------|
| 4A | WS | Static | Team member at their own desk, phone buzzes -- they pick it up | Music: warm, upbeat | 4s | Establishing shot for new location. Different visual environment is critical -- wardrobe should also differ from manager |
| 4B | ECU | Static | Phone screen shows Taskframe mobile notification: "New task assigned: Mercer Proposal -- due Friday" | SFX: notification sound | 3s | This is a callback to the unanswered message in Shot 1E. Connecting these two shots creates narrative payoff |
| 4C | MCU | Static | Team member taps notification, opens app, reviews task card -- nods | VO: "Your team always knows what's next." | 4s | Match eye-line: team member looks slightly left and down (at phone). Keep camera on their right side to maintain 180-degree consistency with the manager's right-of-axis position |
| 4D | MS | Gimbal slow track right | Team member sets phone down, opens laptop, begins working -- calm and focused | VO: "No confusion. No missed deadlines." | 5s | Mirror the gimbal track from Shot 2C for visual symmetry between manager and team member scenes -- this is intentional parallel construction |

**Scene 4 Total:** 16s
**Transition to Scene 5:** Hard cut. Music hits a new phrase. The pace increases for the CTA.

---

### Scene 5: Benefits Summary and Call-to-Action
**Location:** Clean product surface or office backdrop -- minimal, brand-focused
**Lighting:** Softbox hero lighting, clean background, no environmental clutter
**Narrative Purpose:** Crystallize the three core benefits, then deliver the CTA. This is the conversion scene.
**Scene Duration:** 25s

| Shot | Type | Movement | Subject Action | Audio | Duration | Notes |
|------|------|----------|----------------|-------|----------|-------|
| 5A | MS | Static | Manager stands (not seated) in front of clean background -- confident posture, faces camera directly | VO: "Taskframe gives your team clarity..." | 4s | Direct address -- manager looks at camera for the first time. This breaks the fourth wall intentionally to create direct connection with viewer |
| 5B | Insert | Static | Screen recording: Taskframe dashboard with three projects, all tasks assigned, all statuses green/complete | VO: "...on every project, every day." | 4s | Dashboard must show realistic volume of tasks -- at least 3 projects with 5--8 tasks each. Fake-looking UI breaks trust |
| 5C | MCU | Static | Manager speaks: "We cut our status meetings in half." | Sync audio: manager's direct testimonial line | 4s | This is the only on-camera sync-audio line. Record with lavalier mic. Keep take options -- aim for 3 clean takes |
| 5D | WS | Slow gimbal push fwd | Camera moves slowly toward Taskframe logo displayed on a screen or printed backdrop | Music: builds to peak | 4s | Gimbal push is subtle -- 2 feet forward over 4 seconds. End on logo filling center of frame |
| 5E | CU | Static | Tagline appears on screen: "Taskframe. Your team, in sync." Below it: URL and "Start free for 14 days" | VO: "Start your free trial at taskframe.io" | 4s | End card. Graphic overlay. Hold for full 4 seconds -- viewers need time to read the URL. Audio fades under. Music resolves |

**Scene 5 Total:** 20s (graphic hold on 5E may extend to 6s if viewer engagement data supports it)
**Transition:** N/A -- final scene

---

### Production Summary

**Shot Totals**
- Total shots: 18
- Total planned duration: 1:47 on-screen (under 2:00 target with 13 seconds of buffer for VO timing adjustments, music transitions, and end card extension)
- Handle time buffer: +2s per shot = 36 seconds additional raw footage
- Estimated raw footage duration (screen-recorded inserts excluded): approximately 6--8 minutes of live-action footage

**Schedule Estimate**

| Location | Shot Count | Setup Type | Estimated Shoot Time |
|----------|------------|------------|----------------------|
| Office desk (Scene 1 chaos setup) | 6 | Static + insert | 2.5 hours |
| Office desk (Scene 2--3 clean setup) | 8 | Static + gimbal + insert | 3 hours |
| Remote/home desk (Scene 4) | 4 | Static + gimbal | 1.5 hours |
| Clean CTA backdrop (Scene 5) | 5 | Static + gimbal | 1.5 hours |
| Screen recordings (all insert shots) | 7 inserts | Screen record/composite | 1 hour (separate session) |
| **Total** | **18 + 7 inserts** | **Mixed** | **~9.5 hours** |

**Equipment Requirements**
- Camera: Mirrorless camera with 24--85mm zoom and 85mm prime for ECU/insert shots (confirmed available)
- Stabilization: Gimbal (confirmed) for Shots 2C, 4D, 5D; tripod for all static shots
- Lenses: 24--70mm f/2.8 (primary), 85mm f/1.8 or longer for insert/ECU shots
- Lighting: 2-light softbox kit (confirmed) for desk scenes; secondary small LED panel needed for Scene 4 location -- confirm availability or use available natural light with reflector
- Audio: Lavalier mic required for Shot 5C (only sync audio shot). All other shots are VO or ambient -- lavalier can be single unit
- Laptop: Must be functional with Taskframe UI displayed -- confirm final UI is screen-recordable before shoot day

**Assets and Props**
- Scene 1: Sticky notes on monitor, 3--4 browser tabs open with realistic content, phone displaying notifications
- Scene 1 (chaos): Taskframe does NOT appear in Scene 1 -- no product branding visible
- Scene 2--3: Clean desk, laptop with Taskframe open (full dashboard view), water glass (set dressing)
- Scene 4: Second actor's personal desk setup, phone with Taskframe mobile UI
- Scene 5: Printed or displayed Taskframe logo backdrop, or clean wall with logo overlay added in post
- Screen recordings: Taskframe dashboard (desktop), Taskframe task creation flow, Taskframe mobile notification -- all must be filmed separately before shoot day and provided to editor as composite assets

**Talent and Wardrobe**
- On-camera subjects: 2 actors -- Manager (primary), Team Member (secondary)
- Manager: Business-casual, neutral colors (avoid busy patterns -- softbox lighting will accent texture). Same outfit across Scenes 1, 2, 3, and 5 for continuity
- Team Member: Casual professional, visually distinct from Manager's outfit color palette
- Continuity risk: Shot 1A to Shot 2A -- desk must be reset from chaos to clean between takes. Allow 10--15 minutes between these scene setups. Photograph Scene 1 setup before striking it.

**Coverage Risks**
- Scene 3 has 6 shots but 2 are screen recording inserts -- if inserts are not available on shoot day, the scene has only 4 live-action shots. Confirm screen recordings are completed before the shoot date
- Shot 5C (sync dialogue) is the only line-dependent shot in the video. Plan 3--5 takes minimum. If actor performance is inconsistent, this shot can be replaced with an additional insert + VO, but the testimonial format is strongly preferred
- Scene 4 location lighting must be scouted before shoot day -- if natural light is inconsistent, a second LED panel should be added to the equipment list
- No permits required for interior office locations. Confirm location access agreements are signed before scheduling
