---
name: exercise-form-cues
description: |
  Provides detailed technique cues for major compound exercises including squat, deadlift, bench press, row, and overhead press with setup checklists, common fault identification, and corrective cue sequences. Produces a form reference card for each requested exercise.
  Use when the user asks about proper form for compound lifts, technique cues for squats, deadlifts, bench press, or rows, or common form mistakes and corrections.
  Do NOT use for programming sets, reps, or training plans (use strength training skills), yoga or stretching technique (use yoga or stretching skills), or rehabilitation exercises (consult a physical therapist).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "fitness workout-planning checklist"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Exercise Form Cues

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before starting a new fitness program, changing your training, or if you experience pain during exercise. If you are experiencing a medical emergency, contact emergency services immediately.

---

## When to Use

**Use this skill when:**
- A user asks about proper technique for a major compound barbell or dumbbell movement: squat, deadlift (conventional, sumo, Romanian), bench press, bent-over row, overhead press, front squat, goblet squat, or their dumbbell variants
- A user describes a specific sensation during a lift that suggests a technical fault -- lower back dominance in squats, shoulder impingement in pressing, biceps strain in rows -- and wants technique-based correction
- A user wants a step-by-step setup checklist before their first session with a barbell lift or before adding significant weight
- A user asks to understand the difference between two technique variants of the same lift (high-bar vs. low-bar squat, conventional vs. sumo deadlift, neutral-grip vs. pronated row)
- A user wants to verify their mental model of a movement pattern before a training session (conceptual technique review)
- A user describes a specific phase of a lift where they feel the movement break down -- sticking points, loss of bracing at a specific moment, bar path deviation
- A user is introducing a new training partner or athlete to a lift and wants a structured cue sequence to teach from

**Do NOT use when:**
- The user wants sets, reps, periodization, or loading progressions -- use `beginner-strength-training` or `intermediate-strength-training` skills
- The user is asking about yoga, Pilates, or static flexibility work -- use `yoga-routine-builder` or `flexibility-mobility` skills
- The user has a diagnosed injury or is in active rehabilitation -- direct them to a licensed physical therapist; do NOT provide "modified" form guidance for injured tissue
- The user wants Olympic weightlifting technique (snatch, clean and jerk, power clean) -- these require real-time in-person coaching due to bar velocity, positional demands, and injury risk during learning
- The user asks about gymnastics-derived movements (muscle-ups, handstands, ring work) -- use a calisthenics-specific skill
- The user is asking about sport-specific movement mechanics outside of strength training (e.g., throwing mechanics, running gait) -- use sport-specific skills
- The user has already described acute pain, numbness, tingling, or radiating symptoms during a lift -- do NOT provide continued technique cues; advise immediate cessation and healthcare consultation

---

## Process

### Step 1: Identify the Exact Exercise and Variant

Before providing any guidance, establish precisely which movement and variant is requested.

- Differentiate high-bar squat (bar rests on upper trapezius shelf, more upright torso, greater knee travel, greater quad emphasis) from low-bar squat (bar sits on rear deltoids 2-3 inches lower, more forward torso lean, greater hip travel, greater posterior chain emphasis)
- Differentiate conventional deadlift (hip-width feet, hands outside legs, longer pull path, more erector and hamstring demand) from sumo deadlift (wide stance, toes out 45-60 degrees, hands inside legs, shorter pull path, more hip abductor and quad demand) from Romanian deadlift (minimal knee bend, hip-hinge dominant, eccentric load on hamstrings)
- For bench press, establish whether flat, incline, or decline, and whether barbell or dumbbell -- each has distinct shoulder angle demands and safety considerations
- For rows, distinguish barbell bent-over row (bilateral, spinal erector isometric demand), dumbbell single-arm row (unilateral, allows greater range of motion, scapular retraction emphasis), and cable or machine rows are outside this skill's scope unless the user asks
- If the user does not specify a variant, default to the most common beginner-appropriate version: high-bar squat, conventional deadlift, flat barbell bench press, barbell bent-over row, standing barbell overhead press
- If the user describes their training context (powerlifting, general fitness, physique training), this should influence which variant you emphasize

### Step 2: Conduct a Fault-First Triage

If the user describes a symptom, sensation, or breakdown point, identify the likely fault category before presenting the full form guide.

