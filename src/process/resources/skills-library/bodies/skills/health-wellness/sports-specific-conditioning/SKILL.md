---
name: sports-specific-conditioning
description: |
  Designs conditioning programs tailored to the physical demands of common recreational sports including tennis, basketball, soccer, and swimming. Analyzes energy system requirements, movement patterns, and sport-specific fitness qualities to produce a structured off-court or off-field conditioning plan.
  Use when the user asks about getting in shape for a specific sport, sport-specific conditioning, improving athletic performance for recreational sports, or pre-season training for a sport.
  Do NOT use for professional or elite-level athletic programming, injury rehabilitation, general strength training (use beginner-strength-training), or running-specific plans (use running-training-plan).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "fitness workout-planning planning"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Sports-Specific Conditioning

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before starting a new fitness program, particularly if you have existing health conditions, previous injuries, or have been sedentary for an extended period. If you experience pain, dizziness, or shortness of breath during exercise, stop immediately and seek medical attention.

---

## When to Use

**Use this skill when:**
- A user wants to improve sport-specific performance for a recreational sport they already play or are about to start -- e.g., "I want to get in better shape for my Thursday night basketball league" or "tennis season starts in 8 weeks and I'm not ready"
- A user asks how to train the physical qualities that underpin a sport (lateral speed for tennis, aerobic engine for soccer, vertical leap for basketball, shoulder endurance for swimming) separate from practicing the sport itself
- A user wants a structured off-court or off-field program to complement their existing sport practice -- they are already playing the sport but want to systematically build the conditioning that supports it
- A user is entering a pre-season window (4-12 weeks before a recreational season, league, or tournament) and needs a phased plan with a clear timeline
- A user plays recreationally but notices a physical limitation holding them back -- e.g., "I gas out in the third set," "my legs give out in the second half," "my shoulders burn after 30 minutes of swimming"
- A user wants to understand sport-specific energy system training -- interval durations, work-to-rest ratios, or aerobic vs. anaerobic emphasis for their sport
- A user asks about injury prevention specific to the stresses of their sport (rotator cuff work for swimmers, knee stability for basketball players, hip mobility for soccer players)

**Do NOT use when:**
- The user is a professional, semi-professional, or elite amateur athlete -- those populations require individualized testing, athlete monitoring software, and periodized macro-cycles beyond this skill's scope
- The user is recovering from a sport-related injury and wants a return-to-play program -- direct them to a sports medicine physician or physical therapist; this skill does not provide rehabilitation protocols
- The user wants general strength training without a sport as the organizing goal -- use the `beginner-strength-training` skill instead, which covers foundational movement patterns and progressive overload without sport context
- The user wants a running or endurance event training plan (5K, 10K, half marathon) where the goal is the race itself, not a field sport -- use the `running-training-plan` skill
- The user reports a recurring pain pattern specific to sport activity (persistent knee pain during lateral cuts, shoulder impingement during swimming) -- address the injury concern first, recommend professional assessment, then return to conditioning design
- The user is under 16 years old and playing youth sports -- youth athlete programming has separate growth plate and load management considerations outside this skill's scope
- The user wants nutrition planning specifically for sport performance -- use a dedicated `sports-nutrition` skill or dietary planning skill instead

---

## Process

### Step 1: Gather the Essential Intake Information

Before designing anything, collect this information -- either from the user's initial message or by asking targeted follow-up questions. Do not guess at missing details; the program design depends on them.

- **Which sport?** Identify the primary sport. If they play multiple, identify the most important or upcoming one.
- **Current play frequency:** How many times per week do they currently practice or play? Are games and practice already on the calendar?
- **Competitive context:** Recreational (casual, once-a-week), social league (scheduled season, standings), or competitive amateur (tournaments, seeded league, club team)?
- **Fitness baseline:** General activity level -- sedentary, lightly active, moderately active, or well-trained. Ask if they have any strength training or cardio history.
- **Timeline:** Is there a season start date, tournament, or deadline? Or is this general ongoing conditioning?
- **Available training days:** How many days per week can they dedicate to conditioning beyond sport practice? (Typical answers: 2, 3, or 4 days.)
- **Available equipment and facilities:** Gym with machines and free weights, home with minimal equipment, outdoor field or track, pool access?
- **Injury history or current limitations:** Any joints, muscles, or movements they need to protect or avoid?
- **Age:** Especially relevant if over 40 -- recovery capacity, plyometric volume, and warm-up duration must be adjusted.

If the user provides a rich initial request, you may be able to infer most of this. When critical information is missing (especially sport, timeline, and available days), ask before proceeding.

---

### Step 2: Map the Sport's Physical Demand Profile

Every sport makes specific physiological and biomechanical demands. Use the detailed reference profiles below to build the foundation of the conditioning plan. Apply the matching profile and note where the user's competitive context (recreational vs. competitive amateur) may shift priorities.

**Tennis (recreational to competitive amateur)**
- **Primary energy system:** Mixed -- individual points rely on the ATP-PC (phosphagen) system for explosive 4-10 second bursts; point frequency creates repeated anaerobic demand; match duration (1-3 hours) requires a strong aerobic base for recovery between points. Work-to-rest ratio during active play: approximately 1:3 to 1:5 (point: rest between points).
- **Critical physical qualities:** Lateral agility and change of direction (COD), rotational power through the kinetic chain (hips through trunk to shoulder), repeated sprint ability, single-leg stability during loading and landing, shoulder girdle endurance.
- **Key movement patterns:** Side-shuffle (split-step to ball), crossover run, rotational loading and unloading (forehand/backhand), overhead reach (serve), rapid deceleration and re-acceleration.
- **High-risk injury areas:** Rotator cuff (serve volume), medial epicondyle (tennis elbow, especially backhand mechanics), knee (lateral loading), ankle (lateral sprain from court direction changes), lower back (rotational stress).
- **Conditioning emphasis:** Lateral SAQ (speed, agility, quickness), aerobic base (sustains 3-set match), anaerobic intervals of 8-15 seconds with 25-45 seconds rest.

