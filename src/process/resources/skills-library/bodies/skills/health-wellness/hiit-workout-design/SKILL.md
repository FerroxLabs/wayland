---
name: hiit-workout-design
description: |
  Designs high-intensity interval training workouts with structured work-rest ratios, exercise selection by fitness level and equipment, session duration planning, and progressive difficulty scaling. Produces a complete HIIT session template with warm-up, intervals, and cooldown.
  Use when the user asks about HIIT workouts, interval training, circuit training design, or time-efficient high-intensity sessions.
  Do NOT use for steady-state cardio programming (use cardio-training-zones), strength training programs (use beginner-strength-training or intermediate-strength-training), or yoga and flexibility work (use yoga-routine-builder).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "fitness workout-planning template"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# HIIT Workout Design

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before starting a new fitness program, especially if you have cardiovascular, metabolic, orthopedic, or respiratory conditions. If you experience chest pain, dizziness, shortness of breath disproportionate to effort, or heart palpitations during exercise, stop immediately and seek emergency medical care.

---

## When to Use

**Use this skill when:**
- The user explicitly asks to design, build, or improve a HIIT, interval training, or circuit training session -- including requests for Tabata, EMOM, AMRAP, or pyramid interval formats
- The user wants a time-efficient conditioning session (15-45 minutes total) that uses heart rate elevation as the primary training stimulus
- The user asks about work-to-rest ratios, interval lengths, or how to structure high-intensity bursts within a workout
- The user wants to improve cardiovascular fitness, metabolic conditioning, or fat oxidation through intermittent high-effort exercise
- The user asks how to progress or periodize HIIT sessions over multiple weeks -- including when to increase density, intensity, or volume
- The user wants a sport-specific conditioning circuit (e.g., fighters, soccer players, cyclists) that mirrors the energy demands of their activity using interval principles
- The user asks about combining HIIT with other training modalities on the same day or within the same training week

**Do NOT use when:**
- The user wants steady-state, zone-based aerobic conditioning (use `cardio-training-zones` -- HIIT and Zone 2 training serve fundamentally different adaptations)
- The user's primary goal is maximal strength, hypertrophy, or a structured progressive overload program (use `beginner-strength-training` or `intermediate-strength-training` -- HIIT does not provide sufficient mechanical tension for these goals)
- The user wants yoga, mobility, or flexibility work (use `yoga-routine-builder` or `stretching-and-flexibility`)
- The user has been explicitly advised by a physician to avoid high-intensity exercise -- defer to their medical provider's guidance without attempting to design a workaround
- The user describes symptoms suggestive of a cardiovascular or metabolic condition that has not been evaluated (unexplained exercise intolerance, chest pain history, syncope, arrhythmia) -- advise medical clearance first
- The user is in their first 2-4 weeks of any exercise program with no prior fitness base (use `home-workout-no-equipment` with progressive entry points and redirect back here once base fitness is established)
- The user is more than 28 weeks pregnant or early postpartum without medical clearance -- defer entirely to their obstetric provider

---

## Process

### Step 1 -- Gather Session Parameters and Establish the Physiological Profile

Before selecting a format or exercises, establish the physiological context. Inadequate intake here produces a generic workout rather than one matched to the user's actual capacity.

- **Fitness level:** Distinguish between beginner (less than 6 months consistent training, HR recovery slow), intermediate (6-24 months consistent training, can sustain effort at RPE 7 for 20+ minutes), and advanced (2+ years, can train at RPE 8-9 repeatedly within a session with rapid HR recovery)
- **Training history specifics:** Does the user have experience with plyometrics? With loaded carries or kettlebell work? With explosive movements like jump squats or broad jumps? Technical background determines exercise selection ceiling
- **Available equipment:** Categorize as (1) pure bodyweight, (2) minimal -- one or two dumbbells or a single kettlebell, (3) home gym -- dumbbells, bench, pull-up bar, resistance bands, (4) full commercial gym
- **Session time window:** Clarify whether the stated time includes warm-up and cooldown, or just the work block. The distinction matters -- a 20-minute request that includes warm-up and cooldown allows only 12-14 minutes of actual interval work
- **Goal hierarchy:** Fat loss / metabolic conditioning, cardiovascular fitness improvement, athletic performance and sport conditioning, muscle endurance, or general health maintenance -- each shifts the optimal work:rest ratio and exercise selection
- **Constraints:** Joint issues (knees, shoulders, lower back), cardiovascular limitations, balance deficits, pregnancy, or injury history. Any reported constraint activates the corresponding edge case protocol
- **Weekly training volume context:** Determine how many days per week the user trains total and what modalities -- this determines safe HIIT frequency and how aggressive the programming can be

### Step 2 -- Select the HIIT Protocol Format Based on Physiology and Goal

Not all HIIT formats are interchangeable. Each creates a distinct metabolic and physiological stimulus. Match the format to the goal, not just the preference.

**Tabata (20s work / 10s rest x 8 rounds = 4 minutes per block):**
- Developed by Izumi Tabata to maximize VO2max gains. The protocol requires true maximal or near-maximal effort (RPE 9-10) during each work interval to produce its intended stimulus
- Most effective for cardiovascular adaptation and anaerobic capacity when performed correctly. Often used incorrectly at moderate intensity, which reduces it to a less efficient traditional interval
- Best suited for intermediate-to-advanced users. Beginners cannot sustain the required intensity safely across 8 rounds
- Limit to 1-2 Tabata blocks per session. More than 3 blocks at true maximal effort creates excessive fatigue with diminishing returns
- Ideal exercise choices: stationary bike sprint, rowing machine sprint, burpees, jump squats -- exercises that can reach near-max effort quickly and be sustained in the 20-second window