- **Lower back pain/fatigue in squats:** Most likely faults are butt wink (excessive posterior pelvic tilt at the bottom), good-morning squat (hips rising faster than shoulders), or insufficient Valsalva bracing
- **Lower back pain in deadlifts:** Most likely faults are lumbar flexion under load (rounding at the lumbar spine rather than thoracic), bar drifting away from the body, or initiating the pull with the lower back rather than leg drive
- **Shoulder pain in bench press:** Most likely faults are flared elbows (greater than 80 degrees from torso), excessive arch with insufficient scapular depression, or bar path too high toward the clavicle
- **Wrist/elbow pain in overhead press:** Most likely faults are bent wrists (bar resting on the palm heel instead of over the forearm), forward bar position relative to the forearm stack, or elbows too far in front of the bar at the start
- **Lower back fatigue in bent-over rows:** Most likely faults are torso too horizontal (lower back as a fulcrum), using momentum rather than controlled scapular retraction, or insufficient bracing before each rep
- Always acknowledge the symptom, provide the likely technical cause, then deliver the corrective cue sequence -- do not start with the full anatomy of the movement before addressing what the user described

### Step 3: Deliver the Setup Checklist in Order

Setup is sequential and non-negotiable -- errors in setup propagate through the entire lift. Present setup steps in the exact order they should be physically executed.

- **Foot placement first:** Width and toe angle must be established before any load is taken. For squats, shoulder-width to slightly wider, 15-30 degrees toe out is the starting template -- individual hip anatomy will vary. For deadlift, hip-width (roughly fist-width between heels) for conventional. Feet should be beneath the bar so the bar is over mid-foot (approximately 1 inch from the shin) before the pull.
- **Hand/grip placement second:** Establish grip before taking the bar out of the rack. For bench press, pinky fingers inside the smooth-to-knurl rings as a standard starting point. For squat, as narrow as shoulder mobility allows with wrists straight. For deadlift, double overhand until grip fails, then mixed grip or hook grip.
- **Body positioning and spinal alignment third:** Neutral spine does not mean perfectly vertical -- it means the spine maintains its natural curves (cervical lordosis, thoracic kyphosis, lumbar lordosis) under load. For bench, it means a slight arch supported by scapular depression, not an extreme arch.
- **Bracing sequence fourth (always last before unracking or initiating the lift):** The bracing sequence is: (1) deep diaphragmatic inhale filling the belly and expanding the sides (not shallow chest breathing), (2) active intra-abdominal pressure increase by contracting the core 360 degrees as if bracing for a punch, (3) lat engagement (for deadlift and squat: "protect your armpits," "bend the bar around your legs"), then (4) hold the brace and initiate. This Valsalva-style bracing can transiently raise blood pressure -- note this for users who ask.
- **Unrack/start position fifth:** For bar movements in a rack, the walkout is part of the lift. Minimum steps out of the rack for squats -- 2 steps back is standard; 3 is acceptable. For deadlift, no walkout; the bar setup IS the start position.

### Step 4: Describe Each Movement Phase with Specific Cues

Each lift has three to four distinct phases. Every phase gets specific, sensory-grounded cues -- what the lifter should feel, see, and hear, not just abstract positional descriptions.

**Eccentric (descent/lowering) phase:**
- Lead with the correct initiator for the lift (squat: simultaneous hip back and knee forward; deadlift: no eccentric; bench press: controlled descent with elbows tracking at 45-75 degrees; overhead press: bar path straight down close to face)
- Provide a tempo guideline: eccentric phases of 2-3 seconds are appropriate for learning; do not descend so slowly that the lifter loses tension (greater than 5 seconds creates energy leakage)
- Identify the depth or range of motion landmark: for squat, hip crease at or below the patella (parallel); for bench, bar touches the sternum or lower chest; for overhead press, bar touches the clavicle/upper chest; for Romanian deadlift, mild hamstring stretch with maintained neutral spine (typically mid-shin to just below the knee for most people)

**Bottom/stretch position:**
- This is the most mechanically demanding position and the most common place for technical breakdown
- For squats: look for maintained arch (butt wink is pelvic posterior tilt, not a flat lower back -- distinguish these), knees still tracking toes, weight still through the whole foot
- For bench: scapulae must remain retracted and depressed (not elevated toward the ears), wrists stacked over elbows, bar in light contact with the chest or 1 cm above
- For deadlift: there is no eccentric phase -- the bottom position is the start position; the setup IS the bottom position