**Basketball (recreational to competitive amateur)**
- **Primary energy system:** Predominantly anaerobic-alactic and anaerobic-lactic, with aerobic system supporting recovery. Average sprint: 2-4 seconds; sprints occur every 30-60 seconds throughout a game. Game duration: 32-48 minutes of active clock time, total floor time 60-90 minutes.
- **Critical physical qualities:** Vertical jump power (both countermovement and reactive), lateral defensive shuffle, acceleration over 5-15 meters, deceleration and change of direction, repeated sprint ability over 40-90 minutes, upper body strength for contact.
- **Key movement patterns:** Vertical jump and land (rebound, contest shot), lateral defensive slide, V-cut and backdoor cut (direction reversal), sprint-decelerate-sprint sequences, overhead reach.
- **High-risk injury areas:** Anterior cruciate ligament and patellofemoral joint (jump landing mechanics and pivoting), ankle (inversion sprains from court play), Achilles tendon (explosive push-off load), lower back (contact and awkward landing).
- **Conditioning emphasis:** Jump training (plyometrics), lateral defensive speed, anaerobic conditioning intervals of 15-30 seconds with 60-90 seconds rest, aerobic base for game-length endurance.

**Soccer (recreational to competitive amateur)**
- **Primary energy system:** Predominantly aerobic -- a recreational player covers 6-9 km per 90-minute game; competitive amateur up to 10-12 km. However, within that volume, there are 40-60 sprint efforts of 10-40 meters, each lasting 2-4 seconds. Work rate: aerobic base for sustained running, anaerobic capacity for sprint bouts. Work-to-rest: highly variable, but sprint-to-jog ratio is approximately 1:7 during active play.
- **Critical physical qualities:** Aerobic capacity (VO2max), lactate threshold (allows sustained high-intensity running), repeated sprint ability (RSA), linear acceleration and deceleration, lower body power for shooting and heading jumps, first-step quickness.
- **Key movement patterns:** Linear acceleration (0-30m), backward running and defensive transitions, side-shuffle tracking, jump and head (vertical), kicking mechanics load (hip flexor, adductor, hamstring).
- **High-risk injury areas:** Hamstring (explosive acceleration and kicking), groin/adductor (lateral cutting and change of direction), ankle, knee (ACL risk during pivot and deceleration), hip flexor.
- **Conditioning emphasis:** Aerobic base building (80% of conditioning), speed endurance intervals of 20-40 seconds at high intensity, hamstring and adductor injury prevention, linear and multidirectional speed.

**Swimming (recreational to competitive amateur)**
- **Primary energy system:** Primarily aerobic for distances over 200 meters; mixed aerobic-anaerobic for 100-200 meter events; alactic-anaerobic for 50-meter sprints. Most recreational swimmers train in the 200-1500 meter range, which is predominantly aerobic.
- **Critical physical qualities:** Aerobic capacity, shoulder rotator cuff endurance, core anti-rotation stiffness (maintains body position in the water), hip flexor and ankle flexibility (kick mechanics), lat and posterior shoulder strength (pull phase), breathing rhythm management.
- **Key movement patterns:** Overhead pulling (freestyle, butterfly), rotational breathing, flip turn explosive push-off, kick from the hip (not the knee).
- **High-risk injury areas:** Rotator cuff (supraspinatus impingement, especially with fatigue and high volume), biceps tendon, swimmer's knee (breaststroke kick), lower back (butterfly, freestyle rotation imbalance), neck (bilateral breathing imbalance).
- **Conditioning emphasis:** Dry-land pulling and rotator cuff strength, core stability, aerobic base (complementary aerobic cross-training), shoulder mobility and scapular control, hip flexor flexibility.

**Recreational Volleyball**
- **Primary energy system:** Anaerobic-alactic dominant -- points last 3-12 seconds; rallies require explosive jumps, rapid lateral movements, and rotational striking. Aerobic recovery between rallies. Match duration: 45-90 minutes.
- **Critical physical qualities:** Vertical jump (blocking, attacking), rotational arm power (spiking), lateral quickness (defensive shuffles), reactive agility (ball tracking), shoulder durability.
- **High-risk injury areas:** Ankle (landing from jump, particularly block), rotator cuff (overhead striking and serving), finger and wrist (blocking), knee (patellar tendon from repeated jumping -- "jumper's knee").
- **Conditioning emphasis:** Jump training and landing mechanics, rotational power, prehabilitation for patellar tendon and rotator cuff.

**Recreational Cycling**
- **Primary energy system:** Predominantly aerobic for rides over 20 minutes. Anaerobic capacity matters for surges, climbs, and sprint finishes. Ride duration: highly variable (30 min to 5+ hours).
- **Critical physical qualities:** Aerobic capacity, lactate threshold power, sustained leg power output, core stability for power transfer, hip flexor and hamstring flexibility, saddle-time tolerance.
- **High-risk injury areas:** Knee (patellofemoral syndrome from fit issues and overuse), lower back and neck (aggressive road position), hip flexor tightness, iliotibial band syndrome (lateral knee).
- **Conditioning emphasis:** Aerobic intervals for threshold development, hip flexor mobility, core endurance, leg strength (especially single-leg power balance).

---

### Step 3: Assess the User's Current Fitness Baseline and Classify Their Needs

