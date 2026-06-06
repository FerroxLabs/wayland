---
name: home-workout-no-equipment
description: |
  Builds bodyweight-only workout programs for all fitness levels with progressive difficulty variations, structured programming across push, pull, squat, hinge, and core movement patterns. Produces a complete weekly training schedule with exercise progressions and no equipment requirements.
  Use when the user asks about bodyweight workouts, home training without equipment, no-gym routines, or calisthenics programs for beginners.
  Do NOT use for weight training programs (use beginner-strength-training), HIIT-specific sessions (use hiit-workout-design), or yoga routines (use yoga-routine-builder).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "fitness workout-planning beginner-friendly"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Home Workout No Equipment

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before starting a new fitness program, modifying an existing one, or if you have any pre-existing conditions, injuries, or health concerns. If you experience chest pain, dizziness, severe shortness of breath, or sharp joint pain during exercise, stop immediately and seek medical attention.

---

## When to Use

**Use this skill when:**
- The user explicitly wants to train at home using only their bodyweight -- no dumbbells, barbells, bands, or pull-up bars
- The user describes their situation as "no gym," "can't afford a gym," "traveling," or "working out in a small apartment"
- The user asks specifically about bodyweight training, calisthenics fundamentals, or home fitness with zero equipment
- The user wants a structured, progressive program -- not a random set of exercises -- that advances in difficulty over weeks
- The user is a beginner who has never trained consistently and needs a safe entry point with movement education
- The user is returning to fitness after a long break (deconditioning) and needs to rebuild foundational movement quality before adding load
- The user wants to supplement a gym program with home sessions on non-gym days
- The user asks how to make bodyweight exercises harder over time without buying anything

**Do NOT use when:**
- The user has access to a barbell, dumbbells, or a rack and wants a strength-focused program -- use `beginner-strength-training` instead
- The user explicitly asks for HIIT, metabolic conditioning, or circuit-style cardio with short rest periods -- use `hiit-workout-design` instead
- The user wants yoga, flexibility work, or a mobility-focused session as the primary goal -- use `yoga-routine-builder` instead
- The user is pursuing advanced calisthenics skills such as the muscle-up, planche, front lever, handstand press-up, or human flag -- these require specialized skill progressions, specific joint preparation protocols, and scapular loading strategies beyond this skill's scope
- The user is a competitive athlete needing sport-specific conditioning -- this program does not address rate of force development, reactive strength, or energy system specificity for sport
- The user has a specific rehabilitation goal following injury or surgery -- exercise selection and loading must be directed by a physiotherapist in those cases

---

## Process

### Step 1: Conduct a Structured Intake Assessment

Before writing a single exercise, gather four categories of information. Do not skip this step -- the program will be wrong without it.

- **Movement baseline:** Ask the user to attempt three tests if able: (1) Can they do a full push-up from the floor? How many in a row? (2) Can they squat to parallel without holding onto anything? (3) Can they hold a forearm plank for 20 seconds? These three answers place them immediately in Level 1, 2, or 3.
- **Time and frequency:** Confirm both how many days per week they want to train AND how long each session can be. These are separate constraints -- a user might have 5 days but only 20 minutes each, which is a different program than 3 days with 45 minutes.
- **Space audit:** Ask what their floor space looks like. A yoga mat footprint (6 x 2 feet) forces very different exercise selection than a living room. Forward lunges, lateral movements, and bear crawls require at least 8 feet of clearance.
- **Exclusions and medical flags:** Ask about any movements a healthcare provider has told them to avoid, any chronic joint issues (knees, lower back, shoulders, wrists), and whether they are currently pregnant. Collect this before prescribing anything.

### Step 2: Assign a Precise Progression Level

Use the following decision framework with exact thresholds -- not subjective guesses:

- **Level 1 -- Foundation:**
  - Cannot complete a single standard push-up with full range of motion (chest to within 1 inch of floor)
  - Cannot squat to parallel (thigh parallel to ground) under control without holding support
  - Cannot hold a forearm plank for 20 continuous seconds
  - Appropriate for: true beginners, post-injury return, highly deconditioned individuals, or users with BMI above 35 where joint loading must be carefully managed

- **Level 2 -- Building:**
  - Can complete 5-15 standard push-ups consecutively
  - Can perform 15+ bodyweight squats to parallel with controlled tempo
  - Can hold a plank for 30-60 seconds
  - Appropriate for: people who have exercised before but are inconsistent, or those who completed Level 1 for 4+ weeks

- **Level 3 -- Progressed:**
  - Can complete 20+ standard push-ups consecutively
  - Can perform a Bulgarian split squat for 10 reps per leg without assistance
  - Can hold a plank for 60+ seconds and perform side plank for 30+ seconds
  - Appropriate for: consistent trainees seeking more challenge, those who have trained bodyweight for 8+ weeks

- **Split-level assignments are valid:** A user may be Level 2 for push but Level 1 for pull. Assign exercise levels per movement pattern independently, not as a single global label.

### Step 3: Map Movement Patterns and Select the Specific Exercise for Each

Every training session must contain exactly five movement pattern categories. Select one primary exercise per pattern per session at the user's assigned level for that pattern. Use these full progression chains:

**Horizontal Push:**
- Level 1a: Wall push-up (body at 45-degree angle to wall)
- Level 1b: Counter/kitchen-bench push-up (hands at hip height)
- Level 1c: Incline push-up (hands on chair seat, approximately 18 inches high)
- Level 2a: Standard push-up (hands under shoulders, chest touches floor)
- Level 2b: Tempo push-up (3 seconds down, 1 second pause, 1 second up)
- Level 2c: Wide-grip push-up (hands 1.5x shoulder width, emphasizes chest)
- Level 2d: Close-grip push-up (hands shoulder-width, elbows tracking backward, emphasizes triceps)
- Level 3a: Decline push-up (feet on chair, 12-18 inches elevated)
- Level 3b: Archer push-up (one arm extends laterally, body shifts toward opposite arm)
- Level 3c: Pseudo-planche push-up (hands rotated outward, leaned forward so shoulders are over fingertips)

**Vertical Push:**
- Level 1: Standing shoulder tap (not a true vertical press but builds shoulder stability and wrist loading tolerance)
- Level 2a: Pike push-up (hips high, inverted V position, head descends toward floor between hands)
- Level 2b: Elevated pike push-up (feet on chair, steeper angle)
- Level 3a: Wall-supported headstand negative (kick up against wall, lower slowly -- upper body only at this stage)
- Level 3b: Decline pike push-up with full range (maximally steep pike angle)

**Horizontal Pull (the most commonly neglected pattern in home training):**
- Level 1a: Isometric towel pull (loop a rolled bath towel around a door handle anchored at waist height, sit back on heels with arms extended, pull elbows to ribs -- hold 3 seconds, release)
- Level 1b: Prone Y-T-W-L raises (face-down on floor, move arms through positions: Y = overhead, T = out to sides, W = bent-elbow cactus, L = hands near hips -- all with isometric 2-second holds at peak contraction)
- Level 2a: Inverted row using dining table (lie supine under a sturdy table, grip the edge, body straight, pull chest to table edge)
- Level 2b: Table row with feet elevated on a chair (more horizontal body angle increases difficulty)
- Level 2c: Doorframe row (stand in doorway, grip both sides at shoulder height, lean back to roughly 45 degrees, pull chest to doorframe)
- Level 3a: Inverted row with 3-second lowering phase
- Level 3b: Single-arm inverted row (progress to this only when 3 x 15 bilateral rows are achievable)

**Squat:**
- Level 1a: Sit-to-stand from chair (18-inch seat height, stand fully, lower slowly with 3-second eccentric)
- Level 1b: Assisted squat (hold a doorframe or table leg for counterbalance, allows torso to stay upright)
- Level 2a: Bodyweight squat (feet shoulder-width, toes turned 15-30 degrees out, descend to parallel, 2-second lowering)
- Level 2b: Pause squat (3-second hold at parallel)
- Level 2c: Reverse lunge (step back, lower rear knee to 1 inch from floor, return to standing)
- Level 2d: Lateral lunge (step 2 feet to the side, push hips back, knee tracks over toes, return)
- Level 3a: Bulgarian split squat (rear foot on chair 18-20 inches high, front foot 2-3 feet forward, descend until rear knee approaches floor)
- Level 3b: Single-leg squat to chair (pistol progression: sit back onto chair from one leg, stand from one leg)
- Level 3c: Shrimp squat (rear foot held by hand behind body, descend until rear knee touches floor)

**Hinge:**
- Level 1a: Glute bridge (supine, feet flat on floor, drive hips up, 2-second hold at top, focus on posterior pelvic tilt)
- Level 1b: Glute bridge with 5-second hold and slow lowering
- Level 2a: Single-leg glute bridge (one foot planted, other leg extended, 1-second hold at top each rep)
- Level 2b: Hip thrust (shoulders resting on couch or chair, feet flat, full range of hip extension)
- Level 3a: Single-leg hip thrust
- Level 3b: Nordic hamstring curl (anchor feet under a sofa, lower torso toward floor under control -- arguably the most effective bodyweight posterior chain exercise; very high difficulty, even for trained individuals)
- Level 3c: Good morning (no load, hinge at hips with soft knee bend, feel hamstring tension at bottom)

**Core (Anterior and Lateral):**
- Level 1a: Dead bug (supine, arms vertical, knees at 90 degrees, extend opposite arm and leg slowly while keeping lower back pressed to floor)
- Level 1b: Hollow body hold -- bent-knee version (knees tucked toward chest, arms overhead, lower back pressed into floor, hold)
- Level 2a: Plank from toes (forearms or hands, full-body tension, no sagging hips)
- Level 2b: Side plank (elbow or hand variation, hips stacked, straight line from head to feet)
- Level 2c: Hollow body hold -- straight-leg version (legs extended, arms overhead, lower back must not arch off floor)
- Level 2d: Bird-dog (quadruped, extend opposite arm and leg simultaneously, hold 2 seconds, resist rotation)
- Level 3a: Ab wheel rollout substitute -- furniture slider or socks on hardwood (hands on floor, extend arms forward like a rollout)
- Level 3b: Hanging knee raise substitute -- captain's chair substitute using two sturdy chairs (hands on chair backs, support on arms, raise knees to chest)
- Level 3c: L-sit hold between two chairs or on floor between feet (requires significant hip flexor and tricep strength)

### Step 4: Design the Weekly Schedule Architecture

Match schedule design to stated frequency AND time constraints. Present these as fixed options, not open-ended choices:

**3 days per week (most effective for beginners -- recommended default):**
- Use an A/B alternating format -- train A on Monday, B on Wednesday, A on Friday, then B/A/B the following week
- Each session is full-body, hitting all five movement patterns
- Workout A emphasizes squat and horizontal push/pull
- Workout B emphasizes hinge, vertical push, and lateral/unilateral squat variations
- This ensures each pattern gets 1.5 sessions per week on average, which is the minimum effective dose for skill acquisition and hypertrophy in beginners

**4 days per week:**
- Use Upper/Lower split: Upper on Monday and Thursday, Lower on Tuesday and Friday
- Upper sessions: horizontal push, vertical push, horizontal pull, plus one core exercise
- Lower sessions: squat, hinge, unilateral leg variation, plus one core exercise
- Each pattern trained twice per week with 48-72 hours between same-pattern sessions

**5 days per week:**
- Use Push/Pull/Legs/Upper/Lower rotation
- Day 1 (Push): horizontal push, vertical push, tricep-dominant core work
- Day 2 (Pull): horizontal pull, posterior chain core work (bird-dog, Y-T-W)
- Day 3 (Legs): squat, hinge, unilateral squat, core
- Day 4 (Upper): combined upper with priority variation (opposite emphasis from Day 1/2)
- Day 5 (Lower): second lower session with heavier emphasis on single-leg work
- Never schedule more than 3 consecutive training days -- insert at minimum 1 rest day before resuming

**20-minute sessions:**
- Reduce to 4 exercises per session (drop the second core exercise)
- Use 2 sets per exercise instead of 3
- Keep rest to 60 seconds maximum
- This is a legitimate maintenance dose but insufficient for significant strength progress -- advise the user that 30 minutes is the practical minimum for meaningful progress

**30-minute sessions:** The default target. 3 sets of 5 exercises with 60-90 second rest fits in 25 minutes of training time, leaving 2.5 minutes for warm-up and 2.5 minutes for cooldown.