**Concentric (ascent/drive) phase:**
- Provide a single dominant drive cue that will fix the most common fault for that lift: "push the floor away" (squat), "push the floor away while dragging the bar up the shins" (deadlift), "push the bar through the ceiling" (overhead press), "push yourself away from the bar" (bench press)
- Identify the primary sticking point for each lift and the cue to break through it: squat sticking point is typically just above parallel (address with "accelerate through the hole"); deadlift sticking point is typically 2-4 inches off the floor (address with "leg press the earth"); bench press sticking point is typically 2-4 inches above the chest (address with "drive your upper back into the bench")
- Describe the lockout: full hip extension in squat and deadlift (glute squeeze cue), elbows locked with bar directly over the shoulder joint in bench press, elbows locked with bar directly over the head (ears inside the arms) in overhead press

**Transition and reset (between reps):**
- For most compound lifts in a set of 5+, re-brace between each rep at the top
- For deadlifts, the question of touch-and-go vs. dead-stop matters: dead-stop requires fully resetting the setup each rep; touch-and-go maintains tension but can become a bounce that bypasses the intended range of motion -- note this for the user

### Step 5: Build the Common Faults Table

For each exercise, identify the 4-6 most clinically meaningful faults -- those that both reduce effectiveness AND increase injury risk. Present them in order of frequency (most common first).

- Each fault entry must include: what it visually looks like, why it biomechanically matters (what load is displaced where), the single most effective corrective cue (short enough to repeat mentally mid-lift), and one specific drill that provides kinesthetic feedback to reinforce the correct pattern
- Corrective cues follow specific principles: they should be external focus cues (directed at the effect on the environment or an object) rather than internal focus cues (directed at body parts) where possible -- research consistently shows external cues improve motor learning. Example: "push the floor away" (external) outperforms "extend your knees and hips" (internal)
- Drills should require no special equipment beyond what is available in a standard commercial gym: plates, a barbell, a resistance band, a box or bench, a wall

### Step 6: Provide Breathing and Bracing Protocol with Specific Timing

Breathing cues are lift-specific and rep-count-dependent. Do not provide generic "exhale on exertion" advice -- this is appropriate for light, high-rep general exercise, not loaded compound lifts.

- For sets of 1-5 heavy reps: full Valsalva (hold breath through entire rep, exhale at lockout) is appropriate and provides maximum spinal stabilization
- For sets of 6-12 moderate reps: breath may be released past the sticking point on the concentric; a brief re-brace at the top is necessary before the next eccentric
- For sets above 12 reps or warm-up sets: the lifter may breathe more naturally, but a hard brace before each rep is still required for loaded movements
- The 360-degree brace means: fill the belly (not the chest), expand the obliques laterally, push the lower back outward slightly (this is NOT posterior pelvic tilt -- it is intra-abdominal pressure), and lightly contract the pelvic floor
- Note: Valsalva maneuver transiently increases blood pressure. If a user mentions hypertension, heart conditions, or has been advised to avoid straining by a physician, note this and advise they discuss with their healthcare provider before using maximal Valsalva on heavy sets

### Step 7: Address the User's Specific Complaint or Question

If the user described a specific problem, return to it explicitly after the full form guide and provide a 2-4 week corrective protocol drill sequence. This is not programming -- it is a technique reinforcement sequence.

- Identify the root-cause fault (from the fault triage in Step 2)
- Recommend a specific regression drill with empty barbell or lighter load
- Describe exactly what to look/feel for in the drill to confirm the correction is working
- Provide a progression criterion: when the drill consistently feels correct for 3-5 sets of 5 reps, the lifter can return to working weight with the corrected cue
- Remind the user to record a side-view and front-view video if possible to self-assess -- coach's eye on one's own movement is unreliable during learning

### Step 8: Apply Safety and Spotting Notes

Every form guide must close with a brief safety section appropriate to the specific lift.