Map the user into one of three conditioning tiers. This determines starting intensity, volume, and how quickly to introduce sport-specific intervals.

**Tier 1 -- Foundation Builder (Deconditioned to Lightly Active)**
- Can sustain 20-25 minutes of continuous low-intensity cardio (walking, light jog) but struggles with more
- No structured strength training history or more than 12 months since last consistent training
- Likely returning to a sport after a layoff, or picking up a sport for the first time
- **Programming approach:** 4-6 weeks of general conditioning (aerobic base + foundational movement quality) before introducing sport-specific intervals and agility work. No high-intensity intervals in the first 3 weeks.

**Tier 2 -- Active but Sport-Naive (Moderately Active)**
- Consistent in some form of exercise (gym, running, cycling) but without sport-specific conditioning
- Can complete 30+ minutes of Zone 2 cardio comfortably; may have some strength training background
- Wants to channel existing fitness into sport-specific performance
- **Programming approach:** Can begin sport-specific intervals and agility work in week 1-2. Primary adjustment is matching their existing fitness to sport demands rather than building from scratch.

**Tier 3 -- Sport-Active but Seeking Structured Off-Field Training**
- Already plays the sport regularly and has general fitness, but has never done structured conditioning separate from playing
- Usually limited by a specific quality: aerobic capacity runs out late in the match, lateral speed, or first-step quickness
- **Programming approach:** Identify the limiting physical quality first. Design a program that addresses the specific gap while maintaining overall sport fitness. Higher intensity from week 1 is appropriate.

---

### Step 4: Select and Apply the Appropriate Training Phase

Determine which phase the user is in based on their timeline, then set volume and intensity accordingly.

**Phase 1 -- General Physical Preparation (GPP) | Off-Season | 8-12+ Weeks Out**
- Build the aerobic base using Zone 2 cardio (60-70% of maximum heart rate -- MHR; conversational pace; can speak 3-4 word sentences comfortably). Target: 120-150 bpm for most adults.
- Develop general strength with compound movements (squat pattern, hinge pattern, push, pull, core stability). Rep ranges: 3x10-12, moderate loads.
- Introduce movement quality work -- single-leg stability, mobility drills for sport-specific tight areas -- but keep sport-specific agility minimal.
- Weekly conditioning volume: 3-4 sessions, 30-50 minutes each.
- Intensity: 60-75% of maximum effort across all sessions; zero high-intensity work in weeks 1-3 for Tier 1 users.

**Phase 2 -- Sport-Specific Preparation (SSP) | Pre-Season | 4-8 Weeks Out**
- Transition from general aerobic base to sport-specific conditioning intervals. Match interval work:rest ratios to the actual game demands of the sport (see sport profiles above).
- Shift strength emphasis from general hypertrophy/strength to power -- reduce reps to 4-6, increase speed of movement (medicine ball throws, jumps, explosive squats).
- Introduce sport-specific agility drills: lateral shuffles, T-drills, L-drills, 5-10-5 pro agility -- calibrated to the sport.
- Weekly conditioning volume: 3-4 sessions, 35-50 minutes each. Reduce GPP aerobic work by 30%, replace with intervals.
- Intensity: 75-90% of maximum effort on interval and agility days. Maintain one moderate aerobic session per week.

**Phase 3 -- In-Season Maintenance | Season Underway**
- Reduce off-field conditioning volume to 1-2 sessions per week. The sport itself is the primary training stimulus.
- Maintain strength with abbreviated 2x5 strength sessions -- enough to prevent detraining (2 sessions/week of 20-30 minutes is sufficient to maintain strength gains).
- No new physical qualities introduced in-season. Only maintenance of what was built.
- Prioritize recovery between games: sleep, active mobility work, light aerobic flushing (20-minute easy walk or bike the day after a hard game).
- Never schedule a hard conditioning session within 24 hours before a game.

**If no clear season (general conditioning):**
- Run 6-week blocks of GPP followed by 4-week blocks of SSP, then reassess.

---

### Step 5: Design the Weekly Schedule Structure

Assign sessions to days using these principles:

- **Hard-easy-hard pattern:** Never place two high-intensity conditioning sessions back to back. Minimum 48 hours between hard days.
- **Conditioning before sport practice, never the same day:** When conditioning and practice fall in the same week, place the hardest conditioning session at least 2 days before the next game or intense practice.
- **Session types by day purpose:**
  - Aerobic base day: 30-50 minutes Zone 2. Low CNS demand. Can follow or precede sport practice with a 24-hour buffer.
  - Strength + movement quality day: 40-55 minutes. Moderate CNS demand.
  - Sport-specific interval day: 30-45 minutes. High CNS and metabolic demand. Requires 48 hours before next hard effort.
  - Mobility and recovery day: 15-20 minutes. Can be done on any day, including after sport practice.

- **Minimum effective dose:** 2 conditioning sessions per week beyond sport practice. This is the floor for maintaining and building sport-specific fitness. Three sessions is the optimal target for most recreational athletes. Four sessions is appropriate for competitive amateurs in pre-season.

---

### Step 6: Build the Conditioning Sessions with Sport-Specific Content

Design each session with the following architecture:

**Warm-Up Protocol (all sessions, 8-12 minutes)**
- 3-5 minutes: low-intensity general activity (light jog, row, cycle) to elevate core temperature
- 3-5 minutes: dynamic mobility specific to the sport (hip circles, leg swings, thoracic rotations, shoulder circles -- sport dependent)
- 2 minutes: movement activation (lateral shuffles, high knees, A-skips, hip hinges -- sport dependent)
- Do NOT skip the warm-up. Skipping it is the single most common conditioning error and significantly raises injury risk in sport-specific work.