**Traditional Intervals (variable work:rest ratios):**
- The most flexible format. Ratios are calibrated by fitness level and energy system target:
  - **Beginner:** 20s work / 40s rest (1:2) or 30s work / 60s rest (1:2) -- allows phosphocreatine (PCr) resynthesis, manageable fatigue accumulation
  - **Intermediate:** 30s work / 30s rest (1:1) -- introduces incomplete recovery, trains lactate buffering
  - **Advanced:** 40s work / 20s rest (2:1) or 45s work / 15s rest (3:1) -- high density, requires robust aerobic base to avoid excessive drift
- For aerobic intervals targeting VO2max (Billat protocol): 3-5 minute work intervals at 95-100% vVO2max intensity, equal rest. This is distance-running-oriented and better suited to treadmill or outdoor training
- For metabolic conditioning: shorter intervals (20-45s) with incomplete recovery to accumulate lactate and drive EPOC (excess post-exercise oxygen consumption)

**EMOM (Every Minute On the Minute):**
- At the top of each minute, complete a prescribed rep count. The remaining time in that minute is rest
- Self-pacing mechanism: as fitness improves, the user finishes reps faster, earning more rest -- built-in progression signal
- Rep targets should allow completion in 35-45 seconds, leaving 15-25 seconds of rest. If rest drops below 10 seconds the rep target is too high; if rest exceeds 30 seconds consistently the target is too low
- Works best with compound movements that have stable technique: goblet squats, dumbbell push press, kettlebell swings, push-ups, dumbbell Romanian deadlifts
- For advanced users, alternate-EMOM format (A/B): odd minutes perform exercise A, even minutes perform exercise B, creating true active recovery between movements

**AMRAP (As Many Rounds As Possible):**
- Complete a defined circuit of exercises as many times as possible in a set time window (typically 8-20 minutes)
- Self-competitive format: the user records rounds + reps completed, then attempts to beat that score in subsequent sessions -- built-in progression metric
- Circuit should be 3-6 exercises with 5-15 reps each. Rep ranges that take longer than 60-90 seconds per exercise per round make the session too aerobic and slow
- Pace strategy matters: beginners often sprint early and crash; coach the user to aim for a sustainable pace that allows consistent round completion throughout the time window
- Excellent for conditioning without rigid timing constraints -- good when the user dislikes watching a clock

**Pyramid Intervals:**
- Work intervals increase then decrease within a session: 20s / 30s / 40s / 50s / 40s / 30s / 20s with fixed rest (e.g., 20 seconds)
- Creates varied lactate stimulus within a single session -- useful for intermediate-to-advanced users who have adapted to a fixed ratio
- Total duration is predictable and the psychological benefit of "coming back down" helps sustain effort during the ascending phase

### Step 3 -- Select Exercises Using Movement Pattern Sequencing

Exercise selection is the most consequential variable after format. Random selection produces disproportionate localized fatigue and injury risk.

**The Alternating Movement Pattern Rule:**
Never program two consecutive exercises with the same primary mover. Use this six-pattern rotation as the framework:
1. Lower body push (squat pattern) -- quad-dominant: goblet squat, jump squat, split squat, step-up
2. Upper body push (horizontal or vertical) -- chest/shoulder-dominant: push-up, dumbbell press, pike push-up
3. Hip hinge (posterior chain) -- glute/hamstring-dominant: kettlebell swing, dumbbell Romanian deadlift, glute bridge
4. Upper body pull -- back-dominant: renegade row, dumbbell bent-over row, inverted row, band pull-apart
5. Core anti-rotation or anti-extension -- spinal stability: mountain climber, plank variation, hollow body hold, dead bug
6. Locomotion / cardio burst -- full-body demand: burpee, high knees, jumping jacks, skater jumps, bear crawl

For a 4-exercise circuit, use patterns 1, 2, 3, and 5 or 6. For 6 exercises, use all six patterns in sequence. For 8 exercises (advanced), cycle through the six and repeat two non-overlapping patterns.

**Equipment-to-Exercise Matching:**
- **Bodyweight only, beginner:** Push-up (or knee push-up), bodyweight squat, reverse lunge, glute bridge, mountain climber, plank hold, march in place
- **Bodyweight only, intermediate:** Push-up variations (wide, close, decline), jump squat, alternating reverse lunge, single-leg glute bridge, mountain climber with twist, plank to downward dog, burpee
- **Bodyweight only, advanced:** Plyometric push-up, pistol squat regression, lunge jump, Nordic hamstring curl (with anchor), hollow body rock, V-up, full burpee with tuck jump
- **Single kettlebell:** Kettlebell swing (foundational hip hinge), goblet squat, single-arm overhead press, single-arm row, Turkish get-up (too technical for HIIT), around-the-body pass, clean-to-press
- **Pair of dumbbells:** Dumbbell thruster, renegade row, reverse lunge with dumbbells, dumbbell Romanian deadlift, push press, bent-over row, lateral raise (not ideal for HIIT -- too isolated), farmer carry variation
- **Full gym:** Add rowing machine or ski erg intervals, dumbbell or barbell complex, cable machine circuits, assault bike intervals (the assault bike is the gold standard for true HIIT effort due to total body demand and unlimited resistance)