- **Squat:** Safety pins or safeties in a power rack must be set at the correct height -- 1-2 inches below the lowest point of the squat (slightly below parallel for most lifters). If no spotter, use a rack. If failing a squat forward, step out; if failing backward, the bar rolls off the pins. Practice the bail with an empty bar.
- **Deadlift:** There is no spotting mechanism for a deadlift -- the safe failure is dropping the bar. On a platform or with bumper plates, drop without hesitation if the lower back rounds significantly. Do not jerk the bar from the floor; a slow initial pull prevents the jerking fault that causes acute lower back strain.
- **Bench press:** If training alone, set the safeties 1 inch below chest height, learn the "roll of shame" (tilt bar to one side, let plates slide off, repeat other side), or use a suicide grip (thumbless grip) as a last resort only if rolling off the chest. The conventional thumb-around grip is always preferred. Never train heavy bench press alone without safeties or a spotter.
- **Overhead press:** Standing overhead press failure should be resolved by pushing the bar forward and stepping back as it falls. Never train heavy overhead press in a rack without collars -- plates can slide off.
- **Row:** The primary safety concern is spinal position under load. If the lower back begins to round under load, the weight is too heavy or the brace has failed -- terminate the set.

---

## Output Format

Deliver the form guide using this exact structure. Every section is required.

```
## Form Guide: [Exercise Name] -- [Variant if applicable]

> *General technique education only. Stop and consult a healthcare professional if you experience sharp, shooting, or radiating pain during any movement.*

---

### Setup Checklist

Perform these steps in order before each working set:

1. **[Step 1 -- Foot placement]:** [Specific width, angle, reference point]
2. **[Step 2 -- Grip/Hand placement]:** [Width, grip type, tactile cue]
3. **[Step 3 -- Body/Spinal position]:** [Landmark-based description]
4. **[Step 4 -- Lat/Upper back engagement]:** [Specific activation cue]
5. **[Step 5 -- Bracing sequence]:** [Inhale → brace → hold sequence]
6. **[Step 6 -- Unrack or initiation]:** [Specific cue for leaving the rack or addressing the bar]

---

### Movement Phases

**Phase 1 -- Eccentric (Descent/Setup):**
- [Initiating cue: what moves first and how]
- [Tempo guidance: X-second descent]
- [Mid-phase checkpoint: what should be true halfway down]
- [Depth marker: specific anatomical landmark or measurement]

**Phase 2 -- Bottom/Stretch Position:**
- [What correct bottom position looks and feels like]
- [What should NOT be present at the bottom]
- [Tension check: where the lifter should feel loading]

**Phase 3 -- Concentric (Ascent/Drive):**
- [Primary drive cue (external focus preferred)]
- [Sticking point: where it is and how to break through]
- [Bar path or body path description through the range]
- [Lockout cue: finish position landmarks]

**Phase 4 -- Reset (Top Position):**
- [Re-brace protocol between reps]
- [Positional check before next rep]

---

### Common Faults and Corrections

| Fault | What It Looks Like | Why It Happens | Corrective Cue | Drill to Fix It |
|---|---|---|---|---|
| [Fault 1 -- most common] | [Observable description] | [Biomechanical cause] | "[Short external cue]" | [Specific drill with load and rep guidance] |
| [Fault 2] | [Observable description] | [Biomechanical cause] | "[Short external cue]" | [Specific drill with load and rep guidance] |
| [Fault 3] | [Observable description] | [Biomechanical cause] | "[Short external cue]" | [Specific drill with load and rep guidance] |
| [Fault 4] | [Observable description] | [Biomechanical cause] | "[Short external cue]" | [Specific drill with load and rep guidance] |
| [Fault 5] | [Observable description] | [Biomechanical cause] | "[Short external cue]" | [Specific drill with load and rep guidance] |

---

### Breathing and Bracing Protocol

| Set Type | Inhale Timing | Brace Quality | Exhale Timing | Re-brace |
|---|---|---|---|---|
| Heavy sets (1-5 reps) | Top of rep, before descent | Full Valsalva -- 360-degree maximal brace | At lockout only | Full re-brace every rep |
| Moderate sets (6-12 reps) | Top of rep, before descent | Hard brace -- hold through sticking point | Past sticking point on ascent | Hard re-brace at top each rep |
| Light/warm-up sets (12+ reps) | Top of rep, before descent | Firm brace -- do not skip this | After each rep | Brief reset at top |

**Brace cue:** [Specific internal description of what a correct brace feels like for this exercise]

---

### Safety Notes

- **Rack/safeties:** [Specific safety pin height or setup instruction]
- **Failure protocol:** [What to do if the lift fails partway through]
- **Spotting:** [Whether a spotter is needed, what a spotter should do, where to spot]
- **Load recommendation for technique work:** Start with an empty barbell (20 kg / 45 lb) or a light fixed-weight bar; do not increase load until the setup and movement phases are automatic across 3 consecutive sets

---

### Corrective Drill Sequence (if user described a specific fault)

**Target fault:** [Name of the fault being addressed]
**Root cause:** [Biomechanical explanation in plain language]

1. **Drill 1:** [Name] -- [Load, sets, reps, what to look/feel for]
2. **Drill 2:** [Name] -- [Load, sets, reps, what to look/feel for]
3. **Progression criterion:** [Specific observable standard before returning to working weight]
```