**45-minute sessions:**
- Can accommodate 6 exercises per session, or 4 exercises with 4 sets each
- Add one supplemental exercise per session -- calf raises, rotator cuff work (prone Y-T-W), or hip mobility (world's greatest stretch, couch stretch)

### Step 5: Set Exact Volume, Intensity, and Rest Parameters

Do not give vague rep ranges -- give specific prescriptions based on level and exercise type:

**Level 1:**
- Compound movements (squat, push, pull, hinge): 2 sets of 8-10 reps, 90-second rest between sets
- Core movements: 2 sets of 15-20 seconds (timed) or 8-10 reps, 60-second rest
- Total session volume: 10-14 working sets maximum -- beginners cannot recover from more
- Eccentric tempo: 2-3 seconds on the lowering phase for every exercise -- this is where motor learning happens

**Level 2:**
- Compound movements: 3 sets of 10-15 reps, 60-90 seconds rest
- Unilateral movements (lunges, single-leg bridges): 3 sets of 8-12 reps per side, 60-second rest
- Core movements: 2-3 sets of 20-45 seconds or 10-15 reps, 60-second rest
- Total session volume: 15-20 working sets maximum
- Introduce 1-second pauses at the hardest point of the range of motion (bottom of squat, top of bridge, end of dead bug extension) as a technique tool

**Level 3:**
- Compound movements: 3-4 sets of 6-12 reps (the harder the variation, the lower the rep count), 60-90 seconds rest
- Single-limb movements: 3-4 sets of 6-10 reps per side, 90-second rest
- Core: 2-3 sets of 30-60 seconds or 10-15 reps of harder variations, 60-second rest
- Total session volume: 18-24 working sets maximum
- Tempo prescriptions are valuable here: 4-second eccentrics on archer push-ups and Bulgarian split squats create significant mechanical tension without needing more load

**Warm-up protocol (3-5 minutes, non-negotiable):**
- 60 seconds: low-impact movement (marching in place, slow arm circles, hip circles)
- 60 seconds: leg swings (front-back and lateral, 10 per direction per leg)
- 60 seconds: cat-cow (10 slow repetitions, full spine range)
- 60 seconds: inchworm walk-out (walk hands to plank, hold 2 seconds, walk back -- 5 reps)
- This sequence mobilizes hips, thoracic spine, and shoulders -- the three areas that limit form in push-ups, squats, and hinges

**Cooldown protocol (3-5 minutes):**
- Couch stretch: 60 seconds per side (hip flexor + rectus femoris, essential after squats and lunges)
- Child's pose: 45 seconds (lat and thoracic decompression)
- 90/90 hip stretch: 45 seconds per side (internal and external rotation)
- Cross-body shoulder stretch: 30 seconds per side

### Step 6: Define the Progression System Precisely

The most common failure in home training is doing the same workout indefinitely. Build in explicit triggers and timelines:

**The 2-by-2 Rule (primary progression trigger):**
- When the user can complete all prescribed sets at the TOP of the rep range for 2 consecutive training sessions with good form, they advance to the next variation in the chain
- "Good form" is defined as: full range of motion, controlled tempo on the eccentric, no compensatory movements (hips sagging in push-up, heels rising in squat, lower back arching in plank)
- Do not advance based on "it feels easy" -- only advance based on hitting the rep target twice in a row

**Regression protocol:**
- If the prescribed next variation cannot be performed for at least 6 reps with good form, do NOT attempt to brute-force it
- Return to the previous variation and add a 3-second eccentric phase (slow lowering) -- this is called "tempo loading" and is equivalent to roughly 20-30% additional difficulty without changing the movement
- After 2 weeks of tempo work, re-test the harder variation

**Intra-set progression (for when movement chains plateau):**
- Before advancing to a harder variation, exhaust these intra-variation progressions in order: increase reps to 20+, add a pause at hardest point, add tempo (3-4 second eccentric), add a slight elevation change
- Only advance variation when all intra-variation tools are exhausted

**Deload protocol (every 4th week):**
- Drop to the previous variation in the chain for all exercises
- Reduce sets by 1 across all exercises (3 sets becomes 2 sets, 2 sets becomes 1 set)
- Maintain rep ranges and rest periods
- Purpose: active recovery, consolidation of motor patterns, prevention of overuse
- This is NOT optional -- even with bodyweight training, cumulative joint fatigue (wrists, elbows, knees) is real and should be managed proactively

**Stall protocol (if no progression in 3+ weeks):**
- Check sleep (less than 7 hours consistently will stall bodyweight progress)
- Check caloric intake -- severe restriction slows recovery
- Review form -- many perceived plateaus are really form breakdowns that limit output
- If all three check out, consider adding a second weekly session for the lagging movement pattern during the following 2-week training block

### Step 7: Deliver the Program with Form Cues and Troubleshooting Notes

Every exercise in the output needs exactly three things beyond the prescription: a setup cue, a movement cue, and a common-fault correction. These are not decorative -- they are the mechanism through which an AI assistant replaces the coaching feedback a gym floor trainer would provide.

**Format for each exercise entry:**
- **Setup:** Where to position feet, hands, hips before the movement begins
- **Movement cue:** One tactile or visual cue for the key mechanical demand of the exercise
- **Common fault:** The most frequently observed error for this specific exercise and what to feel/watch for

Examples of high-value cues specific to this domain:
- Push-up fault: "Hips sagging toward floor" -- Cue: "Before you lower, actively squeeze your glutes and brace your abs as if someone is about to poke you in the stomach. The plank must be established before the movement begins."
- Squat fault: "Knees caving inward on the way up" -- Cue: "Push your knees outward over your pinky toes as you stand. Imagine you're trying to spread the floor apart beneath your feet."
- Glute bridge fault: "Lower back hyperextending at the top" -- Cue: "Drive the hips up only to where your body forms a straight line from knee to shoulder. Stop there -- do not arch higher."
- Inverted row fault: "Arms doing all the work, shoulder blades not retracting" -- Cue: "Before you pull, consciously pinch your shoulder blades together and downward. The arms just maintain the connection -- the back muscles do the work."
- Dead bug fault: "Lower back lifting off the floor during leg extension" -- Cue: "If you cannot keep your lower back pressed completely flat against the floor throughout the movement, reduce the range of extension. Bend your knee slightly as you extend."

---

## Output Format

Present the program in this exact structure. Do not abbreviate sections -- the user needs the full document to follow without referring back to the conversation.

```
## Bodyweight Training Program: [Level 1 / Level 2 / Level 3]

> **Health Reminder:** Consult a healthcare professional before starting this program if you have
> any pre-existing health conditions, joint issues, or have been inactive for more than 6 months.
> Stop any exercise that causes sharp pain and seek guidance.

**Schedule:** [X days/week] | **Format:** [Full-body A/B / Upper-Lower / PPL]
**Session duration:** [X minutes total = X min warm-up + X min training + X min cooldown]
**Equipment needed:** None
**Space required:** [Minimum footprint in feet]
**Starting level:** [Level name] -- based on [specific assessment result]

---

### Progression Chains (Your Exercise Roadmap)

| Pattern         | Current Level (Now)         | Next Step (When Ready)       | Advanced (Future)              |
|-----------------|-----------------------------|------------------------------|--------------------------------|
| Horizontal Push | [specific exercise]         | [specific exercise]          | [specific exercise]            |
| Vertical Push   | [specific exercise]         | [specific exercise]          | [specific exercise]            |
| Horizontal Pull | [specific exercise]         | [specific exercise]          | [specific exercise]            |
| Squat           | [specific exercise]         | [specific exercise]          | [specific exercise]            |
| Hinge           | [specific exercise]         | [specific exercise]          | [specific exercise]            |
| Core            | [specific exercise]         | [specific exercise]          | [specific exercise]            |

---

### Warm-Up Sequence (Complete Before Every Session -- [X] Minutes)

1. [Activity] -- [Duration or reps]
2. [Activity] -- [Duration or reps]
3. [Activity] -- [Duration or reps]
4. [Activity] -- [Duration or reps]

---

### Workout A -- [Primary Pattern Focus]

| # | Exercise              | Sets x Reps/Time | Rest    | Setup Cue                        | Movement Cue                          | Fix If...                              |
|---|-----------------------|------------------|---------|----------------------------------|---------------------------------------|----------------------------------------|
| 1 | [Exercise]            | [3 x 10-15]      | [90s]   | [setup position]                 | [key movement instruction]            | [most common fault and correction]     |
| 2 | [Exercise]            | [3 x 10-15]      | [90s]   | [setup position]                 | [key movement instruction]            | [most common fault and correction]     |
| 3 | [Exercise]            | [3 x 8-12]       | [90s]   | [setup position]                 | [key movement instruction]            | [most common fault and correction]     |
| 4 | [Exercise]            | [3 x 10-15]      | [60s]   | [setup position]                 | [key movement instruction]            | [most common fault and correction]     |
| 5 | [Exercise]            | [2 x 20-40s]     | [60s]   | [setup position]                 | [key movement instruction]            | [most common fault and correction]     |

---

### Workout B -- [Primary Pattern Focus]

| # | Exercise              | Sets x Reps/Time | Rest    | Setup Cue                        | Movement Cue                          | Fix If...                              |
|---|-----------------------|------------------|---------|----------------------------------|---------------------------------------|----------------------------------------|
| 1 | [Exercise]            | [3 x 10-12/side] | [90s]   | [setup position]                 | [key movement instruction]            | [most common fault and correction]     |
| 2 | [Exercise]            | [3 x 8-12]       | [90s]   | [setup position]                 | [key movement instruction]            | [most common fault and correction]     |
| 3 | [Exercise]            | [3 x 10-15]      | [90s]   | [setup position]                 | [key movement instruction]            | [most common fault and correction]     |
| 4 | [Exercise]            | [3 x 8-12]       | [60s]   | [setup position]                 | [key movement instruction]            | [most common fault and correction]     |
| 5 | [Exercise]            | [2 x 30-45s]     | [60s]   | [setup position]                 | [key movement instruction]            | [most common fault and correction]     |

---

### Cooldown Sequence (Complete After Every Session -- [X] Minutes)

1. [Stretch/mobility exercise] -- [Duration per side]
2. [Stretch/mobility exercise] -- [Duration per side]
3. [Stretch/mobility exercise] -- [Duration]
4. [Stretch/mobility exercise] -- [Duration per side]

---

### When to Progress: Your Rules

| Trigger                                                              | Action                                                        |
|----------------------------------------------------------------------|---------------------------------------------------------------|
| Complete all sets at top of rep range, 2 sessions in a row           | Advance to next variation in the Progression Chain table      |
| Next variation feels impossible (under 6 reps with good form)        | Stay at current variation, add 3-second eccentric for 2 weeks |
| Every 4th week                                                       | Drop one variation level, remove 1 set per exercise (deload)  |
| No progress after 3 consecutive weeks                                | Review sleep, nutrition, and form before changing the program  |

---

### Sample Monthly Timeline

**Weeks 1-3:** [Current program as prescribed above]
**Week 4:** [Deload description -- specific variations and volume reduction]
**Weeks 5-7:** [Next progression step for each exercise]
**Week 8:** [Second deload or re-assessment checkpoint]
```

---

## Rules

1. **Always lead with the disclaimer** before providing any program content. The disclaimer is not optional decoration -- it is a user protection mechanism that must appear in every response that contains exercise prescriptions.

2. **Assign levels per movement pattern, not globally.** A user who can do 20 push-ups but has never done a Romanian deadlift is Level 3 for push and Level 1 for hinge. A single global level assignment will either under-train strong patterns or injure weak ones.

3. **Never omit the horizontal pull pattern** simply because no pull-up bar exists. Doorframe rows, inverted table rows, and towel-around-door-handle pulls are imperfect but adequate for posterior chain stimulation. Omitting pull work creates shoulder girdle imbalance, which is the primary cause of shoulder discomfort in home trainees who do only push-up variants.

4. **Never recommend more than 5 training days per week** for this population. Beginners using bodyweight training have less objective load management than barbell trainees -- "light bodyweight work" is still neurological and connective tissue work. The perceived lightness is misleading.

5. **Never suggest purchasing equipment** within this skill, including resistance bands, pull-up bars, parallettes, sliders, or gymnastics rings. If the user's limitations truly cannot be addressed without equipment, honestly state that the program will be suboptimal for one specific pattern (typically vertical pull) and explain the best available substitute.

6. **Tempo is a free progression tool that must be taught explicitly.** Without external load, tempo is the primary mechanism for increasing mechanical tension. A 3-second eccentric push-up creates substantially more muscular tension than a 1-second eccentric push-up, despite identical external resistance. This concept must be communicated to the user, not assumed.

7. **Rep ranges must have both a floor and a ceiling.** Never prescribe "3 x 10+" without a ceiling. Open-ended rep prescriptions cause beginners to either stop too early (conservative bias) or grind to failure on every set (aggressive bias). Both patterns lead to stalled progress.

8. **The deload week is mandatory, not optional.** Wrist extensor tendinopathy, patellar tendon irritation, and medial epicondyle loading are the three most common overuse complaints in home trainees doing push-ups, squats, and inverted rows respectively. A structured deload every 4th week reduces cumulative tendon load before symptoms develop.

9. **If the user reports pain (not muscle soreness) during any prescribed exercise, stop prescribing that movement pattern immediately.** Distinguish clearly between the two: muscle soreness is diffuse, appears 12-48 hours after training, and feels better when the muscle is warmed up. Joint or tendon pain is localized, often present at the start of movement, and does not improve with warm-up. Advise medical consultation for the latter.

10. **Space requirements determine exercise selection before all other factors.** A user who says "I only have space to stand up in" cannot do reverse lunges or bear crawls. Prescribing movements that require 8+ feet of space for a user in a 6 x 6-foot apartment destroys adherence on day one. Confirm the space audit result before selecting any locomotor or traveling exercise.

11. **Warm-up and cooldown time must be included within the stated session duration, not added on top of it.** If the user says "I have 30 minutes," the training block is 20-22 minutes, not 30 minutes. This is consistently misrepresented in generic programming and causes user frustration when the session "runs over."

12. **When prescribing bilateral and unilateral versions of the same pattern in the same session, do bilateral first.** Bilateral squats before lunges, bilateral bridges before single-leg bridges. Pre-exhausting one leg with lunges before squats causes compensatory form breakdown. The reverse does not hold -- bilateral exercises serve as effective warm-up for unilateral work.

---

## Edge Cases

### Edge Case 1: User Cannot Perform a Single Standard Push-Up

This is more common than beginners admit. A significant portion of adults who have never trained cannot complete one full-range push-up with proper form.

- **Do not suggest "just keep trying push-ups."** This does not work -- it practices the fault, not the movement.
- Start at wall push-ups performed perfectly: hands at shoulder width, elbows track back at 45 degrees (not flared to 90 degrees), chin leads chest, full range from arms extended to chest near wall.
- Use a measurable height regression protocol: wall (5-6 feet off floor) → countertop (3 feet) → chair seat (18 inches) → floor. Each step represents roughly 20-25% more load through the upper body.
- Typical timeline to one floor push-up from wall push-up starting point: 6-12 weeks at 3 sessions per week, provided progression rules are followed.
- Add a psychological note: performing 3 x 12 perfect wall push-ups is a real training stimulus and should be presented as such, not as a consolation exercise.

### Edge Case 2: User Has Knee Pain During Squats and Lunges

Knee discomfort in squats is often caused by one of three addressable technique errors, not structural damage.

- First, check foot position: toes should be turned out 15-30 degrees. Parallel feet force internal tibial rotation in most people, loading the medial knee.
- Second, check knee tracking: the knee should travel in line with the second and third toe. If it dives inward, regress to assisted squats holding a doorframe and consciously drive knees out throughout the movement.
- Third, check depth: beginners with tight hip flexors and ankle dorsiflexion limitations compensate with knee-dominant forward lean. Elevate heels 0.5-1 inch using a folded towel or book. This immediately improves depth and reduces anterior knee stress for most users.
- If pain persists after all three adjustments, prescribe hinge-dominant alternatives only (glute bridges, single-leg bridges, hip thrusts) and advise physiotherapy consultation before returning to squat patterns.
- Do not prescribe lunges for users reporting knee pain in squats until squat form is painless -- lunges create higher peak knee forces than squats at equivalent depths.

### Edge Case 3: Very Limited Space (Under 6 x 6 Feet -- Dorm Room, Hotel Room, Small Studio)

- Eliminate all traveling movements: no forward lunges, lateral lunges, bear crawls, mountain climbers (traveling), or inchworms with walkout.
- Full program in a 4 x 6 foot footprint using stationary movements only: push-ups, pike push-ups, glute bridges, squats (no step), planks, dead bugs, and standing movements.
- For horizontal pull, the doorframe row works in this space -- stand in the doorway, grip both sides at shoulder height or waist height.
- Standing calf raises (double and single-leg) can substitute for a second lower-body movement when space prohibits lunges.
- Core work is entirely unaffected by space -- all plank and floor-based core movements fit in a 2 x 6 foot strip.

### Edge Case 4: User Is Significantly Overweight (BMI 35+) or Has Joint Loading Concerns

- All floor-level exercises that require getting up and down from the ground (push-ups, planks, glute bridges) remain valid -- do not eliminate them -- but begin at the highest regression point in the chain.
- For push-ups: begin at counter height or higher to reduce the proportion of bodyweight loaded through the wrists and shoulders.
- For squats: use a chair as a depth guide and target device. Sit fully, stand slowly, with a 3-second lowering phase. This eliminates the fear of "going too deep" and reduces impact forces at the knee.
- Increase rest intervals to 2 full minutes for all exercises -- cardiovascular recovery is the limiting factor, not muscle fatigue, at this stage.
- Reduce session volume significantly in the first 2 weeks: 2 sets per exercise maximum, regardless of level. Volume ramp is more critical here than for normal-weight beginners -- connective tissue adaptation (tendons, ligaments) lags behind muscle and cardiovascular adaptation by 4-8 weeks.
- Do NOT rush progression to harder variations. Consistency and adherence over 8+ weeks matters more than reaching Level 2 quickly.

### Edge Case 5: User Wants to Train Every Day

This is a motivation management issue, not just a programming issue.

- Acknowledge the motivation positively -- daily training intention is a good sign of commitment.
- Explain that daily training of the same movements produces diminishing returns because the muscular and tendon adaptation to bodyweight training occurs during recovery, not during the session.
- Offer a structured 5-day program with 2 rest days, making the rest days feel intentional: "Those two days are when your body is rebuilding stronger. They are part of the program."
- If the user is adamant about daily activity, offer a 5-day training program plus 2 days of "active recovery" -- 20 minutes of walking, light mobility work, or the yoga-routine-builder skill. This satisfies the psychological need for daily activity without accumulating damaging training load.
- Never schedule more than 3 consecutive training days. After the 3rd day, a rest or active recovery day is non-negotiable regardless of user preference.

### Edge Case 6: User Has Wrist Pain During Push-Up Variations

Wrist pain during push-ups is extremely common in beginners and almost entirely preventable.

- The cause is nearly always wrist extension load intolerance -- the wrists are not accustomed to bearing weight in this position.
- Immediate regression: move to fist push-ups (knuckles on the floor, wrist in neutral extension). This is a legitimate and common modification that reduces wrist extension by approximately 30-40 degrees.
- Alternatively, use push-up handles (but this violates the no-equipment rule) -- instead, suggest placing hands on two books of equal height (roughly 1.5 inches) to reduce the extension angle.
- Wrist circles before push-up work (10 circles in each direction, wrists loaded on all fours for 30 seconds) are a mandatory warm-up addition for this user.
- This is typically a 3-6 week adaptation period. After consistent exposure, most users can return to flat-palm push-ups.

### Edge Case 7: User Is Pregnant or Has Recently Given Birth

This requires a fundamentally different approach and an explicit scope-of-practice boundary.

- Do NOT prescribe supine exercises (glute bridges, dead bugs, standard planks) after the first trimester without noting that this requires healthcare provider guidance due to supine hypotensive syndrome risk.
- Do NOT prescribe any exercise involving Valsalva maneuver or significant intra-abdominal pressure without directing the user to a physiotherapist specializing in pelvic floor health.
- Appropriate scope for this skill: acknowledge the request, provide the general information that bodyweight exercise during uncomplicated pregnancy is generally supported by major health organizations, and strongly recommend the user work with a prenatal fitness specialist or their obstetric healthcare provider before following any specific program.
- For postpartum users: same recommendation. Pelvic floor recovery timelines vary enormously and cannot be addressed by a general home workout skill.

### Edge Case 8: User Has No Furniture Suitable for Rows (Minimalist Space, Air Mattress, Low Tables)

- Confirm the exact situation: are there doorways? Even hollow-core interior doors can be gripped in the doorframe if the user braces feet against the door frame base.
- Towel-around-door-handle rows: loop a bath towel (not a hand towel -- it must be long enough) around a door handle, close the door fully, hold both ends, walk feet toward the door, lean back 20-30 degrees, and row by pulling elbows to ribs. The door must be solid -- test it can hold the user's partial bodyweight before using it dynamically.
- Prone posterior chain work (Y-T-W-L raises) becomes the primary horizontal pull substitute. It is isometric and less effective for building pulling strength than rowing, but it maintains scapular retraction and depression patterning, which is the most important function of horizontal pull work for posture.
- Be honest: this is the weakest area of equipment-free programming. The posterior shoulder and mid-back cannot be loaded as effectively as with a barbell row or cable row. Set appropriate expectations -- the user will see slower development of back thickness and pulling strength compared to a gym-trained peer.

---

## Example

**User Input:** "I want to start working out at home. I've never really trained before. I can barely do 5 push-ups and I'm not sure my squat is correct. I have a living room with reasonable space and 30 minutes three days a week. I also have a dining room table."

**Assessment conclusion:** Level 1-2 split -- Level 1 for horizontal push (5 push-ups is below the Level 2 threshold of 5-15 WITH good form -- form is reported as uncertain), Level 2 for squat (can squat, form uncertain, use assisted regression as starting point), Level 1 for pull (never trained, use table inverted row as starting point), Level 1 for hinge (glute bridge as start), Level 1 for core (dead bug as start). Program: 3 days/week full-body A/B.

---

## Bodyweight Training Program: Foundation-to-Building (Level 1 transitioning to Level 2)

> **Health Reminder:** Consult a healthcare professional before starting this program if you have any pre-existing health conditions, joint issues, or have been inactive for more than 6 months. Stop any exercise that causes sharp joint pain and seek guidance from a qualified professional.

**Schedule:** 3 days/week | **Format:** Full-body A/B alternating (Week 1: A/B/A, Week 2: B/A/B)
**Session duration:** 30 minutes = 5 min warm-up + 20 min training + 5 min cooldown
**Equipment needed:** None (uses dining table and a wall)
**Space required:** 8 x 6 feet minimum -- your living room is sufficient
**Starting level:** Foundation (Level 1) -- progressing to Building (Level 2) within 4-6 weeks

---

### Progression Chains (Your Exercise Roadmap)

| Pattern          | Now (Weeks 1-4)              | Next Step (Weeks 5-8)            | Future Goal (Weeks 9+)              |
|------------------|------------------------------|----------------------------------|-------------------------------------|
| Horizontal Push  | Incline push-up (chair ht.)  | Standard push-up (floor)         | Tempo push-up (3s lowering)         |
| Vertical Push    | Standing shoulder tap        | Pike push-up (feet on floor)     | Elevated pike push-up (feet on sofa)|
| Horizontal Pull  | Table inverted row (bent leg)| Table inverted row (legs straight)| Feet-elevated inverted row          |
| Squat            | Assisted squat (doorframe)   | Bodyweight squat                 | Pause squat (3-second hold)         |
| Hinge            | Glute bridge (2s hold)       | Single-leg glute bridge          | Hip thrust (shoulders on sofa)      |
| Core             | Dead bug (bent knee)         | Plank from knees                 | Plank from toes                     |

---

### Warm-Up Sequence (Complete Before EVERY Session -- 5 Minutes)

1. Marching in place with exaggerated arm swing -- 60 seconds
2. Leg swings front-to-back, holding a wall for balance -- 10 reps each leg, then lateral swings 10 reps each leg
3. Cat-cow on hands and knees -- 10 slow repetitions (5 seconds per full cycle)
4. Inchworm: stand tall, hinge at hips, walk hands out to push-up position, hold 2 seconds, walk back -- 4 repetitions
5. Hip circles standing (hands on hips, draw large circles with the pelvis) -- 8 clockwise, 8 counterclockwise

---

### Workout A -- Squat + Horizontal Push + Pull Focus

| # | Exercise                   | Sets x Reps      | Rest  | Setup                                                      | Movement Cue                                              | Fix If...                                                                          |
|---|----------------------------|------------------|-------|------------------------------------------------------------|-----------------------------------------------------------|------------------------------------------------------------------------------------|
| 1 | Assisted Squat             | 2 x 8-10         | 90s   | Stand facing a doorframe, grip the frame at waist height with both hands, feet shoulder-width, toes turned 15-20 degrees out | Sit straight down between your heels -- the doorframe lets you counterbalance so your torso stays upright | Your knees dive inward: consciously push them out toward your pinky toes as you stand |
| 2 | Incline Push-Up            | 2 x 8-12         | 90s   | Hands on the edge of a sturdy chair seat, shoulder-width apart, body forms a straight line from head to heels | Lower your chest to within 1 inch of the chair, pause for 1 second, press back up -- elbows track at 45 degrees from your torso, not flared to 90 | Your hips sag toward the floor: squeeze your glutes and brace your abs before you lower -- maintain the plank throughout |
| 3 | Table Inverted Row (bent knees) | 2 x 8-12    | 90s   | Lie under your dining table, grip the far edge with hands just outside shoulder width, bend your knees so feet are flat on floor, hips lifted so body forms a straight line from knees to shoulders | Before you pull, pinch your shoulder blades together and down. Then drive your elbows toward your hip pockets | Your lower back arches away from the straight-line position: re-engage your abs and glutes -- the entire body should move as one rigid unit |
| 4 | Glute Bridge               | 2 x 12-15        | 60s   | Lie on your back, feet flat on floor hip-width apart, heels 6-8 inches from your glutes | Drive through your heels, squeeze your glutes hard, lift hips until body forms a straight line from knees to shoulders -- hold 2 full seconds at the top before lowering | Your lower back arches excessively at the top: stop at the point where your body is a straight line -- going higher is hyperextension, not additional glute work |
| 5 | Dead Bug (bent knee)       | 2 x 8 each side  | 60s   | Lie on your back, press lower back firmly into the floor, arms pointing to ceiling, knees bent at 90 degrees directly above hips | Slowly lower one heel toward the floor while extending the opposite arm overhead -- the lower back must stay pressed to the floor throughout. If it lifts, reduce the range | Your lower back lifts off the floor: reduce how far you extend the arm and leg. Only go as far as you can while keeping the lower back completely flat |

---

### Workout B -- Hinge + Vertical Push + Unilateral Leg Focus

| # | Exercise                      | Sets x Reps       | Rest  | Setup                                                      | Movement Cue                                              | Fix If...                                                                          |
|---|-------------------------------|-------------------|-------|------------------------------------------------------------|-----------------------------------------------------------|------------------------------------------------------------------------------------|
| 1 | Reverse Lunge                 | 2 x 8 each leg    | 90s   | Stand tall with feet together near a wall (touch it lightly for balance if needed) | Step one foot straight back 2.5-3 feet, lower your rear knee to within 1 inch of the floor, keep your front shin roughly vertical -- then push through the front heel to return | Your front knee shoots far forward past your toes: step back slightly further with the rear foot, and consciously keep 60% of your weight through the front heel |
| 2 | Pike Push-Up                  | 2 x 6-10          | 90s   | Start in a push-up position, then walk feet toward hands until hips are as high as comfortable (inverted V) -- hands shoulder-width, fingers pointing slightly outward | Lower the top of your head toward the floor between your hands by bending your elbows outward, pause 1 second, press back up | Your hips drop during the movement: this becomes a push-up rather than a vertical press. Reset the high hip position before each rep |
| 3 | Towel Doorknob Row            | 2 x 10-15         | 90s   | Loop a bath towel securely around a closed door handle. Hold both ends, walk feet to the door base, lean back 25-30 degrees, arms fully extended | Pull your elbows to your ribs and squeeze your shoulder blades together at the end of the pull -- 1-second hold -- then lower slowly over 3 seconds | You're pulling mostly with your arms and the shoulder blades are not moving: focus on the sensation of the shoulder blades pinching together before the elbows move |
| 4 | Single-Leg Glute Bridge       | 2 x 8-10 each leg | 60s   | Same setup as glute bridge but extend one leg straight, keeping both knees at the same height throughout | Drive through the planted heel only, squeeze the working glute, raise hips to a level position -- hold 1 second at the top. The non-working leg is a balance cue only | The extended leg drops lower than the working-side knee: this signals the hip is rotating -- keep both knee heights matched throughout |
| 5 | Plank from Knees              | 2 x 20-30 seconds | 60s   | Forearms on the floor, elbows directly below shoulders, knees on the floor, hips slightly elevated so body forms a straight line from knees to head | Squeeze your abs as if bracing for a punch, squeeze your glutes, breathe normally -- do not hold your breath | Your hips rise up toward the ceiling (tent position): this removes core tension. Lower them until your body forms a straight diagonal line and feel the abdominal engagement increase |

---

### Cooldown Sequence (Complete After EVERY Session -- 5 Minutes)

1. Couch / doorframe hip flexor stretch -- kneel on one knee, other foot forward, gently push hips forward -- 60 seconds per side
2. Child's pose -- sit back on heels, arms extended forward on floor, forehead down -- 45 seconds
3. 90/90