**Plyometric threshold by level:**
- Beginner: No plyometrics (no jumping). Use low-impact analogues exclusively
- Intermediate: Box jumps (low box, 12-16 inches), jump squats, lunge jumps (scissor jumps), broad jumps
- Advanced: Depth drops, reactive box jumps, bounding, plyo push-ups, tuck jumps

Always provide a low-impact alternative for every plyometric. This is non-negotiable -- sessions must be fully executable without jumping for users with knee, hip, or ankle contraindications.

### Step 4 -- Calculate Session Architecture and Time Budgets

Time management is a core HIIT design skill. Build the session from total available time working inward.

**Time budget formula:**
- Total time = Warm-up + Working block(s) + Inter-block rest + Cooldown
- Minimum warm-up: 3 minutes (5 minutes preferred for beginners and in cold environments)
- Minimum cooldown: 3 minutes (5 minutes preferred)
- Minimum viable HIIT work block: 8 minutes of interval work (one Tabata block or equivalent)
- Maximum recommended HIIT work (bodyweight, intermediate): 20-25 minutes of net interval time
- Maximum recommended HIIT work (advanced, loaded): 18-22 minutes of net interval time due to greater mechanical and metabolic stress

**Working block density by session length:**

| Total Session Time | Warm-Up | Work Block(s) | Inter-Block Rest | Cooldown |
|--------------------|---------|---------------|------------------|----------|
| 15 minutes         | 2 min   | 8 min         | 0 min            | 3-5 min  |
| 20 minutes         | 3 min   | 12-14 min     | 2 min (if 2 blocks) | 3 min |
| 25 minutes         | 4 min   | 16-17 min     | 2-3 min          | 4 min    |
| 30 minutes         | 5 min   | 18-20 min     | 3-4 min          | 5 min    |
| 45 minutes         | 5 min   | 30-32 min     | 5-6 min          | 5 min    |

For sessions with multiple blocks, inter-block rest of 60-90 seconds is the minimum. 90-120 seconds allows greater quality in subsequent blocks and is preferred for maintaining intensity rather than accumulating volume at degraded effort.

### Step 5 -- Design the Warm-Up with Physiological Purpose

A HIIT warm-up is not optional stretching -- it serves three specific physiological functions: (1) elevate core temperature and muscle viscosity, (2) rehearse the movement patterns about to be performed at high intensity, (3) prime the cardiovascular system to avoid the cardiac demand spike of starting HIIT cold.

**Warm-up structure:**
- **Phase 1 -- General elevation (60-90 seconds):** March in place, light jog in place, jumping jacks at 50% effort, or stationary bike at easy pace. Goal: raise heart rate to 50-60% estimated max. Heart rate should be elevated but breathing easy.
- **Phase 2 -- Joint mobilization (60-90 seconds):** Hip circles, shoulder circles, thoracic rotation, ankle circles, wrist circles if upper body work follows. Each joint complex takes 10-15 seconds per direction.
- **Phase 3 -- Dynamic stretching (60-90 seconds):** Leg swings (front-to-back and lateral), walking lunges with torso rotation, inchworms, arm circles to wide chest opener. Each movement travels through full range. Static stretching is contraindicated pre-HIIT -- it reduces force production acutely.
- **Phase 4 -- Movement rehearsal (30-60 seconds):** Perform the first 1-2 exercises of the working block at 30-40% effort. If the first interval includes jump squats, perform 5 slow bodyweight squats followed by 5 partial-effort jump squats. This primes neuromuscular firing patterns and identifies any technique issues before max effort.

### Step 6 -- Define Scaling and Progression Logic

HIIT adaptation is well-documented but requires systematic overload to continue. The primary progression variables in HIIT are: work interval duration, rest interval duration, intensity of effort, exercise complexity, and weekly session frequency/volume.

**4-6 week progression block (standard HIIT periodization):**
- **Weeks 1-2 (Adaptation):** Establish the baseline work:rest ratio at RPE 7-8. Prioritize technique over speed, especially for loaded or complex movements. For beginners: 20s/40s or 30s/60s. For intermediates: 30s/30s. For advanced: 40s/20s.
- **Weeks 3-4 (Development):** Increase either work duration by 5 seconds OR reduce rest by 5 seconds -- never both simultaneously. Alternatively, add one additional round to the circuit. RPE should feel equivalent (7-8) to week 1 despite the increased density.
- **Weeks 5-6 (Intensification):** Progress exercise difficulty (standard push-up to decline push-up, bodyweight squat to goblet squat, jump squat to depth jump). OR increase the number of working blocks from 2 to 3. OR shift from 1:1 to 2:1 ratio.
- **Week 7 (Deload):** Reduce total working volume by 40-50%. Revert to Week 1 work:rest ratios with the current (advanced) exercise selection. Reduce session frequency to 2 per week. This is physiologically necessary -- HIIT creates high central nervous system demand and cumulative fatigue that requires periodic unloading.