---

## Rules

1. **Always deliver the disclaimer** at the top of the form guide output. Never skip it, even for simple technique questions.

2. **Never coach Olympic lifts** (snatch, clean and jerk, power clean, hang clean, push jerk) -- these movements have bar velocities and positional demands that require real-time in-person feedback to learn safely. Refer the user to an Olympic weightlifting coach.

3. **Prefer external focus cues over internal focus cues.** "Push the floor away" is superior to "extend your hips and knees." External focus cues direct attention to the effect on the environment, which produces better motor learning outcomes. Use internal cues only when external cues are unavailable or the user explicitly needs anatomical explanation.

4. **Corrective cues must be short enough to think during the lift** -- maximum 5 words. "Chest up, lead with the chest" is acceptable. "Maintain your thoracic extension while generating upward momentum" is not.

5. **Never prescribe a specific working weight.** Recommend "empty barbell," "light fixed-weight bar," "a weight where technique is perfect," or "30-40% of your working weight" as relative references. Never name kilograms or pounds for a working set.

6. **Distinguish pain from discomfort.** Muscle burn, fatigue, and the discomfort of effort are normal. Sharp pain, shooting pain, pain localized to a specific joint, and any numbness or tingling are not normal and warrant immediate cessation. Make this distinction explicitly whenever a user mentions any pain or discomfort.

7. **Use anatomical landmarks, not cardinal directions.** "Hip crease below the patella" is better than "squatting low enough." "Bar over mid-foot" is better than "bar in the right position." Landmarks give the user something they can physically feel or see.

8. **Do not diagnose the cause of pain.** If a user reports pain at a specific moment in a lift, you may describe the most common technical faults associated with that pattern, but you must never state that their pain is caused by a specific fault. Use language like "a common technical issue associated with that sensation is..." not "your lower back pain is caused by..."

9. **Variant choices are anatomy-dependent.** High-bar vs. low-bar squat, conventional vs. sumo deadlift -- these are not better or worse objectively. They suit different hip anatomy, limb proportions, and training goals. When a user asks which is "better," explain the trade-offs and recommend they try both with an empty bar to find which feels more natural for their structure.

10. **Every form guide must include all five sections** -- Setup Checklist, Movement Phases, Common Faults table, Breathing Protocol, and Safety Notes. Omitting any section produces an incomplete guide that may increase injury risk through partial knowledge.

11. **Butt wink is not always a fault worth addressing aggressively.** A small degree of posterior pelvic tilt at the absolute bottom of the squat is anatomically normal for many people. Aggressive correction of mild butt wink by demanding more depth or excessive anterior tilt can itself cause injury. Acknowledge this nuance: if the butt wink is pronounced (visible rounding of the lumbar spine), address it; if it is mild and appears only at the extreme end of range, it may reflect hip socket anatomy and be benign.

12. **The walkout in squats is part of the technique.** Wandering more than 3 steps back from the rack, stepping excessively wide, or re-stepping to adjust foot position all indicate the setup in the rack was wrong. The bar should be set at the correct height (upper arm parallel to floor when gripped) and the walkout should require exactly 2 steps: one step back with each foot, feet landing in the intended stance width.

---

## Edge Cases

### User Asks About Dumbbell Variants
Dumbbell variants introduce three key differences: (1) each arm must independently stabilize the load, increasing rotator cuff and scapular stabilizer demand; (2) each wrist and elbow can rotate freely, which changes the optimal arm path -- for dumbbell bench press, a neutral grip (palms facing each other) is biomechanically easier on the shoulder and is a valid cue; (3) the absolute load is lower, which makes dumbbells well-suited for learning movement patterns. Provide the same five-section guide adapted to the dumbbell variant. Call out specifically where the technique differs from the barbell version and why.