**Aerobic Base Sessions:**
- Modality: Running preferred for field/court sports (replicates muscular demand); cycling or elliptical acceptable for low-impact alternatives or swimming (pair with dry-land work).
- Intensity prescription: Zone 2 = 60-70% MHR. Estimate MHR as 220 minus age. For a 35-year-old: MHR ≈ 185, Zone 2 target = 111-130 bpm. Alternatively, use the "talk test" -- able to hold a conversation comfortably.
- Duration progression: Start at 20-25 minutes continuous in week 1 for Tier 1; 30-35 minutes for Tier 2-3. Add 5 minutes per week until reaching 40-50 minutes.
- Do NOT use Zone 2 aerobic sessions for sport-specific intervals -- they serve different physiological purposes and mixing them into "moderate intensity" produces neither adaptation.

**Anaerobic Interval Sessions:**
- Prescribe work-to-rest ratios that match the sport's actual demand:
  - Tennis: 10-12 second work / 30-40 second rest, 12-20 rounds. Represents point duration and inter-point rest.
  - Basketball: 15-25 second work / 60-90 second rest, 10-15 rounds. Represents possession/defensive sequence.
  - Soccer: 20-40 second work / 90-120 second rest for longer sprint-endurance intervals; 6-8 second work / 40-60 second rest for sprint-specific work.
  - Swimming (short course sprints): 25-50 meter efforts at 85-95% effort / 90-second rest, 8-12 rounds.
  - Volleyball: 5-8 second explosive burst (jump, sprint, dive) / 20-30 second rest, 15-20 rounds.
- Exercise choices: sport-matched. Shuttle runs and lateral movements for court sports; straight-line sprints and agility runs for soccer; bike sprints acceptable as a lower-impact substitute for all field sports.

**Strength Training Sessions:**
- Focus on the 3-4 movement patterns most relevant to the sport, not a full-body gym routine.
- Rep ranges: GPP phase = 3x10-12; SSP phase = 3-4x5-6 (heavier) with 1-2 sets of explosive movements.
- Key strength exercises by sport:
  - Tennis: goblet squat, single-leg Romanian deadlift (RDL), cable or band rotation, lateral band walk, face pull (rotator cuff), pallof press.
  - Basketball: front squat or goblet squat, trap bar deadlift, plyometric box jump, single-leg landing drill, lateral bound, push-up to overhead press progression.
  - Soccer: Romanian deadlift, Copenhagen adductor exercise (adductor prehabilitation), Nordic hamstring curl or glider hamstring curl, single-leg squat, hip thrust.
  - Swimming (dry-land): lat pulldown or pull-up, single-arm cable row, prone Y-T-W exercise (scapular control), external rotation with band, core plank series, hip flexor strengthening.

**Agility and Movement Quality Sessions (integrated into strength days or standalone):**
- Use these specific drills:
  - Lateral shuffle with stick (decelerate and hold): 4x10 meters
  - 5-10-5 pro agility drill (cone setup): 5 rounds with full recovery
  - T-drill (forward, lateral, backward): 4-6 rounds
  - Box drill (4 cones in a square, 5 meters apart, four movement patterns -- sprint, backpedal, shuffle, crossover): 4-6 rounds
  - Reactive agility (partner or coach signals direction): 3-5 minutes of reactive response work

---

### Step 7: Build the Injury Prevention Layer

Every sport-specific conditioning plan must include prehabilitation (prehab) exercises -- low-load, high-specificity exercises targeting the tendons, small stabilizer muscles, and movement patterns that break down first under sport stress. These are not warm-up exercises and not main lifts -- they occupy 5-10 minutes of the session, typically at the beginning or end.