**RPE as real-time quality check:**
- RPE 9-10 during work intervals: correct for Tabata, too high for traditional intervals (risk burnout in round 2)
- RPE 7-8 during work intervals: appropriate for traditional intervals and EMOM
- RPE below 6 during work intervals: work is insufficient -- either duration, intensity, or exercise choice needs adjustment
- RPE below 5 during rest intervals: rest is adequate
- RPE above 6 during rest intervals (still feeling strained at the start of next work period): rest is too short -- extend by 10-15 seconds

**Heart rate targets for HIIT (approximate, based on 220 - age = max HR):**
- Work intervals should push HR to 80-95% of max
- Recovery intervals should allow HR to drop to 60-70% of max before the next work interval
- If the user cannot reach 80% during work intervals, intensity is insufficient
- If the user cannot recover below 75% during rest intervals, the rest period is too short or session volume is too high

### Step 7 -- Design the Cooldown with Physiological Rationale

Post-HIIT, the cardiovascular system remains stressed. An abrupt stop can cause blood to pool in active limbs, reducing venous return and potentially causing lightheadedness or syncope. The cooldown actively facilitates physiological recovery.

**Cooldown structure:**
- **Phase 1 -- Active recovery (90-120 seconds):** Walk in place, light stationary cycling, or easy movement that gradually reduces heart rate. Target: bring HR from 80%+ down to below 65% max before beginning static stretching. Attempting static stretches at elevated HR reduces their effectiveness.
- **Phase 2 -- Priority muscle stretching (90-120 seconds):** Focus on the muscles most loaded during the session. Lower body HIIT: hip flexor stretch (kneeling), standing quad stretch, seated hamstring stretch, figure-four glute stretch. Upper body HIIT: doorframe chest stretch, cross-body shoulder stretch, triceps overhead stretch, lat stretch in child's pose. Full body: combine one stretch from each category.
- **Phase 3 -- Breathing and nervous system downregulation (30-60 seconds):** Diaphragmatic breathing -- 4 seconds inhale, hold 2 seconds, 6-8 seconds exhale. This activates the parasympathetic nervous system and accelerates full recovery. Three to five breath cycles is sufficient.

Each static stretch should be held 20-30 seconds per side (not the outdated 10-second standard). Brief discomfort is acceptable; pain is not.

### Step 8 -- Finalize and Document the Session

Compile all decisions into the output format below. Include all coaching cues, scaling options, and the progression schedule. Verify before output:
- Total time adds up to the requested session length
- No two consecutive exercises share a primary mover
- Every plyometric has a named low-impact alternative
- Warm-up includes movement rehearsal for the first 1-2 interval exercises
- Progression schedule is specific, not vague

---

## Output Format

```
## HIIT Workout: [Focus Area] -- [Format Name]

**Level:** [Beginner / Intermediate / Advanced]
**Format:** [Tabata / Traditional Intervals / EMOM / AMRAP / Pyramid]
**Total Duration:** [X minutes]
**Work Block Duration:** [X minutes net interval work]
**Work:Rest Ratio:** [e.g., 30s work / 30s rest (1:1)]
**Equipment:** [Specific equipment list]
**Goal:** [Metabolic conditioning / Cardiovascular fitness / Athletic performance / General health]
**Session RPE Target:** [6-7 / 7-8 / 9-10] during work intervals

---

### Warm-Up ([X] minutes)

| Phase             | Movement                        | Duration     | Coaching Cue                          |
|-------------------|---------------------------------|--------------|---------------------------------------|
| General elevation | [Movement]                      | [X seconds]  | [Cue]                                 |
| Joint mobilization| [Movement]                      | [X seconds]  | [Cue]                                 |
| Dynamic stretch   | [Movement]                      | [X seconds]  | [Cue]                                 |
| Movement rehearsal| [First interval exercise at 40%]| [X seconds]  | [Technique cue]                       |

---

### Working Block [1 of X] ([X minutes])

**Format note:** [Any format-specific instruction, e.g., "Complete 8 rounds of each exercise before moving to the next" for Tabata, or "One full circuit = one round" for traditional]

| Exercise                     | Work   | Rest   | Reps/Target     | Low-Impact Alternative        | Key Coaching Cue                                 |
|------------------------------|--------|--------|-----------------|-------------------------------|--------------------------------------------------|
| [Exercise -- pattern type]   | [Xs]   | [Xs]   | [Max reps / X]  | [Named alternative]           | [Specific form, tempo, or safety cue]            |
| [Exercise -- pattern type]   | [Xs]   | [Xs]   | [Max reps / X]  | [Named alternative]           | [Specific form, tempo, or safety cue]            |
| [Exercise -- pattern type]   | [Xs]   | [Xs]   | [Max reps / X]  | [Named alternative]           | [Specific form, tempo, or safety cue]            |
| [Exercise -- pattern type]   | [Xs]   | [Xs]   | [Max reps / X]  | [Named alternative]           | [Specific form, tempo, or safety cue]            |

**Rounds in this block:** [X]
**Net work time this block:** [X minutes]

[Repeat table for Block 2, Block 3 if applicable]

**Inter-Block Rest:** [X seconds -- include what to do during rest: walk, breathe, hydrate]

---

### Working Block Summary

| Block  | Format             | Exercises | Rounds | Net Work  | Rest Between |
|--------|--------------------|-----------|--------|-----------|--------------|
| 1      | [Format]           | [X]       | [X]    | [X min]   | [Xs]         |
| 2      | [Format]           | [X]       | [X]    | [X min]   | --           |
| Total  | --                 | --        | --     | [X min]   | --           |

---

### Cooldown ([X] minutes)

| Phase                 | Movement                             | Duration     | Coaching Cue                                |
|-----------------------|--------------------------------------|--------------|---------------------------------------------|
| Active recovery       | [Walk in place / light movement]     | 90 seconds   | HR should be falling; breathe through nose  |
| Muscle stretch 1      | [Priority stretch for session focus] | 30s per side | No bouncing; breathe through the stretch    |
| Muscle stretch 2      | [Second priority stretch]            | 30s per side | Feel lengthening, not pain                  |
| Muscle stretch 3      | [Third priority stretch]             | 30 seconds   | Symmetrical position                        |
| Nervous system reset  | Diaphragmatic breathing              | 60 seconds   | 4-count inhale, 2 hold, 6-count exhale      |

---

### Scaling Guide

| Fitness Level | Modification                                                      |
|---------------|-------------------------------------------------------------------|
| Easier        | [Specific change: reduce work, increase rest, remove impact]      |
| As Written    | Target version for stated fitness level                           |
| Harder        | [Specific change: add load, increase work, add plyometric]        |

---

### Progression Schedule (6-week block)

| Week  | Work:Rest     | Exercise Variation          | Blocks | Sessions/Week | Intensity Note            |
|-------|---------------|-----------------------------|--------|---------------|---------------------------|
| 1-2   | [ratio]       | [baseline version]          | [X]    | 2-3           | RPE [X] -- build quality  |
| 3-4   | [ratio]       | [same or add 5s work]       | [X]    | 2-3           | RPE [X] -- push density   |
| 5-6   | [ratio]       | [next exercise difficulty]  | [X]    | 2-3           | RPE [X] -- intensify      |
| 7     | [deload ratio]| [current exercises]         | [X-1]  | 2             | RPE 6 -- active recovery  |

---

### Performance Tracking

After each session, record:
- Rounds/reps completed (for AMRAP format) or adherence to intervals (for timed formats)
- Average perceived effort during work intervals (RPE 1-10)
- Heart rate at end of first work interval, end of last work interval (if tracking)
- Any exercises modified or skipped -- and why
- Recovery quality: HR return to <65% max by end of rest intervals? (Yes/No)
```