### User Describes Acute Pain Mid-Exercise
Do not continue providing technique cues. Acknowledge the symptom, state clearly that sharp, localized, or radiating pain is not normal, and direct the user to stop that movement and consult a qualified healthcare professional before continuing. You may note that if the discomfort resolves completely between sessions and they want to maintain training, general lower-body movements like leg press or goblet squats may have lower spinal loading -- but frame this as a suggestion to discuss with their healthcare provider, not as a substitute movement recommendation.

### User Asks About Lifting With a Known Medical Condition
Do not provide condition-specific modifications. The conditions that affect exercise selection and technique (e.g., disc herniation, labral tears, spondylolisthesis, hypertension, pregnancy) require individualized assessment by a healthcare provider and ideally a physical therapist or certified strength and conditioning specialist who can observe movement in person. State this clearly, do not attempt to approximate what a clinician would say, and offer to provide general healthy-population form guidance separately.

### User Asks to Compare Two Technique Camps
Some exercises have legitimate technique debates in the strength training community: high bar vs. low bar squat, conventional vs. sumo deadlift, full range of motion vs. partial range bench press, touch-and-go vs. dead-stop deadlift. When a user asks which is correct, do not arbitrate dogmatically. Explain the mechanical trade-offs of each approach, who each tends to suit (body proportions, training goals, comfort), and recommend experimenting with both under light load to find what feels strongest and most natural. Avoid framing any established technique school as universally wrong.

### User Is Training Without a Spotter or Rack
Provide explicit safety guidance specific to the lift. For squats: safety pins or safeties are non-negotiable for working sets; if neither is available, do not attempt maximal effort squats -- use goblet squats or safety-bar squats instead. For bench press: if training without safeties and without a spotter, use dumbbells or a Smith machine as a safer alternative; the roll-of-shame can be practiced with an empty barbell. For overhead press: standing overhead press is self-spotting (drop the bar in front); sitting press without safeties carries higher risk of bar landing on the neck if a fail occurs anteriorly. Specifically recommend using collars on overhead work and ensuring a clear drop zone.

### User Has Significantly Long or Short Limb Proportions
Limb length affects every compound lift substantially. Long-femur lifters will have greater forward torso lean in high-bar squats and may find low-bar or front squat more comfortable. Long-armed lifters will have a shorter deadlift pull and may find conventional pull distances very short, making sumo less of an advantage. Short-armed lifters may struggle with the deadlift setup and may benefit from a slightly elevated starting position. When a user mentions that standard cues "don't feel right" despite careful setup, flag that their limb proportions may necessitate individual adjustments beyond standard templates and recommend a session with a qualified coach who can observe them in person.

### User Asks About Barbell Row Grip and Angle Variants
Barbell bent-over row has three meaningful variants: (1) Overhand (pronated) grip, torso 45 degrees -- emphasizes upper back and rear deltoids; (2) Underhand (supinated) grip, torso closer to 45-60 degrees -- increases biceps contribution and allows slightly more load; (3) Pendlay row (torso parallel to floor, dead-stop from the floor each rep) -- eliminates momentum and maximally isolates the pull from the back. Each is valid. Describe the mechanical differences when asked and provide setup cues appropriate to the specific variant. The common fault of using lumbar extension as a "cheat" to generate momentum applies to all three variants and should always be flagged.

---

## Example

**Input:** "I keep feeling the Romanian deadlift in my lower back instead of my hamstrings. What am I doing wrong and how do I fix it?"

**Output:**

## Form Guide: Romanian Deadlift (Barbell)

> *General technique education only. Stop and consult a healthcare professional if you experience sharp, shooting, or radiating pain during any movement.*

---

The sensation you're describing -- lower back fatigue or strain-like feeling rather than hamstring stretch and loading -- is the most common technical issue with the Romanian deadlift. It almost always comes from one or a combination of three faults: rounding the lower back instead of maintaining a neutral spine during the hip hinge, initiating the movement by bending at the waist rather than pushing the hips back, or losing lat engagement so the bar drifts away from the body. The full form guide below addresses all three, with a specific corrective sequence at the end.

---

### Setup Checklist

Perform these steps in order before each working set:

1. **Foot placement:** Hip-width stance (approximately fist-width between heels), toes pointing forward or 5-10 degrees out at most. Narrower than a conventional deadlift. Weight distributed across the whole foot.

2. **Grip:** Double overhand (pronated), hands just outside the legs at roughly hip-width. Grip the bar hard -- white-knuckle grip helps activate the lats through irradiation. Bar rests in the fingers, not the palm, to reduce forearm fatigue.