| Sport | Primary Prehab Targets | Key Exercises |
|--------------|------------------------|---------------|
| Tennis | Rotator cuff, wrist extensors, medial knee stability | Band external rotation (ER) 3x15, wrist extensor eccentric loading, lateral band walk 3x12/side |
| Basketball | Patellar tendon, ankle proprioception, ACL-risk reduction (landing mechanics) | Single-leg landing drill (stick the landing), terminal knee extension (TKE) with band, ankle alphabet balance |
| Soccer | Hamstring (strain prevention), adductor (groin pull), hip flexor | Nordic hamstring curl 3x6 (eccentric), Copenhagen plank (adductor), hip flexor mobility + strengthening |
| Swimming | Rotator cuff (impingement prevention), scapular stabilizers, cervical spine | Y-T-W prone on bench 3x10 each, serratus anterior push-up (wall), thoracic extension mobilization |
| Volleyball | Patellar tendon (jumper's knee), rotator cuff, ankle | Eccentric single-leg decline squat (Spanish squat protocol) 3x8, band ER 3x15, ankle stability balance |

The Nordic hamstring curl deserves special mention for soccer and any field sport: research consistently shows it reduces hamstring strain injury incidence by 50-65% in field sport athletes when performed 2x/week during the preparation phase. This exercise belongs in every soccer, basketball, and tennis conditioning program.

---

### Step 8: Finalize Progression and Recovery Guidance

**Progressive overload for conditioning:**
- Aerobic sessions: increase duration by 5 minutes per week until target duration reached, then increase intensity to Zone 3 (70-80% MHR) for 10-minute tempo blocks 1x/week.
- Interval sessions: first increase number of rounds (from 8 to 12 to 16), then decrease rest time (increase work-to-rest ratio), then increase speed or effort. Never increase volume and intensity simultaneously.
- Strength sessions: add 2.5-5 kg when the user can complete all prescribed reps with good form for two consecutive sessions at the current load.

**Recovery prescription:**
- Active recovery day: 20-minute walk, easy cycling, or light swimming at conversational pace. Not rest -- movement promotes blood flow and reduces muscle stiffness without adding training stress.
- Sleep: 7-9 hours is the single most powerful recovery intervention. Address this explicitly if the user mentions fatigue, soreness, or poor progress.
- Deload week: every 4th week, reduce all conditioning volume by 40% while maintaining intensity. This is not optional -- accumulated fatigue from sport + conditioning will cause detraining-like symptoms if deloads are skipped.

---

## Output Format

Present the conditioning program using the following structure. Every section must be filled with specific content -- no placeholder text.

```
## Conditioning Program: [Sport Name]

> **Disclaimer:** [Repeat full disclaimer]

**Athlete Profile:**
- Sport: [Sport + level, e.g., "Recreational Tennis, 2x/week"]
- Fitness Baseline: [Tier 1 / Tier 2 / Tier 3 -- brief rationale]
- Timeline: [Off-season GPP / Pre-season SSP / In-season Maintenance / General Conditioning]
- Conditioning Days Available: [X days/week beyond sport practice]
- Equipment: [Gym / Home / Outdoor field / etc.]
- Key Limitation or Goal: [One sentence -- the primary problem to solve]

---

### Sport Demand Profile

| Physical Quality         | Importance for This Sport | Priority in This Program |
|--------------------------|---------------------------|--------------------------|
| Aerobic endurance        | [High/Medium/Low]         | [Primary/Secondary/Maintenance] |
| Anaerobic capacity       | [High/Medium/Low]         | [Primary/Secondary/Maintenance] |
| Lateral agility / COD   | [High/Medium/Low]         | [Primary/Secondary/Maintenance] |
| Linear sprint speed      | [High/Medium/Low]         | [Primary/Secondary/Maintenance] |
| Vertical power           | [High/Medium/Low]         | [Primary/Secondary/Maintenance] |
| Rotational power         | [High/Medium/Low]         | [Primary/Secondary/Maintenance] |
| Upper body strength      | [High/Medium/Low]         | [Primary/Secondary/Maintenance] |
| Core stability           | [High/Medium/Low]         | [Primary/Secondary/Maintenance] |
| Flexibility / Mobility   | [High/Medium/Low]         | [Primary/Secondary/Maintenance] |

**Energy System Demand Summary:**
[2-3 sentences: primary energy system, approximate work-to-rest ratio during play, total duration demands. Use numbers.]

---

### Training Phase and Structure

**Current Phase:** [GPP / SSP / In-Season Maintenance]
**Phase Duration:** [X weeks]
**Weekly Training Volume:** [X conditioning sessions + X sport sessions = X total training days]

---

### Weekly Schedule

| Day        | Session Type                  | Duration  | Intensity  | Primary Focus                       |
|------------|-------------------------------|-----------|------------|-------------------------------------|
| [Day 1]    | [Aerobic Base]                | [X min]   | [Zone 2]   | [Specific focus description]        |
| [Day 2]    | [Sport Practice]              | [X min]   | [Sport]    | [Sport skill -- not coached here]   |
| [Day 3]    | [Strength + Prehab]           | [X min]   | [Moderate] | [Specific exercises listed below]   |
| [Day 4]    | [Rest or Active Recovery]     | [20 min]  | [Low]      | [Walk / easy mobility]              |
| [Day 5]    | [Sport Practice]              | [X min]   | [Sport]    | [Sport skill]                       |
| [Day 6]    | [Interval Conditioning]       | [X min]   | [High]     | [Sport-specific interval pattern]   |
| [Day 7]    | [Rest]                        | --        | --         | [Sleep, recovery priority]          |

---

### Session Designs

**Session A: Aerobic Base**
*Purpose: Build the aerobic engine that sustains [specific sport quality -- e.g., "3-set match endurance"]*

Warm-up (5 min): [Specific dynamic movements]

| Activity                      | Duration     | Intensity Target      | Notes                              |
|-------------------------------|--------------|-----------------------|------------------------------------|
| [Modality, e.g., treadmill jog] | [X min]    | Zone 2 (X-X bpm)      | [Sport-relevant note]              |

Mobility cooldown (8 min):
| Stretch / Mobilization        | Sets x Duration | Sport Relevance        |
|-------------------------------|-----------------|------------------------|
| [Specific stretch]            | [2 x 30s/side]  | [Why this matters]     |

---

**Session B: Strength + Movement Quality + Prehab**
*Purpose: [e.g., "Build posterior chain strength, lateral stability, and rotator cuff resilience for tennis"]*

Warm-up (8 min): [Specific sequence]

Prehab Block (8-10 min) -- perform BEFORE main strength work:
| Exercise                          | Sets x Reps     | Load     | Notes                        |
|-----------------------------------|-----------------|----------|------------------------------|
| [Prehab exercise]                 | [3 x 15]        | [Band/BW] | [Injury prevention target]  |

Main Strength Block:
| Exercise                          | Sets x Reps     | Rest     | Load Notes                   |
|-----------------------------------|-----------------|----------|------------------------------|
| [Primary lower body, e.g., goblet squat] | [3 x 10] | [90s]  | [GPP: moderate / SSP: heavier] |
| [Hip hinge, e.g., single-leg RDL] | [3 x 8/leg]     | [60s]   | [Posterior chain + balance]  |
| [Upper body pull]                 | [3 x 10]        | [60s]   | [e.g., lat pulldown for swimmers] |
| [Rotational / core]               | [3 x 10/side]   | [60s]   | [Sport-specific movement plane] |
| [Core stability]                  | [3 x 30-45s]    | [45s]   | [e.g., plank, pallof press]  |

Agility Block (if included in this session):
| Drill                             | Reps / Duration | Rest     | Cue / Notes                  |
|-----------------------------------|-----------------|----------|------------------------------|
| [Lateral shuffle / T-drill / etc.] | [4-6 rounds]   | [Full]  | [Deceleration quality focus] |

---

**Session C: Sport-Specific Interval Conditioning**
*Purpose: [e.g., "Train the repeated anaerobic sprint capacity that powers basketball possessions"]*

Warm-up (10 min): [Specific dynamic warm-up sequence including movement prep at sport tempo]

Main Interval Block:
| Interval Type                    | Work Duration | Rest Duration | Rounds | Effort Level  |
|----------------------------------|---------------|---------------|--------|---------------|
| [e.g., Shuttle sprint side-side] | [X seconds]   | [X seconds]   | [X]    | [85-95% MHR]  |
| [Recovery walk or jog]           | [90s]         | --            | [1]    | [Between blocks] |
| [e.g., Forward-back sprint]      | [X seconds]   | [X seconds]   | [X]    | [85-95% MHR]  |

Cooldown (5 min): [Walk + specific static stretches for sport-relevant areas]

---

### Injury Prevention Priority Plan

| Body Area at Risk   | Specific Injury Risk         | Prevention Protocol                        | Frequency           |
|---------------------|------------------------------|--------------------------------------------|---------------------|
| [Area, e.g., Hamstring] | [e.g., Strain on acceleration] | [Nordic curl 3x6 eccentric]            | [2x/week]          |
| [Area]              | [Risk]                       | [Exercise + prescription]                  | [Frequency]         |

---

### Phase Progression Schedule

| Phase         | Duration  | Volume Level | Intensity Level | Key Emphasis                              |
|---------------|-----------|--------------|-----------------|-------------------------------------------|
| GPP (Off-season) | [X wks] | High volume | Low-Moderate   | Aerobic base, general strength, mobility  |
| SSP (Pre-season) | [X wks] | Moderate   | Moderate-High   | Sport intervals, power, agility, prehab   |
| In-Season     | Season    | Low          | Maintain        | 1-2 sessions/week, recovery priority      |
| Deload        | 1 wk/4    | -40% volume  | Maintain        | Full physiological adaptation absorption  |

---

### Recovery and Lifestyle Notes

- **Sleep target:** [7-9 hours -- note if user mentioned insufficient sleep]
- **Active recovery recommendation:** [Specific activity, duration, days]
- **Warning signs to reduce training:** [Persistent soreness over 72 hours, sleep disruption, declining sport performance -- these indicate accumulated fatigue; reduce volume by 30% for one week]
- **When to consult a professional:** [Any recurring localized pain during sport activity, sudden sharp pain, joint swelling]
```

---

## Rules

1. **Always lead with the disclaimer.** Every conditioning output must include the safety disclaimer before any programming content. This is non-negotiable regardless of how confident the user appears or how simple the request seems.

2. **Match interval duration and work-to-rest ratio to actual sport demands.** Never prescribe generic "HIIT" without anchoring the work and rest periods to the specific time signatures of the sport. A 4-minute Tabata protocol is meaningless for tennis point simulation. A 10-second work / 30-second rest shuttle run is not meaningful soccer conditioning. Use the profiles in Step 2 as the source of truth.

3. **Aerobic base is mandatory for every sport.** Even the most explosive, anaerobic sports (volleyball, basketball) require a functioning aerobic base for recovery between bouts. The aerobic system powers recovery during the rest periods of intermittent sports. Never omit Zone 2 aerobic development entirely -- even 1 session per week of 30-40 minutes contributes meaningfully.

4. **Never schedule high-intensity conditioning within 24 hours before a game.** The physiological cost of a hard interval session includes 18-36 hours of elevated muscle protein breakdown, glycogen depletion, and CNS fatigue. Even a "light" version the day before a game impairs performance. Schedule hard days at minimum 48 hours before competition.

5. **Prehabilitation exercises must appear in every program.** The single most evidence-supported function of sport-specific conditioning -- beyond performance gains -- is injury prevention. The Nordic hamstring curl for field sports, the Y-T-W and band ER for swimming and overhead sports, and single-leg landing drills for court sports with jump demands are not optional add-ons. They belong in the first 8-10 minutes of strength sessions.

6. **Never prescribe technique instruction for the sport itself.** Do not coach tennis strokes, swimming mechanics, soccer shooting technique, or basketball shooting form. The skill's scope is exclusively the physical conditioning that supports those skills. Technique errors are for a coach, not a conditioning plan.

7. **Include a deload week every 4 weeks.** Failing to include planned deloads is the primary cause of overtraining syndrome in recreational athletes who train consistently. A deload (40% reduction in volume, same or slightly reduced intensity) produces the adaptation consolidation that makes training effective. Include it explicitly in the program schedule, not as an afterthought.

8. **Tier 1 users (deconditioned) must not begin sport-specific high-intensity intervals in weeks 1-3.** Introducing high-intensity sport-specific intervals too early in a deconditioned person causes rapid accumulated fatigue, high injury risk from poor movement quality under fatigue, and dropout. The first 4 weeks must focus on movement quality, aerobic base, and foundational strength -- even if the user pushes back. Explain the physiological rationale.

9. **In-season conditioning must be lower in volume than sport practice and games.** In-season, the sport itself is the primary training stimulus. Conditioning sessions in-season maintain -- they do not build. Two sessions of 25-35 minutes per week is the maximum for most recreational athletes playing 2-3 games/practices per week. Attempting to do pre-season volume during the season produces fatigue accumulation and increased injury risk.

10. **Immediately flag any description of recurring localized pain, swelling, or sharp pain during sport activity.** Do not design conditioning around an unaddressed injury. If a user mentions their knee "always hurts when they cut," their shoulder "impinges during the serve," or similar patterns, acknowledge this as a potential injury requiring professional assessment and include a note to see a sports medicine professional or physical therapist before beginning the conditioning program. Design the program with conservative modifications for that area, but make the flag explicit.

11. **Never suggest supplement use, specific brands of equipment, or specific medication.** Sport-specific conditioning is about programming and execution. Any questions about supplements should be deferred to a registered dietitian or sports medicine physician.

12. **Provide alternatives for every key exercise.** Recreational athletes frequently have equipment limitations, prior injuries that restrict specific movements, or facility constraints. Every major exercise prescription should include at least one alternative (e.g., "Nordic curl -- substitute with stability ball leg curl if Nordic is too advanced"; "goblet squat -- substitute with leg press if loading a barbell squat is not available").

---

## Edge Cases

**The user plays multiple sports simultaneously (e.g., tennis in summer, basketball in winter)**
Identify the shared physical qualities across both sports -- almost always: aerobic base, lateral agility, core stability, and lower body strength. Build a "general athletic" conditioning block around these shared qualities. Reserve sport-specific agility drills and interval patterns for the sport currently in season or approaching. Avoid trying to train both sport-specific demand profiles simultaneously -- the session becomes incoherent. Instead, say: "For the next 8 weeks while tennis is the active sport, we'll focus intervals on tennis point duration patterns. When basketball season approaches, we'll shift the interval work to basketball possession patterns while keeping the shared physical base."

**The user has 2 or fewer conditioning days beyond sport practice**
This is the minimum viable dose. Consolidate training qualities into two carefully designed sessions: Session 1 should combine aerobic base + mobility (40-50 min, lower intensity), and Session 2 should combine strength + sport-specific intervals in a circuit format (45-55 min). Sequence Session 2 as: prehab block (8 min) → brief strength block (20 min, 3-4 exercises) → 15 minutes of sport-specific intervals. Do not attempt to include all components at full volume -- prioritize the sport's most critical physical demand. For a soccer player on 2 days, aerobic capacity is priority 1; for a basketball player, the interval and jump work take precedence over aerobic volume.

**The user is over 40 years old**
Make the following automatic adjustments without being asked: (1) Warm-up duration extends to 12-15 minutes -- articular cartilage, tendon tissue, and connective tissue require longer preparation times in Masters-age athletes. (2) Reduce plyometric volume by 50% compared to a standard program -- instead of 4x10 box jumps, prescribe 3x5 with a focus on landing quality over height. (3) Increase minimum rest between hard training days to 72 hours (not 48). (4) Emphasize mobility and flexibility as a primary concern rather than a secondary support quality. (5) Deload every 3 weeks instead of every 4. (6) Reduce total weekly interval rounds by 25-30% while maintaining work-to-rest ratios. Explain this to the user as a recovery capacity adjustment, not a performance ceiling.

**The user wants to start a sport they have never played before and has been sedentary**
Do not design a sport-specific conditioning program immediately. The user needs 4-6 weeks of general fitness building first. Prescribe: 3x/week of 25-35 minute Zone 2 aerobic activity (walking/jogging progression or cycling), 2x/week of full-body foundational strength training (goblet squat, hip hinge, push, pull, plank -- 3x10 each), and daily 10-minute mobility work. After 4-6 weeks, reassess and layer in sport-specific conditioning. Explain to the user that sport-specific intervals on an unconditioned body are ineffective and injury-prone -- the physical foundation must come first.

**The user reports playing the sport but not noticing fitness improvement despite conditioning**
This is usually one of three issues: (1) Conditioning intensity is too low -- they are doing Zone 2 aerobic work when their sport demands repeated anaerobic capacity; check whether their conditioning intensity actually matches the sport's demand profile. (2) Insufficient recovery -- they are training too frequently and accumulating fatigue without adaptation; prescribe a deload week immediately, then reassess frequency. (3) The sport practice itself is too infrequent to apply conditioning gains -- physical qualities must be expressed in the sport context to be reinforced. Ask about practice frequency and skill work. Address the correct cause rather than simply "adding more conditioning."

**The user has access only to home/minimal equipment (no gym)**
Every conditioning program must have a home-compatible version. Replace gym exercises as follows: goblet squat → air squat or Bulgarian split squat; trap bar deadlift → single-leg RDL with a backpack or kettlebell; cable rotation → band rotation anchored to a door; lat pulldown → door-frame rows or resistance band pulldown; box jumps → broad jumps on grass or a step. Agility drills require only space and markers (cones can be replaced with water bottles or chalk marks). Zone 2 aerobic work requires only running shoes or a jump rope. Nordic hamstring curls can be performed at home with a partner holding the ankles or with feet anchored under a heavy sofa. The program's effectiveness does not depend on gym equipment -- movement quality and interval structure are the variables that matter.

**The user is entering the season in less than 4 weeks with minimal conditioning base**
Do NOT try to compress a full GPP + SSP block into 4 weeks -- this produces overtraining and injury, not fitness. Instead: (1) Skip GPP entirely and go directly to a moderate-intensity sport-specific preparation phase. (2) Reduce all interval volumes by 30-40% to allow adaptation. (3) Prioritize injury prevention prehab over performance intervals. (4) Set expectations clearly: "4 weeks of conditioning will meaningfully improve your readiness compared to no conditioning, but the bulk of performance development will happen during the season and after it. The goal right now is to build the minimum physical readiness to stay healthy through the season." (5) Schedule the deload in week 3, not week 4, to allow recovery before the season begins.

---

## Example

**Input:** "I play recreational soccer in a Sunday league. Season starts in 5 weeks. I've been mostly inactive for 6 months -- I used to run casually, maybe 2-3 times a week but stopped. I can train 3 days per week outside of games. I have a gym membership and there's a grass field near me I can use. I'm 34 years old."

---

**Output:**

## Conditioning Program: Recreational Soccer -- Pre-Season Preparation

> **Disclaimer:** This program provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before starting a new fitness program. Stop exercising and seek medical attention if you experience chest pain, dizziness, difficulty breathing, or sharp joint pain.

---

**Athlete Profile:**
- Sport: Recreational Soccer, Sunday League, games starting in 5 weeks
- Fitness Baseline: Tier 1 / Tier 2 Transition -- previously ran casually, 6-month detraining period. Aerobic base present but deconditioned. Movement quality likely intact.
- Timeline: Compressed pre-season (5 weeks to season start) -- modified SSP approach
- Conditioning Days Available: 3 days/week conditioning + 1 Sunday game
- Equipment: Commercial gym + outdoor grass field
- Key Goal: Rebuild aerobic base sufficient to survive 90-minute games; rebuild hamstring and adductor resilience to avoid the most common soccer injuries; develop repeated sprint capacity for bursts during play

**Important note on timeline:** 5 weeks is a compressed pre-season. This program prioritizes injury prevention and minimum viable aerobic conditioning to keep you healthy through the season. Significant performance improvement will come during and after the season. Avoid the temptation to do more than prescribed -- rushed conditioning in an under-prepared body is the primary cause of early-season hamstring pulls.

---

### Sport Demand Profile

| Physical Quality         | Importance for Soccer | Priority in This Program |
|--------------------------|----------------------|--------------------------|
| Aerobic endurance        | High                 | Primary                  |
| Anaerobic capacity       | High                 | Secondary                |
| Lateral agility / COD   | Medium               | Secondary                |
| Linear sprint speed      | High                 | Secondary                |
| Vertical power           | Low                  | Maintenance              |
| Rotational power         | Low                  | Maintenance              |
| Upper body strength      | Low                  | Maintenance              |
| Core stability           | Medium               | Secondary                |
| Flexibility / Mobility   | High                 | Primary                  |

**Energy System Demand Summary:**
Recreational soccer is primarily aerobic -- a typical Sunday league player covers 6-8 km over 90 minutes at varying intensities. Within that total distance, there are 30-50 sprint efforts of 10-30 meters, each lasting 2-4 seconds, with approximately 40-60 seconds of walking or jogging recovery between efforts. The aerobic system powers the 80-85% of play that is not sprinting; the anaerobic system powers the sprint bursts that create scoring chances and defensive recovery. At your current detraining level, the aerobic base is the limiting factor -- rebuilding it is the priority.

---

### Training Phase and Structure

**Current Phase:** Compressed Pre-Season (modified SSP with GPP foundation in weeks 1-2)
**Phase Duration:** 5 weeks pre-season, then transition to in-season maintenance
**Weekly Training Volume:** 3 conditioning sessions + 1 Sunday game = 4 active days, 3 recovery/rest days

---

### Weekly Schedule

| Day        | Session Type                   | Duration   | Intensity      | Primary Focus                              |
|------------|--------------------------------|------------|----------------|--------------------------------------------|
| Monday     | Active recovery + mobility     | 20 min     | Very low       | Flush Sunday game fatigue; hip and hamstring mobility |
| Tuesday    | Aerobic base run               | 35-40 min  | Zone 2         | Rebuild aerobic engine; conversational pace |
| Wednesday  | Rest                           | --         | --             | Sleep priority                             |
| Thursday   | Strength + prehab              | 50 min     | Moderate       | Posterior chain, adductors, core; injury prevention focus |
| Friday     | Rest or light walk             | 20 min     | Low            | Prepare for interval day                   |
| Saturday   | Sport-specific intervals       | 40 min     | High           | Repeated sprint capacity; soccer movement patterns |
| Sunday     | Game                           | 90 min     | Sport          | Application -- no conditioning same day    |

**Deload schedule:** Week 3 is a deload -- reduce all conditioning sessions to 60% of planned volume and effort. This is not optional, especially given the 6-month detraining period. The deload in week 3 ensures you arrive at the season start recovered, not accumulated-fatigued.

---

### Session Designs

**Session A: Aerobic Base Run (Tuesday) -- 35-40 minutes**

*Purpose: Rebuild the aerobic engine that sustains 90 minutes of soccer. Running is the modality because it replicates the muscular demand of soccer locomotion.*

Warm-up (5 min): Walk 2 min → dynamic leg swings front-back (10/leg) → walking lunges (10/leg) → high knees 20 meters → heel flicks 20 meters.

| Activity              | Duration     | Intensity Target        | Notes                                          |
|-----------------------|--------------|-------------------------|------------------------------------------------|
| Continuous easy run   | 30 min       | Zone 2: 130-145 bpm (for age 34, MHR ≈ 186; Zone 2 = 112-130 bpm -- adjust if running at outdoor field) | Should be able to speak 3-4 word sentences comfortably. If breathing becomes labored, slow to a walk/jog mix. |

**Weeks 1-2:** 30 minutes continuous (walk-jog if needed)
**Weeks 3-4:** 35 minutes continuous at true Zone 2
**Week 5:** 35 minutes with final 10 minutes at a slightly faster "comfortably hard" pace (Zone 3 -- still conversational but not easy)

Mobility cooldown (8 min):
| Stretch                     | Sets x Duration | Sport Relevance                            |
|-----------------------------|-----------------|---------------------------------------------|
| Standing hip flexor stretch | 2 x 40s/side    | Counteract hip flexor shortening from running; improves stride length |
| Lying ham