---

## Rules

1. **Always present the disclaimer before providing any guidance.** HIIT places significant cardiovascular and musculoskeletal demand on the body. This rule is non-negotiable regardless of how experienced the user appears.

2. **Never program HIIT on consecutive days.** Minimum 48 hours between sessions for intermediate and advanced users. For beginners, 72 hours is preferred. High-intensity sessions elevate cortisol, inflammatory markers, and muscle damage -- insufficient recovery converts a performance stimulus into an injury and overtraining risk.

3. **Maximum HIIT frequency is 3 sessions per week for intermediate-to-advanced users and 2 sessions per week for beginners.** Research consistently shows diminishing returns and elevated injury risk above this frequency. If the user reports training HIIT 5+ days per week, flag this explicitly and recommend redistribution.

4. **Minimum warm-up is 3 minutes; 5 minutes is standard; never skip the movement rehearsal phase.** Starting explosive or loaded intervals cold increases acute injury risk and reduces output quality in the first work block.

5. **Beginner work:rest ratio must be at least 1:2 (work never exceeds half of rest duration).** The phosphocreatine system requires approximately 3 minutes for full resynthesis and 30-60 seconds for meaningful partial recovery. A 1:2 ratio allows partial PCr recovery, prevents excessive lactate accumulation, and allows technique to be maintained across all rounds.

6. **Never program two consecutive exercises using the same primary mover.** A sequence of jump squats followed by reverse lunges stacks 60-90 seconds of uninterrupted quad-dominant work, causing localized failure that compromises both form and intensity. Always alternate between the six movement pattern categories.

7. **Never include exercises requiring high technical proficiency under metabolic fatigue in HIIT circuits.** This explicitly excludes: Olympic lifts (power clean, snatch, clean and jerk), heavy barbell back squats, barbell deadlifts at moderate-to-heavy loads, and kettlebell Turkish get-ups. These movements require full neuromuscular control that degrades under HIIT fatigue, creating acute injury risk. Light-to-moderate dumbbell and kettlebell exercises (swings, goblet squats, push press) are acceptable.

8. **Provide a named low-impact alternative for every plyometric exercise.** Do not use vague language like "a lower-impact version." Name it: "Replace jump squat with slow-tempo squat (3 seconds down, 1 second hold, 2 seconds up)" or "Replace lunge jump with step-back lunge holding dumbbells."

9. **AMRAP sessions must include a recorded baseline metric.** The training value of AMRAP depends on having a score to beat. Always instruct the user to record rounds + reps completed in the first session. Without this, there is no progress signal.

10. **EMOM rep targets must be achievable in 35-45 seconds, leaving 15-25 seconds of rest.** If the user reports completing prescribed reps in less than 30 seconds, the load is too light or reps too few. If they consistently cannot finish before the next minute begins, the reps are too many or load too heavy. Both scenarios require adjustment.