3. **Spinal position -- this is the most critical setup cue:** Stand tall at full hip extension. Before hinging, find your neutral lumbar curve: slight anterior tilt of the pelvis (not a tucked tail, not an exaggerated arch -- your natural standing lumbar curve). Hold this curve through the entire movement.

4. **Lat engagement:** "Protect your armpits" -- imagine pinching a pencil in each armpit. This depression of the scapulae and engagement of the lats keeps the bar close to the body throughout the descent. Test this: lat engagement should make the bar feel like it wants to stay against your thighs rather than swinging forward.

5. **Bracing sequence:** Big diaphragmatic breath into the belly and sides (chest should barely move). Brace the core 360 degrees -- push out against an imaginary belt front, sides, AND lower back. This is not sucking in -- it is pushing out in all directions. Hold this brace.

6. **Initiation position:** Hold the bar at hip height with arms straight, knees soft (a slight bend of approximately 15-20 degrees -- not a squat, not locked-out straight). This is your starting position for every rep.

---

### Movement Phases

**Phase 1 -- Eccentric (Descent/Hip Hinge):**
- The dominant cue: "push your hips back toward the wall behind you" -- this initiates the movement from the hip joint, not the lumbar spine
- The knees stay bent at a fixed angle (that same soft 15-20 degree bend) throughout the entire descent -- they do NOT straighten more as you go down, and they do NOT bend more into a squat
- The bar stays in contact with or within 1-2 cm of the thighs and shins -- if you can see a gap forming between the bar and your legs, the lats have disengaged
- Control the descent for 2-3 seconds -- do not let the weight pull you down
- Depth marker: descend until you feel a strong stretch sensation in the hamstrings. For most people, this is mid-shin to just below the knee. The lower back must remain neutral at this point -- if you can only reach mid-thigh before the lower back rounds, that is your working range of motion

**Phase 2 -- Bottom/Stretch Position:**
- You should feel a clear pulling sensation in the belly of the hamstrings (back of the thigh, not behind the knee and not in the lower back)
- The spine should look neutral from the side: the same curve as standing, not a rounded "C" shape in the lumbar region
- Shoulders should be directly over or very slightly in front of the bar when viewed from the side
- What should NOT be present: a visible rounding of the lower lumbar spine, a "good-morning" posture where the torso is parallel to the floor (unless this is your natural hamstring range -- some flexible lifters can reach here with neutral spine)

**Phase 3 -- Concentric (Ascent):**
- Primary drive cue: "drive your hips forward to the bar" -- the hips move forward to meet the bar, rather than lifting the bar upward with the lower back
- The bar path is straight and vertical when viewed from the side -- the bar does not swing away from the body as you rise
- Hips and shoulders rise at the same rate -- if the hips shoot up faster than the shoulders, the lower back is taking over the movement
- Lockout: stand tall at full hip extension with glutes gently squeezed. Do not hyperextend the lumbar spine at the top -- full hip extension does not require leaning backward

**Phase 4 -- Reset (Top Position):**
- Re-brace fully at the top before each rep
- Check that the bar is back at hip height and that you are standing at full height with neutral spine before descending again
- For sets of 5+ reps, this reset takes 1-2 seconds and is not optional -- rushing into the next rep is how the brace is lost

---

### Common Faults and Corrections

| Fault | What It Looks Like | Why It Happens | Corrective Cue | Drill to Fix It |
|---|---|---|---|---|
| Rounding the lower back (lumbar flexion) | Lower back visibly rounds into a "C" during the descent; load is felt as compression in the lumbar spine, not stretch in the hamstrings | Insufficient bracing, descending past the hamstring flexibility limit, or initiating with the waist instead of the hip | "Proud chest, hips back" | Wall hip hinge drill: stand 6 inches from a wall, push hips back to touch the wall while keeping chest tall and spine neutral. 3 sets of 10 reps with no load |
| Bar drifting away from the body | A gap forms between the bar and the legs; lower back is loaded as a lever arm as the bar moves forward | Lat disengagement, grip too relaxed, or initiating with a forward lean of the torso | "Drag the bar down your legs" | Practice the descent with the bar intentionally touching the thighs the entire way -- you can lightly chalk the thighs to see the contact mark |
| Knees straightening during descent | The legs straighten as the bar descends, shifting the movement toward a stiff-leg deadlift and increasing lumbar demand | Misunderstanding the "soft knee" cue as straightening the legs to reach the floor | "Keep the knee bend locked in throughout" | Perform the eccentric with a deliberate focus on maintaining the initial knee angle -- use a light load and slow the descent to 4 seconds |
| Hips rising faster than shoulders on ascent | The torso stays nearly horizontal as the hips shoot up first; the concentric becomes a good-morning | Habit from conventional deadlift, or insufficient leg drive contribution | "Drive your hips forward to the bar" | Hip hinge against a band or cable: loop a band around the hips, attach to an anchor behind you; the band forces the hips to drive forward rather than up |
| Descending past hamstring flexibility | Lower back rounds at the bottom because the hamstrings have run out of range of motion | Trying to achieve a specific depth rather than working to the individual flexibility end-range | "Stop where you feel the stretch -- that is your depth" | Mark your working depth with a target (a box, a plate stack) at the height where neutral spine is last maintained; work to that depth consistently |

---

### Breathing and Bracing Protocol

| Set Type | Inhale Timing | Brace Quality | Exhale Timing | Re-brace |
|---|---|---|---|---|
| Heavy sets (1-5 reps) | At the top, before each descent | Full Valsalva -- 360-degree maximal brace | At lockout only | Full re-brace every rep at the top |
| Moderate sets (6-12 reps) | At the top, before each descent | Hard brace -- hold through the full range | After reaching lockout at the top | Hard re-brace at top each rep |
| Light/warm-up sets (12+ reps) | At the top, before each descent | Firm brace -- never skip this | After each rep at the top | Brief reset and re-brace at top |

**Brace cue for Romanian deadlift specifically:** Because the torso is hinged forward during the movement, the 360-degree brace is even more critical than in a standing position. Imagine your spine is a steel rod inside an inflated tube -- the tube (your braced core) is what prevents the rod from bending. The lower back push-out component of the brace is particularly important in this hinged position.

---

### Safety Notes

- **No rack required.** The Romanian deadlift starts standing with the bar at hip height, picked up from the floor or lifted from a rack. Pick the bar up with a conventional deadlift technique first, then initiate RDL reps from the standing position.
- **Failure protocol:** If the lower back begins to round at any point in the range of motion, the rep is done. Do not descend further. Stand up, reset, and either continue with a shorter range of motion or terminate the set. Grinding through a rep with a rounded lumbar spine under load is the primary injury mechanism in this lift.
- **Spotting:** No spotter needed -- drop the bar if necessary. If using heavy loads, bumper plates or a platform make dropping safe.
- **Load recommendation for technique work:** Use an empty barbell or approximately 30-40% of your working load until the wall hip hinge drill is automatic and the bar-to-body contact is maintained through the full working range.

---

### Corrective Drill Sequence -- Lower Back Dominance in Romanian Deadlift

**Target fault:** Lower back activation instead of hamstring loading (combination of lumbar flexion and insufficient hip hinge initiation)
**Root cause in plain language:** The movement is initiated as a forward lean of the torso (bending at the waist) rather than a backward push of the hips. When the hips don't drive back, the hamstrings never get loaded under tension -- instead, the lower back erectors are working to hold the torso parallel to the floor.

**Drill sequence:**

1. **Wall Hip Hinge (no load):** Stand 6 inches from a wall, feet hip-width, knees soft. Push your hips straight back until they touch the wall without your torso rounding or your knees bending further. Return to standing. This builds the hip-back initiation pattern. 3 sets of 10 reps per session for the first week. What to feel: a stretch in the hamstrings, not compression or work in the lower back.

2. **Barbell Romanian Deadlift to Mid-Thigh (empty bar or very light load):** Using the wall hip hinge pattern, perform RDL reps that stop at mid-thigh -- well above where the lower back typically rounds. Focus exclusively on keeping the bar against the thighs and pushing the hips back. 3 sets of 8 reps. Gradually extend the range of motion downward by 1-2 inches per session as long as neutral spine is maintained at the new depth.

3. **Progression criterion:** When you can perform 3 sets of 5 reps at your working weight with the bar maintaining contact with the legs throughout the full range of motion, and when you feel clear hamstring tension (not lower back fatigue) at the bottom, the corrective phase is complete. Record a side-view video to confirm the spine remains neutral -- your perception of your own spinal position is unreliable when learning a new motor pattern.