11. **Cap total net interval work at 25 minutes for bodyweight intermediate sessions and 20 minutes for loaded sessions.** HIIT is a high-density, high-quality training modality. More is not better -- beyond these thresholds, effort quality degrades, technique breaks down, and the cardiovascular stimulus is no better than sub-maximal steady-state work performed with greater fatigue accumulation.

12. **Every workout must include a cooldown that brings heart rate to approximately 65% of estimated max HR before the user leaves the session.** Post-HIIT cardiovascular regulation requires active recovery. Stopping abruptly after a 90% HR effort increases the risk of vasovagal syncope, particularly in beginners.

---

## Edge Cases

### 1. Complete Beginner With No Prior Exercise History
Do not design a HIIT session. Instead, prescribe a 2-week on-ramp:
- Week 1-2: Walk-based intervals -- 30 seconds brisk walk / 30 seconds comfortable pace, 10-12 rounds, 3 days per week. Goal: establish cardiovascular comfort with elevated heart rate, not produce HIIT adaptations.
- Introduce bodyweight movements in Week 3 using 20s work / 40s rest with four exercises: bodyweight squat, modified push-up (from knees), glute bridge, and march in place. Zero plyometrics.
- Do not introduce standard HIIT formats until the user can complete 3 rounds of those four exercises with controlled form and HR recovery between intervals. Typically 3-4 weeks minimum.
- Clearly communicate that this is an on-ramp, not a HIIT program, and redirect back to the main skill once the base is established.

### 2. User Has Joint Issues (Knee, Hip, or Ankle Pain)
- Eliminate all plyometric and impact exercises entirely. Do not offer them as options even with the caveat "only if pain-free."
- Replace bilateral jumping patterns with tempo bodyweight movements. Jump squat becomes slow-tempo goblet squat (3 seconds down, 2 second pause, 2 seconds up). Lunge jump becomes weighted reverse lunge with 2-second lowering phase.
- Avoid deep knee flexion past 90 degrees for knee issues (skip full-depth split squats, deep goblet squats)
- For lower back issues: avoid hip hinge movements until cleared. Replace kettlebell swings with glute bridges or cable pull-throughs if available.
- Recommend the user clarify the injury status with a physical therapist or sports medicine physician before loading the affected joint under HIIT fatigue.

### 3. Only 10-15 Minutes Total Available
- This is the minimum viable HIIT session. The format must be Tabata (one block, 4 minutes net) or a condensed traditional interval circuit.
- Time budget: 2 minutes movement prep warm-up, 8-10 minutes work, 2-3 minutes cooldown.
- One Tabata block: choose one or two exercises (e.g., burpees and jump squats alternated), 8 rounds of 20s/10s = 4 minutes per exercise. Two exercises = 8 minutes of work.
- For traditional intervals with 10 minutes available: 4 exercises, 30s work/20s rest, 2 rounds = approximately 8.5 minutes.
- Flag for the user: a 10-15 minute session can maintain current fitness but is insufficient for significant improvement. Suggest longer sessions 2-3 times per week when possible.

### 4. User Wants to Combine HIIT With Strength Training on the Same Day
- Order is physiologically critical: always program strength training first, HIIT second. Performing HIIT first depletes phosphocreatine, elevates blood lactate, and compromises neuromuscular recruitment for subsequent strength work -- reducing strength training effectiveness and increasing injury risk under fatigue.
- Reduce HIIT to a single working block of 8-12 minutes maximum when paired with strength training in the same session.
- Preferred alternative: separate sessions by at least 6 hours (e.g., strength at 7 AM, HIIT at 5 PM). This allows partial creatine and glycogen replenishment.
- If the user's goal is predominantly strength, keep HIIT to 1 session per week as a conditioning supplement -- not a co-equal training modality.

### 5. Advanced User Who Has Plateau on Standard Intervals
When RPE during standard 1:1 intervals has dropped below 6 and the user reports the sessions feel easy, the plateau has been reached. Standard progression options are exhausted. Apply one of these advanced strategies:
- **Density blocks:** Complete as many rounds as possible of the circuit in a fixed time window (e.g., 10 minutes), record score, attempt to improve score weekly with the same exercises.
- **Complex training integration:** Pair a heavy strength movement (e.g., 5 dumbbell Romanian deadlifts) immediately with a plyometric (e.g., 5 broad jumps). The heavy-to-explosive pairing creates post-activation potentiation (PAP) -- the strength movement primes the nervous system for greater plyometric output.
- **Contrast interval ratios:** Use 10s maximal-effort work / 50s active recovery (not passive rest -- light jogging or cycling). This mimics the energy profile of many team sports and is substantially more demanding than 1:1 ratios despite appearing shorter in work duration.
- **Add an external load progression:** If bodyweight has been the primary resistance, introduce 10-15% of bodyweight in a vest or light dumbbells for movements previously unloaded.

### 6. User Asks About HIIT for Sport-Specific Conditioning
Different sports have different energy system profiles that should shape interval design:
- **Soccer / field sports:** Repeated sprint ability (RSA) is critical. Use 5-6 second maximal sprint intervals with 25-30 second active recovery (roughly 1:5 ratio) for 5-8 sets, progressing to 1:4 and 1:3 over the training block. On a treadmill or field, not a fixed rower.
- **Combat sports (boxing, BJJ, wrestling):** 3-5 minute work intervals at high intensity (matching round length) with 60-90 seconds rest. Circuit should include ground-based movements (sprawls, shot and return, hip escapes) alongside cardio output.
- **Cycling or rowing sports:** True sport-specific HIIT is best done on the relevant ergometer. Tabata on a rowing machine or assault bike closely mirrors sport demand. Work toward 30s max effort / 30s active recovery on the bike for track cycling preparation.
- For all sport contexts, HIIT volume should taper in the 2 weeks before competition. Reduce sessions from 3 to 1 per week and cut work volume by 50% -- maintain intensity, not volume.

### 7. User Has Not Eaten and Is Training Fasted
Fasted HIIT is a common request, particularly from users interested in fat oxidation. Evidence on fasted HIIT is mixed, but the practical concerns are real:
- At true HIIT intensity (80-95% max HR), the body relies primarily on glycolytic (carbohydrate-dependent) pathways, not fat oxidation. The advantage of fasting is primarily reduced during high-intensity work.
- Risk of hypoglycemia-related dizziness or nausea is elevated fasted, especially in beginners or those with metabolic conditions.
- If the user insists on fasted HIIT: shorten session to maximum 20 minutes total, reduce intensity targets by one level (beginner sessions for an intermediate user), and instruct them to stop immediately if lightheadedness, nausea, or confusion occurs.
- Do not design advanced fasted HIIT sessions (complex loaded circuits, long Tabata blocks) without first noting these considerations.

---

## Example

**Input:** "I've been working out consistently for about 18 months -- mostly lifting. I want a 25-minute full-body HIIT session I can do at home with one kettlebell (24 kg). I want to improve my conditioning without it messing up my strength gains."

---

**Output:**

## HIIT Workout: Full-Body Kettlebell Conditioning

**Level:** Intermediate
**Format:** Traditional Intervals with EMOM Finish
**Total Duration:** 25 minutes
**Work Block Duration:** 17 minutes net interval work
**Work:Rest Ratio:** Block 1 -- 40s work / 20s rest (2:1) | Block 2 (EMOM) -- rep-based
**Equipment:** 24 kg kettlebell
**Goal:** Cardiovascular conditioning with minimal interference to strength training
**Session RPE Target:** 7-8 during work intervals in Block 1; 7-8 per minute in Block 2
**Training frequency note:** Program this session on non-strength-training days or after strength work with at least 6 hours separation. Maximum 2 sessions per week given concurrent strength training.

---

### Warm-Up (4 minutes)

| Phase              | Movement                               | Duration   | Coaching Cue                                                    |
|--------------------|----------------------------------------|------------|-----------------------------------------------------------------|
| General elevation  | March in place, progressing to jog     | 60 seconds | Drive arms, land softly; HR rising but breathing fully through nose |
| Joint mobilization | Hip circles, shoulder circles, ankle circles | 60 seconds | 10 slow rotations each direction per joint                      |
| Dynamic stretch    | Walking lunge with thoracic rotation   | 45 seconds | Front knee tracks over toes; rotate torso to front-leg side     |
| Dynamic stretch    | Inchworm to downward dog               | 45 seconds | Full hip extension at top; heels press toward floor in dog      |
| Movement rehearsal | 8 slow-tempo kettlebell deadlifts      | 30 seconds | Hinge at hips -- not squat; bell passes between mid-shin height |

---

### Working Block 1 -- Traditional Intervals (12 minutes)

**Format note:** Complete all 5 exercises in sequence. This constitutes one round. Rest as prescribed between each exercise. Complete 3 full rounds. Rest 90 seconds between rounds (walk, hydrate, breathe).

| Exercise                           | Work | Rest | Movement Pattern        | Low-Impact Alternative                    | Key Coaching Cue                                                     |
|------------------------------------|------|------|-------------------------|-------------------------------------------|----------------------------------------------------------------------|
| Kettlebell Swing (two-hand)        | 40s  | 20s  | Hip hinge / posterior   | Same movement, lighter sub from single DB | Hinge aggressively -- bell driven by hip snap, not arm pull; horizontal bell path at top |
| Push-Up (feet elevated on chair)   | 40s  | 20s  | Upper body push         | Standard push-up from floor               | Straight line head to heel; full chest-to-floor ROM; no hip sag      |
| Goblet Squat (kettlebell)          | 40s  | 20s  | Lower body push / quad  | Bodyweight squat with slow 3s descent     | Bell at chest height; elbows inside knees at bottom; full hip crease below parallel |
| Renegade Row to Push-Up (KB on floor, alternate rows) | 40s | 20s | Upper body pull / anti-rotation | Single-arm dumbbell row from bench | Plank rigid throughout -- no hip rotation during row; elbow drives straight back |
| Mountain Climber                   | 40s  | 20s  | Core anti-extension / cardio | Slow alternating knee tucks in plank   | Hips level with shoulders -- not piked; drive knee to same-side elbow; quick but controlled |

**Rounds in Block 1:** 3
**Per-round time:** 5 exercises x 60s (40s + 20s) = 5 minutes
**Inter-round rest:** 90 seconds x 2 transitions = 3 minutes
**Block 1 net work time:** 10 minutes (5 min/round x 2 net rounds after accounting for rest = total block 13 minutes including rest)

---

### Working Block 2 -- EMOM Finisher (5 minutes)

**Format note:** At the top of every minute, complete the prescribed reps. Rest for whatever time remains in that minute before the next minute begins. Five minutes = 5 rounds. This block is designed to be completed in the final metabolic push -- RPE will be 8 by round 3.

| Minute | Exercise                      | Reps  | Target Completion Time | Low-Impact Alternative              | Coaching Cue                                          |
|--------|-------------------------------|-------|------------------------|-------------------------------------|-------------------------------------------------------|
| Odd    | Kettlebell Clean-to-Press     | 6/side| 35-40 seconds          | Dumbbell single-arm push press      | Clean finishes at rack position; press from shoulder height; re-clean each rep |
| Even   | Goblet Squat Jump             | 8     | 30-35 seconds          | Slow-tempo goblet squat (no jump)   | Hold bell at chest; sit back into squat; explosive jump on ascent; land through ball-heel; immediate re-squat |

**If the user cannot complete reps before the next minute, reduce odd minutes to 4 reps/side and even minutes to 6 reps. If they finish with more than 25 seconds to spare, add 2 reps to each.**

**Block 2 duration:** 5 minutes
**Total net work time this session:** 12 min (Block 1) + 5 min (Block 2) = 17 minutes
**Total session time:** 4 min warm-up + 13 min Block 1 (with inter-round rest) + 3 min transition + 5 min Block 2 + 4 min cooldown = 25 minutes ✓

---

### Working Block Summary

| Block | Format              | Exercises | Rounds/Minutes | Net Work   | Rest Between Rounds |
|-------|---------------------|-----------|----------------|------------|---------------------|
| 1     | Traditional 2:1     | 5         | 3 rounds       | 10 min     | 90 seconds          |
| 2     | EMOM                | 2         | 5 minutes      | ~4.5 min   | Per-minute residual |
| Total | --                  | 6 unique  | --             | ~14.5 min  | --                  |

---

### Cooldown (4 minutes)

| Phase                 | Movement                                        | Duration     | Coaching Cue                                                     |
|-----------------------|-------------------------------------------------|--------------|------------------------------------------------------------------|
| Active recovery       | Walk in place with arm swings                   | 90 seconds   | HR should drop from ~85% to below 70% during this phase         |
| Muscle stretch 1      | Kneeling hip flexor stretch (with torso extension) | 30s/side  | Drive hip forward, not just drop -- feel the front hip capsule stretch |
| Muscle stretch 2      | Standing single-leg hamstring stretch (foot on chair) | 30s/side | Hinge at hip with flat back -- not rounded; feel pull in proximal hamstring |
| Muscle stretch 3      | Cross-body shoulder stretch                     | 20s/side     | Keep elbow below shoulder height; rotate away slightly           |
| Muscle stretch 4      | Child's pose (lat and thoracic focus)           | 30 seconds   | Walk hands to each side to bias each lat separately              |
| Nervous system reset  | Diaphragmatic breathing, supine                 | 60 seconds   | 4-count inhale into belly, 2-count hold, 6-count exhale; 4-5 cycles |

---

### Scaling Guide

| Version | Modification                                                                                          |
|---------|-------------------------------------------------------------------------------------------------------|
| Easier  | Reduce to 1:1 ratio (30s work / 30s rest), drop Block 2 to 3 minutes, use 16 kg kettlebell           |
| As Written | 2:1 ratio, 24 kg, full Block 1 (3 rounds) + Block 2 (5 EMOM minutes)                             |
| Harder  | Increase to 45s/15s in Block 1, use single-arm swings in odd rounds, add a 6th EMOM minute           |

---

### Progression Schedule (6-Week Block)

| Week  | Block 1 Ratio | Block 2 Format   | Blocks | Sessions/Week | Intensity Note                              |
|-------|---------------|------------------|--------|---------------|---------------------------------------------|
| 1-2   | 40s / 20s     | 5-min EMOM       | 2      | 2             | RPE 7-8 -- establish movement quality       |
| 3-4   | 40s / 20s     | 7-min EMOM (+2 rounds) | 2 | 2             | RPE 7-8 -- increase EMOM volume             |
| 5-6   | 45s / 15s     | 7-min EMOM, +2 reps/exercise | 2 | 2      | RPE 8-9 -- high density phase               |
| 7     | 30s / 30s     | 5-min EMOM at 5 reps | 1  | 1-2           | RPE 6 -- deload week, maintain movement skill |

---

### Performance Tracking Log (Complete After Every Session)

| Field                                | Entry |
|--------------------------------------|-------|
| Date                                 |       |
| Session RPE -- average during Block 1|       |
| Session RPE -- average during Block 2|       |
| Block 2 EMOM -- reps per minute completed on schedule? | Y / N |
| HR at end of last Block 1 work interval (if tracking) | bpm  |
| HR at start of Block 2 (if tracking) | bpm  |
| Exercises modified -- which and why  |       |
| Notes (sleep, nutrition, energy level)|      |

---

**Conditioning interference note:** This session is designed to minimize interference with strength gains. Mechanisms: (1) session duration is capped at 25 minutes total, reducing total cortisol elevation; (2) the EMOM format preserves movement quality by enforcing rest; (3) scheduling on non-strength days or 6+ hours post-strength avoids acute glycogen and neuromuscular competition. If strength numbers decline after adding this session, reduce HIIT frequency to once per week and reassess after 3 weeks.
