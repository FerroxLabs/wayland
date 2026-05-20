---
name: training-program-periodization
description: |
  Designs long-term training program structures using linear, undulating, and block periodization frameworks with macrocycle, mesocycle, and microcycle planning. Produces a multi-month program architecture with volume and intensity wave patterns, peaking protocols, and transition phases.
  Use when the user asks about long-term program design, periodization models, macrocycle planning, peaking for an event, or structuring training across months.
  Do NOT use for single workout design, beginner programs (use beginner-strength-training), or sport-specific conditioning (use sports-specific-conditioning).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "fitness workout-planning advanced"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "advanced"
---
# Training Program Periodization

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- A user with 1+ years of consistent, structured training asks how to organize their training across multiple months toward a specific or general goal
- A user is preparing for a powerlifting meet, Olympic weightlifting competition, bodybuilding show, strength test, or physical fitness assessment and needs a structured buildup
- A user explicitly asks about periodization models -- linear, undulating, block, conjugate, or polarized -- and wants to understand which applies to their situation
- A user has hit a plateau after months of running the same program and needs a macro-level restructuring, not just set/rep tweaks
- A user wants to organize multiple training goals (e.g., build hypertrophy in the offseason, then peak strength for a summer competition) into a coherent annual or semi-annual plan
- A user asks how to incorporate deload weeks, transition phases, or taper protocols into a larger training structure
- A user asks about managing fatigue accumulation, supercompensation timing, or how to avoid overtraining across a long training block
- A recreational athlete wants to peak for a seasonal event (rugby preseason, ski season, an obstacle race) and has 12-24 weeks of preparation time

**Do NOT use when:**
- The user has less than 1 year of structured training history -- use `beginner-strength-training` instead, since linear progression (add weight each session) delivers faster results and periodization complexity is premature
- The user is asking for a single workout session design -- use `workout-design` instead
- The user asks specifically about sport-specific conditioning, speed, agility, or energy system development for team sports -- use `sports-specific-conditioning`
- The user is asking about nutritional periodization, carbohydrate cycling, or caloric phase manipulation -- use `sports-nutrition-basics` or `macro-calculation`
- The user describes active symptoms of overtraining syndrome (persistent resting heart rate elevation >7 bpm above baseline, mood disturbance, immunosuppression, declining performance over 3+ weeks despite reduced load) -- advise consultation with a sports medicine professional before any programming
- The user needs rehabilitation programming following injury -- periodization principles apply but require clinical integration; defer to `injury-rehabilitation-guidance`
- The user is asking about programming for youth athletes under 15 years old -- foundational movement and general physical development protocols apply instead

## Process

### Step 1: Gather Critical Planning Parameters

Before selecting any model or designing any structure, collect the following. Missing any of these creates fundamental design errors.

- **Training age and history:** How many years of consistent structured training? What programs have they run recently (past 12-16 weeks)? What was the peak volume and intensity? This prevents prescribing a volume load the athlete cannot absorb.
- **Primary goal and goal hierarchy:** Is there ONE primary goal (squat total, body composition, 5K time) or multiple? If multiple, establish which is primary and which is maintenance. Dual-goal programming requires explicit priority assignment -- both cannot peak simultaneously.
- **Target date or timeline:** Is there a fixed event date (meet, show, test, season opener)? Or is it open-ended general fitness? The answer determines whether to use convergent peaking architecture or rolling accumulation.
- **Training frequency:** Days per week available for training. This governs both model selection and mesocycle design. 3 days/week limits block periodization effectiveness; 5-6 days/week enables high-frequency peaking protocols.
- **Current 1RM estimates or recent performance benchmarks:** Do not assume. Ask for recent tested or estimated maxes on primary lifts. These anchor all percentage-based prescriptions. If the user does not have tested maxes, prescribe RPE-only until a testing week is completed.
- **Equipment and facility access:** Barbell and rack availability, whether they train in a commercial gym or home setup, and whether competition-specific equipment (powerlifting bar, calibrated plates, squat suit) is accessible. This affects exercise selection within phases.
- **Recovery capacity constraints:** Sleep (average hours), stress load (occupational demands), and injury history. High life-stress users require lower peak volumes and more conservative intensity ramps. Ask directly.

### Step 2: Select the Periodization Model

This decision drives all downstream architecture. Match the model to the user's training age, goal type, and whether a specific peak date exists.

**Linear Periodization (LP):**
- Structure: Begin macrocycle at high volume / low intensity, systematically reduce volume and increase intensity week-over-week toward the goal date.
- Volume-intensity relationship follows a negative correlation: as intensity (% 1RM) rises, total sets and reps fall.
- Best for: Intermediate lifters (1-3 years) with a single peak date 12-20 weeks away. Predictable, easy to monitor, tolerates lower training frequency.
- Limitation: Fitness qualities trained in early phases (hypertrophy, work capacity) begin to detrain before the peak if the macrocycle exceeds 16-18 weeks. Requires careful mesocycle length control.
- Volume landmark: Start at approximately 15-20 total weekly sets per major muscle group at 65-70% 1RM, ending at 6-10 sets per week at 85-95%+ 1RM in the peaking phase.

**Daily Undulating Periodization (DUP):**
- Structure: Vary rep ranges and intensity within each week. A 3-day DUP week might look like: Day 1 -- power (3x3-5 at 82-88%), Day 2 -- strength (4x4-6 at 75-80%), Day 3 -- hypertrophy (4x8-10 at 65-72%).
- Best for: Experienced lifters (3+ years) without an imminent peak date, or those who respond poorly to extended single-quality blocks (common complaint: losing strength gains during extended hypertrophy phases).
- Weekly undulation allows simultaneous maintenance of multiple fitness qualities, reducing detraining risk during long off-season periods.
- Can be layered on top of a block macrocycle: use DUP within a mesocycle while still shifting the emphasis of the DUP distribution across mesocycles.
- Limitation: Requires careful session-to-session fatigue management. Two heavy CNS-demanding sessions within 48 hours will accumulate fatigue faster than volume metrics alone suggest.

**Block Periodization (Issurin Model):**
- Structure: 3-6 week concentrated loading blocks, each targeting one or two training qualities in sequence. Residual training effect (RTE) dictates block sequencing -- train qualities in order from longest to shortest RTE.
- RTE hierarchy (approximate retention after cessation of training stimulus):
  - Aerobic endurance: 25-35 days
  - Maximal strength: 25-35 days
  - Anaerobic glycolytic capacity: 15-20 days
  - Muscular endurance: 15-20 days
  - Speed/power: 5-10 days
  - Maximal speed: 2-8 days
- Sequence blocks from longest to shortest RTE, so the quality with the shortest RTE is peaked last (closest to competition).
- For strength-power athletes: Accumulation block (hypertrophy/GPP) → Transmutation block (strength/specific strength) → Realization block (power/peaking) → Competition.
- Best for: Advanced athletes (3+ years) with a specific competition date, or any athlete who responds well to focused, concentrated training stimuli.
- Limitation: Requires sufficient training frequency within each block (minimum 3 sessions/week for primary quality) to produce meaningful concentrated overload.

**Conjugate / Concurrent Periodization:**
- Structure: Train multiple qualities in parallel, every week, with emphasis rotation across the training week. Classic example: Max Effort (ME) day -- work up to a heavy single, double, or triple in a competition movement or variation; Dynamic Effort (DE) day -- sub-maximal loads (50-65%) with maximal bar speed to develop rate of force development.
- Best for: Advanced strength athletes (4+ years), experienced powerlifters using accommodating resistance (bands, chains), or any athlete needing simultaneous maintenance of multiple high-level qualities.
- Limitation: Requires sophisticated exercise rotation and accessory selection knowledge. Not suitable without at least 2-3 years of structured barbell training and a solid foundation in movement variations.

**Polarized Periodization:**
- Used primarily in endurance sports but increasingly applied to hybrid athletes and GPP-focused training. Approximately 80% of training volume at low intensity (conversational pace, RPE 2-4), 20% at high intensity (near-maximal effort, RPE 8-10). Middle intensities (RPE 5-7) are deliberately minimized.
- Best for: Endurance athletes, hybrid athletes with a significant cardiovascular component, or strength athletes in an off-season GPP phase building aerobic base.

### Step 3: Design the Macrocycle Architecture

With the model selected and timeline confirmed, build the top-down structure.

- **Calculate working weeks:** Subtract meet/event week (zero training load) and planned transition weeks from total timeline. A 16-week macrocycle typically yields 12-13 weeks of actual loading.
- **Assign transition weeks:** Place a 1-week deload after every 3-5 loading weeks. The deload is mandatory, not optional. Research consistently shows supercompensation requires a reduction in training stress -- approximately 40-60% volume reduction at maintained intensity preserves fitness while allowing recovery. Do not reduce intensity below 60% 1RM during deloads; maintaining neural drive while reducing volume load is the goal.
- **Backward plan from the peak date:** Start at the competition and work backwards. Identify: (1) Meet/event week (competition, minimum loading), (2) Taper week (1-2 weeks pre-meet, reduce volume 50-70%, maintain or slightly reduce intensity -- 85-90% openers only), (3) Realization block (2-3 weeks), (4) Transition week, (5) Transmutation block (3-4 weeks), (6) Transition week, (7) Accumulation block(s) filling remaining weeks.
- **Mesocycle length constraints:** No loading mesocycle should exceed 5-6 weeks before a transition week. Beyond 6 weeks of progressive overload without a deload, functional overreaching transitions from performance-enhancing to performance-degrading for most athletes. Exception: Some advanced athletes use 6+1 (six loading weeks, one deload) successfully if monitoring indicators remain positive.
- **Volume landmark targets by phase:**
  - Accumulation: 16-25 weekly sets per primary muscle group (upper: chest/back/shoulders; lower: quads/hamstrings/glutes for powerlifters)
  - Transmutation: 12-16 weekly sets, higher intensity
  - Realization: 6-10 weekly sets, maximum intensity
  - Transition: 4-8 weekly sets, 50-65% 1RM

### Step 4: Define Mesocycle Parameters and Progression Models

Each mesocycle requires a precise parameter set. Generic descriptions ("do more work") cause program failure. Specify the following for each mesocycle:

- **Accumulation mesocycle:**
  - Rep ranges: 5-10 for compound strength lifts; 8-15 for accessory work
  - Intensity: 60-77% 1RM for primary lifts
  - Set progression model: Linear set addition (3x8 → 4x8 → 5x8 → deload) OR load progression (3x8 at 65% → 3x8 at 68% → 3x8 at 72%)
  - Weekly volume increase: No more than 10% total volume load week-over-week (the 10% rule applies to prevent acute injury from volume spikes)
  - RPE targets: Working sets at RPE 7-8. Last set of last exercise may reach RPE 8-9, but most work should leave 1-2 reps in reserve.
  - Accessory work philosophy: Higher volume, targeting muscular weak points and structural balance. Hamstrings, rear delts, upper back, and rotator cuff are commonly underdeveloped and should receive elevated attention during accumulation.

- **Transmutation mesocycle:**
  - Rep ranges: 1-6 for primary compound lifts; 6-10 for accessory work
  - Intensity: 75-88% 1RM for primary lifts
  - Progression model: Intensity wave loading is effective here. Example 4-week wave: Week 1 -- 4x5 at 80%, Week 2 -- 4x4 at 83%, Week 3 -- 4x3 at 86%, Week 4 -- deload. Or use a double-wave: Week 1 -- 5x5 at 78%, Week 2 -- 5x4 at 82%, Week 3 -- 4x3 at 85%, Week 4 -- 5x5 at 80%, Week 5 -- 5x4 at 83%, Week 6 -- deload (for longer transmutation phases).
  - RPE targets: RPE 8-9 on primary lifts. Reserve RPE 9.5-10 for realization only.
  - Accessory work: Volume reduces relative to accumulation, intensity increases. Focus shifts to competition-specific movement patterns and positional strength.

- **Realization/Peaking mesocycle:**
  - Rep ranges: 1-3 for primary competition lifts exclusively
  - Intensity: 85-100%+ 1RM (includes attempts in the 95-102% range in final weeks for advanced athletes)
  - Duration: 2-3 weeks maximum. Neural peaking has a short window -- exceeding 3 weeks at 90%+ accumulates CNS fatigue faster than supercompensation can occur.
  - Set progression: Low sets, high quality. 2-4 work sets per primary lift. Every set is mentally and physically demanding -- do not program volume that degrades bar speed or technical quality.
  - Accessory work: Minimal. Maintenance only, 1-2 sets per exercise, remove anything not directly supporting competition movements.
  - Attempt selection (powerlifting): Opener at approximately 90-92% of expected competition max. Second attempt: 95-97%. Third attempt: PR attempt. Never open above a weight executed with ease in training.

- **Taper (pre-competition week):**
  - Volume: 30-50% of normal training week
  - Intensity: 85-90% (opener feeling rehearsal only -- this is not a testing week)
  - Sessions: 2-3 sessions maximum, primarily motor pattern reinforcement, not fatigue accumulation
  - Last heavy training session: No closer than 5-7 days before competition for most athletes. Some advanced athletes handle 4 days out; beginners need 7+ days.

### Step 5: Design Microcycle Structure (Weekly Architecture)

The microcycle is where abstract percentages become actual training sessions. Session sequencing matters as much as the parameters themselves.

- **Session sequencing principles:**
  - Place the highest-intensity session (heaviest percentage, most CNS demand) when the athlete is freshest -- typically after 1-2 rest days, or as the first session of the week.
  - Separate sessions targeting the same primary movement by 48-72 hours minimum. Squatting on Monday and Wednesday with heavy loading on both days produces CNS fatigue accumulation that undermines both sessions.
  - For 4-day programs, a common effective split: Day 1 -- Lower Heavy (squat focus), Day 2 -- Upper Heavy (bench focus), Day 3 -- off or light accessory, Day 4 -- Lower Moderate (deadlift or squat variation), Day 5 -- Upper Moderate/Volume, Days 6-7 -- rest or active recovery.
  - For 3-day programs, full-body sessions with DUP rotation work best. Session A (heavy): primary compound at 82-88%; Session B (moderate): 73-80%; Session C (volume): 65-73%. Rotate each week.

- **Within-week fatigue distribution:**
  - Total training stress (tonnage = sets × reps × load) should be distributed so that no single session carries more than 40% of weekly volume for a given movement pattern in accumulation phases. This prevents catastrophic overload on any single session.
  - For powerlifters using squat/bench/deadlift, the conventional wisdom of squat/bench having twice the weekly frequency of deadlift holds because deadlift recovery demands are higher per unit of volume due to greater spinal loading.

- **Autoregulation integration:**
  - Percentage-based programming assumes training conditions are constant, which they never are. Build in RPE checkpoints: if the prescribed weight for a session feels at RPE 9.5+ before the working sets are complete, stop adding sets and record the discrepancy.
  - RPE-to-percentage conversion table (approximate, individual variation is high):
    - RPE 10: 100% 1RM (true maximum)
    - RPE 9.5: 97-98%
    - RPE 9: 94-96%
    - RPE 8.5: 91-93%
    - RPE 8: 88-90%
    - RPE 7.5: 85-87%
    - RPE 7: 82-84%
    - RPE 6: 78-81%
  - Load adjustment rule: If RPE exceeds target by more than 1 point, reduce load by 5% and complete remaining sets. Do NOT chase prescribed percentages into technical breakdown.

### Step 6: Establish Monitoring Metrics and Adjustment Protocols

A periodized program without a monitoring system is a guess, not a plan. Define specific metrics and specific adjustment triggers.

- **Primary performance indicators:**
  - Weekly working weight on competition lifts at standard set/rep schemes (e.g., 4x4 on squat every Monday -- track this exact number week-over-week)
  - Bar velocity if velocity-based training (VBT) equipment is available. A mean concentric velocity drop of >15% from baseline at a given load indicates significant fatigue accumulation before the athlete subjectively "feels" overtrained.
  - Session RPE (session RPE = RPE of entire training session, not individual sets). Session RPE consistently at 9-10 for multiple weeks signals excessive systemic fatigue.

- **Secondary recovery indicators:**
  - Morning resting heart rate: A consistent elevation of >5-7 bpm above established baseline is an early fatigue indicator.
  - Subjective wellness questionnaire: Rate 1-5 daily: sleep quality, mood, muscle soreness, energy level, motivation to train. A composite score dropping below 60% of maximum for 3+ consecutive days triggers a load reduction.
  - Grip strength (handheld dynamometer or simple crush test): Correlates with systemic recovery state. A 10%+ reduction from baseline is a validated marker of incomplete recovery.

- **Adjustment decision rules:**
  - Performance declines for 2 consecutive weeks within a mesocycle despite normal recovery indicators → Check technique first, then reduce volume by 20% for 1 week, then resume.
  - Performance declines for 2 consecutive weeks WITH poor recovery indicators → Insert an unplanned deload week (40-50% volume reduction) immediately.
  - Session RPE consistently 1+ above targets for 3+ consecutive sessions → Load may have been set too aggressively. Reassess 1RM estimates and recalibrate percentages downward by 3-5%.
  - Meet date shifts earlier by more than 2 weeks → Compress current mesocycle by eliminating the lowest-priority sessions (usually hypertrophy accessory work first, then accessory compound work), and accelerate the transition into the next phase.
  - Meet date shifts later by more than 2 weeks → Insert an additional accumulation or GPP week. Do NOT extend the peaking phase -- peaking longer than 3 weeks is counterproductive for most athletes.

### Step 7: Finalize Exercise Selection and Variation Strategy

The periodization architecture is not just sets, reps, and percentages -- the exercises themselves must vary strategically across mesocycles to prevent neural adaptation while maintaining transferability to competition movements.

- **Accumulation phase exercise selection:**
  - Use variations that increase time under tension and hypertrophic stimulus while reducing CNS demand relative to competition lifts.
  - Squat variations: High-bar squat, paused squat (2-3 second pause at bottom), box squat, goblet squat for accessory.
  - Bench variations: Close-grip bench (develops triceps for lockout), incline bench, paused bench (develops strength off the chest -- critical for powerlifting bench).
  - Deadlift variations: Romanian deadlift (hamstring development, hip hinge reinforcement), stiff-leg deadlift, deficit deadlift (2-4 inch deficit develops off-the-floor strength).
  - Accessory selection principle: Address the weakest link in each competition lift. For squat: glutes, hamstrings, core stability. For bench: upper back, lats, rear delts, triceps. For deadlift: hamstrings, upper back, grip.

- **Transmutation phase exercise selection:**
  - Move toward competition-specific movement patterns. Reduce variation count, increase specificity.
  - Begin transitioning from variations back toward the competition lift as the primary movement.
  - Keep 1-2 strategic variations to address persistent technical weaknesses identified in the accumulation phase.
  - Accommodate resistance (bands, chains) can be introduced here for experienced lifters to train rate of force development and address lockout weaknesses.

- **Realization phase exercise selection:**
  - Competition lifts only for primary work. Full specificity -- same stance width, grip width, equipment, depth standards as competition.
  - Accessory work: Maintenance only. 1-2 exercises per session maximum, light loads, no DOMS-inducing novelty.

- **Variation cycling principles:**
  - Introducing a new variation mid-mesocycle creates initial performance drops (neural learning curve). Introduce new variations at the START of a mesocycle only.
  - No more than 2-3 primary variations per training block. More variation dilutes training stimulus.
  - The SRA (stimulus, recovery, adaptation) cycle for a specific lift takes approximately 7-14 days for neurological adaptations to consolidate. This means a lift trained twice weekly accumulates more specific adaptation than once weekly, independent of total volume equivalence.

### Step 8: Communicate the Full Plan and Establish Review Points

The final step is communicating the plan clearly and building in scheduled review checkpoints.

- Present the macrocycle overview table first so the user can see the full temporal architecture before the details.
- Explain the rationale for model selection in plain language -- users who understand why they are doing something are significantly more compliant.
- Identify 3-4 scheduled "program review points" -- typically at the end of each mesocycle -- where the user should assess progress, update 1RM estimates, and confirm the plan is on track.
- Explicitly instruct the user to update 1RM estimates at the end of the accumulation phase (often the final week of the accumulation mesocycle, or a dedicated testing week). Running transmutation and realization phases off outdated 1RM numbers leads to dramatically miscalibrated loading.
- Provide "phase transition criteria" -- specific performance benchmarks a user should hit before advancing to the next phase. Example: Do not enter the realization phase unless working sets at 85% feel at RPE 8 or below. If they feel at RPE 9, the strength base from transmutation is insufficient and the transmutation phase should be extended 1 week.

## Output Format

```
## Periodized Training Plan: [Goal Summary]

**Model:** [Linear / DUP / Block / Conjugate / Polarized]
**Macrocycle length:** [X weeks]
**Peak/Event date:** [Date or "rolling accumulation"]
**Training frequency:** [X days/week]
**Primary lifts tracked:** [List competition or goal lifts]
**Estimated 1RM baseline:** [Lift: weight -- note if estimated or tested]

---

### Macrocycle Architecture

| Mesocycle | Weeks    | Phase              | Primary Quality         | Weekly Sets* | Intensity Range | RPE Target |
|-----------|----------|--------------------|-------------------------|--------------|-----------------|------------|
| 1         | 1-[X]    | Accumulation       | Hypertrophy / Work Cap  | 16-22        | 65-77% 1RM      | 7-8        |
| T1        | [X+1]    | Transition         | Recovery / Restoration  | 6-8          | 55-65%          | 5-6        |
| 2         | [X+2]-[Y]| Transmutation      | Maximal Strength        | 12-16        | 78-88% 1RM      | 8-9        |
| T2        | [Y+1]    | Transition         | Recovery / Restoration  | 6-8          | 60-68%          | 6-7        |
| 3         | [Y+2]-[Z]| Realization        | Peaking / Neural Eff.   | 6-10         | 87-100%+ 1RM    | 9-9.5      |
| 4         | [Z+1]    | Taper              | Supercompensation       | 3-6          | 82-90%          | 7-8        |
| --        | Final    | Event/Competition  | Performance             | Minimal      | Openers         | 7 (opener) |

*Weekly sets = total working sets per primary movement pattern

---

### Phase Transition Criteria

- Accumulation → Transmutation: Working sets at 77% should feel RPE ≤ 8. Volume tolerance confirmed (completing prescribed sets without significant RPE overshoot).
- Transmutation → Realization: Working sets at 85-87% should feel RPE ≤ 8.5. Bar speed remains strong through last rep of working sets.
- Realization → Taper: Openers (90-92%) executed with RPE ≤ 8, demonstrating readiness for competition-level loading.

---

### Mesocycle [N] Detail: [Phase Name]

**Weeks:** [X-Y]
**Primary quality:** [Hypertrophy / Maximal Strength / Peaking]
**Competition lift focus:** [e.g., Squat, Bench, Deadlift]
**Rep ranges -- primary lifts:** [X-Y reps]
**Rep ranges -- accessory work:** [X-Y reps]
**Intensity range:** [X-Y% 1RM]
**Target RPE:** [X-Y for working sets]
**Weekly volume target:** [X-Y sets per primary pattern]

| Week | Primary Lift Scheme | Intensity   | Accessory Volume | Session RPE Target | Notes                        |
|------|---------------------|-------------|------------------|--------------------|------------------------------|
| [1]  | [sets x reps]       | [% or RPE]  | [relative level] | [target]           | [phase intro, technique cue] |
| [2]  | [sets x reps]       | [% or RPE]  | [relative level] | [target]           | [progression note]           |
| [3]  | [sets x reps]       | [% or RPE]  | [relative level] | [target]           | [peak loading week]          |
| [4]  | [sets x reps]       | [% or RPE]  | [deload]         | [lower target]     | [transition/deload]          |

**Primary exercise selection:**
- [Lift 1]: [Competition lift or variation] -- [rationale]
- [Lift 2]: [Competition lift or variation] -- [rationale]
- [Lift 3]: [Competition lift or variation] -- [rationale]

**Key accessory exercises:** [List 4-6 with rep ranges and rationale]

---

### Weekly Session Structure (Microcycle Template -- [Phase Name])

**Day 1 -- [Label: e.g., Lower Heavy]:**
- [Primary lift]: [sets x reps @ intensity]
- [Supplemental lift]: [sets x reps @ intensity]
- [Accessory 1]: [sets x reps]
- [Accessory 2]: [sets x reps]

**Day 2 -- [Label: e.g., Upper Heavy]:**
- [Primary lift]: [sets x reps @ intensity]
- [Supplemental lift]: [sets x reps @ intensity]
- [Accessory 1]: [sets x reps]
- [Accessory 2]: [sets x reps]

[Repeat for each training day]

---

### Autoregulation Guidelines

| Situation                                    | Action                                                     |
|----------------------------------------------|------------------------------------------------------------|
| RPE 1+ above target on working sets          | Reduce load by 5%, complete remaining sets at new weight   |
| RPE 1+ below target on ALL working sets      | Increase load by 2.5-5% (not during deload weeks)         |
| Technical breakdown before set is complete   | Terminate set, rest 3-5 min, retry at 5% reduced load      |
| Two consecutive sessions with RPE overshoot  | Insert 2 additional rest days before next session          |
| Three consecutive sessions with RPE overshoot| Insert full unplanned deload week immediately              |
| Session RPE ≥ 9.5 for 2+ weeks               | Reassess 1RM baseline; recalibrate all percentages         |

---

### 1RM Update Schedule

| Review Point          | Action                                                                |
|-----------------------|-----------------------------------------------------------------------|
| End of Accumulation   | Re-test or re-estimate 1RM; adjust transmutation percentages          |
| End of Transmutation  | Re-test or re-estimate 1RM; set realization attempt weights           |
| Week before Taper     | Confirm opener selections based on realization phase performance       |

---

### Monitoring Checklist

**Daily (before each session):**
- [ ] Rate sleep quality (1-5)
- [ ] Rate energy level (1-5)
- [ ] Rate motivation (1-5)
- [ ] Note any significant soreness or joint discomfort (location, severity 1-5)
- [ ] Record morning resting heart rate (if baseline established)

**Per session:**
- [ ] Record actual loads used (not just prescribed)
- [ ] Record actual RPE per working set on primary lifts
- [ ] Record session RPE (1-10) at session end
- [ ] Note any technical breakdowns or movement quality concerns

**Weekly:**
- [ ] Assess training performance trend vs. prior week on primary lifts
- [ ] Compare session RPE trend to prescription
- [ ] Record morning bodyweight (if relevant to weight class or body composition goal)
- [ ] Composite wellness score: sum of daily ratings; flag if weekly average <60% of maximum

**Phase transition (end of each mesocycle):**
- [ ] Update 1RM estimates
- [ ] Review monitoring data for fatigue signals
- [ ] Confirm phase transition criteria are met before advancing
- [ ] Adjust next mesocycle parameters if needed
```

## Rules

1. **Always present the disclaimer before providing any guidance.** The disclaimer must appear at the top of every response that includes a training plan or specific programming guidance.

2. **Never prescribe absolute weights -- use percentages of estimated 1RM or RPE values.** You cannot know the user's true strength level. Percentage-based prescriptions with RPE checkpoints protect against both under-training (too conservative) and injury (too aggressive). The only exception is when the user provides tested 1RM numbers and explicitly requests weight-based prescriptions.

3. **Every mesocycle exceeding 3 loading weeks must include a transition week immediately following.** No athlete, regardless of experience level, should accumulate more than 5-6 consecutive loading weeks without a structured deload. Physiological research on supercompensation confirms that the adaptation window requires a reduction in training stress to express. A deload is not optional -- it IS the training.

4. **Peaking mesocycles must NEVER exceed 3 weeks.** Beyond 3 weeks at 88%+ intensity, the rate of CNS fatigue accumulation exceeds the rate of neuromuscular adaptation for virtually all athletes. Extending a peak phase is one of the most common and damaging programming errors. If performance is not ready at 3 weeks, the problem is in the earlier blocks, not in the peak duration.

5. **Volume and intensity must never increase simultaneously across consecutive weeks within a mesocycle.** This is the cardinal rule of overload management. Increase either sets/reps (volume) or load (intensity) in any given week, never both. Simultaneous increases in both variables produce non-recoverable overreaching in most athletes within 2-3 weeks.

6. **Do not design a periodized program for anyone with fewer than 12 months of consistent structured training.** Beginners respond to any consistent overload stimulus and do not need periodization complexity. Linear session-to-session progression (5 lbs per session on major lifts) produces faster results than any sophisticated periodization model for this population. Directing a beginner to a complex block program is actively harmful -- it introduces unnecessary complexity without proportional benefit and increases the risk of program abandonment.

7. **Always include specific phase transition criteria.** A program that says "complete Mesocycle 1 then start Mesocycle 2" is incomplete. Each phase transition must be gated by performance readiness criteria -- specific RPE thresholds, specific performance standards, or explicit recovery confirmation. Advancing to higher intensities before strength adaptations are consolidated from prior phases undermines the entire periodization model.

8. **Always schedule at least one 1RM update point within the macrocycle.** Percentages calculated from a 12-week-old 1RM become increasingly inaccurate as training adaptations occur. A 5-10% improvement in true 1RM means all percentage-based prescriptions are underloaded by that margin, blunting the training stimulus. Require 1RM re-estimation at the end of each accumulation phase at minimum.

9. **For any user reporting symptoms consistent with overtraining syndrome (persistent fatigue, mood disturbance, performance decline over 3+ weeks, elevated resting heart rate, immune suppression, sleep disruption), immediately recommend volume reduction to 40% of current load and advise consultation with a sports medicine professional.** Do not attempt to "program around" clinical overtraining. The correct intervention is rest and medical consultation, not creative programming.

10. **Never design a taper that eliminates training entirely.** A complete cessation of training for more than 5-7 days before competition causes detraining in speed and rate of force development -- the exact qualities needed for competition performance. The optimal competition taper reduces volume by 50-70% while maintaining intensity at approximately 85-92%, with training sessions occurring every 2-3 days. Complete rest is only appropriate for 1-2 days immediately pre-competition.

11. **When multiple goals are present, always explicitly state which goal receives priority loading and which receives maintenance.** Concurrent training for strength and hypertrophy, or strength and endurance, requires interference management. The user must understand that the secondary goal will receive a maintenance stimulus, not a development stimulus, during primary-goal mesocycles. Both qualities cannot be simultaneously developed at their maximum rates.

12. **Exercise variation introductions must occur only at the start of a new mesocycle.** Introducing a new movement mid-mesocycle creates a performance dip as the nervous system learns the movement pattern. This dip can be misinterpreted as fatigue or program failure. New variations belong at mesocycle boundaries when a performance reset is expected anyway.

## Edge Cases

**No specific peak date (general fitness or open-ended training):**
Use DUP or a rolling block approach with 4-week mesocycles and no convergent peaking phase. Alternate emphasis: Mesocycle 1 (hypertrophy emphasis, 8-12 rep primary work) → Transition week → Mesocycle 2 (strength emphasis, 3-6 rep primary work) → Transition week → repeat, but shift the starting intensity slightly higher each rotation to achieve progressive overload across the macrocycle. Include a formal 1-week deload every 4th-5th week regardless of subjective fatigue. The goal is sustained, year-over-year progression, not a single performance peak. Without a competition date, the taper and realization phases are omitted entirely.

**Extended timeline (20+ weeks to competition):**
Do not simply extend one phase or pad the schedule with empty weeks. Use the additional time to build a superior foundation. For a 24-week macrocycle: Run two accumulation mesocycles (weeks 1-5, 7-11) separated by a transition week (week 6) before entering transmutation. The second accumulation mesocycle should increase volume further and introduce competition-specific movement patterns with higher specificity than the first. Rationale: Multiple accumulation phases create a larger strength reserve and structural resilience than a single accumulation block, allowing greater intensity expression in the transmutation and realization phases. Do not extend the peaking phase -- keep it 2-3 weeks regardless of total macrocycle length.

**Low training frequency (3 days/week):**
Block periodization is less effective at 3 days/week because each training quality receives only 1-1.5 sessions per week on average within a block, which is insufficient concentrated overload to drive the quality-specific adaptation block periodization requires. Instead, use full-body sessions with DUP rotation: Day 1 -- power/strength emphasis (3-5 reps, 82-88%), Day 2 -- strength/hypertrophy emphasis (4-6 reps, 75-82%), Day 3 -- hypertrophy emphasis (6-10 reps, 65-75%). Advance the macrocycle by shifting the average intensity of the DUP rotation progressively across months rather than switching discrete blocks. A 3-day program can still peak for a competition date -- it simply requires more lead time (add 2-4 weeks to standard mesocycle lengths) and careful attention to within-week recovery.

**Returning from layoff (4+ weeks of no training):**
Do not enter the planned periodization model immediately. Insert a mandatory 3-4 week GPP/Reintroduction phase at 50-65% of previous training maxes and approximately 60% of previous volume. This phase is not about stimulating adaptation -- it is about re-establishing connective tissue tolerance, movement pattern quality, and metabolic work capacity that deconditions faster than contractile strength. Rushing past the reintroduction phase and entering full accumulation loading within 1-2 weeks of a layoff is a primary mechanism for overuse injury in returning athletes. Only after the reintroduction phase (confirmed by subjective wellness scores stabilizing at 80%+ of maximum and session RPE normalizing below 7 for previously easy sessions) should the planned mesocycle sequence begin.

**Two competing peaks in the same macrocycle (e.g., two powerlifting meets 8 weeks apart):**
This is common in competitive powerlifting and requires an explicit dual-peak architecture. Option A (8-week separation): Treat the first meet as a "training meet" -- peak minimally (2-week realization, enter conservative openers, no third-attempt maxes), use the post-meet week as a forced deload, then run a compressed 4-week transmutation + 2-week realization block into the second, priority meet. Option B: If both meets are equally important, treat the 8-week window as a single extended peaking block with a 4-week maintenance-intensity phase between them, holding intensity at 82-87% throughout, never fully deloading below 70% or peaking above 95% until the final meet. Option B requires a very high training age (5+ years) and robust recovery capacity. For most athletes, Option A is preferred.

**User has an injury history affecting primary competition lifts:**
Do not redesign the entire periodization philosophy, but modify exercise selection and volume distribution. A history of patellar tendinopathy in powerlifters requires: (a) reducing squat volume in accumulation by 20-30% and substituting with leg press and hack squat to distribute load away from the patellar tendon, (b) avoiding deep pause squats (maximal tendon loading position) until pain-free, (c) incorporating eccentric loading protocols (slow eccentrics, 3-5 second descent) which are validated for tendinopathy rehabilitation in the accumulation phase. The periodization model itself (linear, block, DUP) does not need to change -- the exercise selection and volume distribution within it does. Always advise the user that specific injury management requires physiotherapy input.

**High-stress life periods (career transition, major life events):**
External life stress competes with training recovery resources. The HPA axis does not distinguish between work stress and training stress -- both consume cortisol buffering capacity. During known high-stress periods (identified by consistent wellness scores below 60%), reduce training volume by 20-30% for the duration. Do not increase intensity to compensate for reduced volume -- this is a common mistake that compresses the stress even further. Maintain training frequency (session count) but reduce per-session volume. Frequency maintenance preserves neural efficiency and movement patterns even when volume must be reduced. A 3-week high-stress period managed this way maintains most of the fitness already built, whereas pushing through at full volume risks a forced full rest period from overtraining or illness.

**User training for a weight-class-restricted sport (powerlifting, weightlifting, combat sports) with a significant cut needed:**
A body weight cut of more than 5% of total body weight within 4 weeks of competition significantly impairs strength expression and recovery capacity. If the user faces this situation, the macrocycle must account for the weight management phase as a distinct planning variable. Accumulation and transmutation phases should be designed at a slight caloric surplus or maintenance to maximize adaptation. Begin transitioning to a caloric deficit no sooner than 8 weeks out, and plan the deficit magnitude to achieve target weight by 2 weeks pre-competition -- leaving 2 weeks for water weight management and metabolic normalization. Strength performance during a significant caloric deficit (>500 calories/day below maintenance) will decline; adjust intensity targets downward by 3-5% and RPE targets downward by 0.5 during active cutting phases.

## Example

**Input:** "I have been training consistently for 4 years and compete in powerlifting. My current best lifts are: squat 180 kg, bench 120 kg, deadlift 210 kg (all tested in competition 8 weeks ago). I have a meet in 14 weeks. I am currently running 4 training days per week. My biggest weakness is bench lockout and my squat tends to fail in the hole. I want to time my peak for the meet."

---

## Periodized Training Plan: Powerlifting Competition Preparation

> **Disclaimer:** This plan provides general fitness and training information for educational purposes only. It is not a substitute for professional medical advice. Consult a qualified healthcare professional before beginning any new training program, especially if you have a history of injury or medical conditions.

**Model:** Block Periodization (Accumulation → Transmutation → Realization → Taper)
**Macrocycle length:** 14 weeks
**Peak/Event date:** Week 14 (Meet Day)
**Training frequency:** 4 days/week (Upper/Lower split with intensity rotation)
**Primary lifts tracked:** Back Squat, Competition Bench Press, Conventional Deadlift
**Estimated 1RM baseline (tested 8 weeks ago):** Squat 180 kg / Bench 120 kg / Deadlift 210 kg

---

### Macrocycle Architecture

| Mesocycle | Weeks | Phase         | Primary Quality         | Weekly Sets (primary lifts) | Intensity Range  | RPE Target |
|-----------|-------|---------------|-------------------------|-----------------------------|------------------|------------|
| 1         | 1-4   | Accumulation  | Hypertrophy / Work Cap  | 16-20                       | 65-77% 1RM       | 7-8        |
| T1        | 5     | Transition    | Recovery                | 6-8                         | 55-65%           | 5-6        |
| 2         | 6-9   | Transmutation | Maximal Strength        | 12-14                       | 78-88% 1RM       | 8-9        |
| T2        | 10    | Transition    | Recovery / Peak Prep    | 6-8                         | 65-72%           | 6-7        |
| 3         | 11-13 | Realization   | Peaking / Neural Eff.   | 6-9                         | 87-97%+ 1RM      | 9-9.5      |
| 4         | 14    | Taper / Meet  | Competition             | 3-4 (competition only)      | 90% (opener)     | 7-8 opener |

---

### Phase Transition Criteria

- **Accumulation → Transmutation:** 4 sets of 6 at 77% squat/bench/deadlift should feel RPE ≤ 8. If any primary lift exceeds RPE 8.5 consistently in Week 4, extend accumulation by 1 week and delay subsequent phases by 1 week.
- **Transmutation → Realization:** 4 sets of 3 at 85% should feel RPE ≤ 8.5. Bar speed should remain strong through rep 3 of each working set. If deadlift or squat RPE is consistently at 9+, recalibrate 1RM estimates before entering realization.
- **Realization → Taper:** Opener attempts (90-92%) executed at RPE ≤ 8, feeling controlled and technically sound.

---

### 1RM Update Schedule

| Review Point       | Action                                                                     |
|--------------------|----------------------------------------------------------------------------|
| End of Week 4      | Re-estimate 1RM based on last working set RPE; adjust transmutation %s    |
| End of Week 9      | Re-estimate 1RM; finalize realization loading and opener weight targets    |
| End of Week 13     | Confirm meet openers (90-92% of revised 1RM estimate)                     |

---

### Mesocycle 1: Accumulation (Weeks 1-4)

**Duration:** 4 weeks + 1 transition (Week 5)
**Primary quality:** Hypertrophy and work capacity; structural weakness targeting
**Weakness focus:** Paused squats (hip/quad strength in the hole), close-grip bench and tricep work (lockout development)
**Rep ranges -- primary:** 6-8 reps
**Rep ranges -- accessory:** 8-15 reps
**Intensity range:** 65-77% 1RM
**Target RPE:** 7-8 on working sets
**Volume target:** 16-20 weekly sets per primary pattern

**Baseline loading reference:**
- Squat 180 kg: 65% = 117 kg, 72% = 130 kg, 77% = 139 kg
- Bench 120 kg: 65% = 78 kg, 72% = 86 kg, 77% = 92 kg
- Deadlift 210 kg: 65% = 137 kg, 72% = 151 kg, 77% = 162 kg

| Week | Primary Scheme | Squat Intensity | Bench Intensity | DL Intensity | Accessory Volume | Notes                                          |
|------|---------------|-----------------|-----------------|--------------|------------------|------------------------------------------------|
| 1    | 4 x 8         | 65%             | 65%             | 65%          | High (4 x 10-12) | Intro week -- groove technical patterns         |
| 2    | 4 x 8         | 70%             | 70%             | 70%          | High (4 x 10-12) | Volume build, confirm bar path consistency     |
| 3    | 5 x 6         | 75%             | 75%             | 72%*         | High (3 x 10-12) | Peak accumulation volume week                  |
| 4    | 4 x 6         | 77%             | 77%             | 75%          | Moderate (3 x 10)| Intensity step up, volume slightly down        |
| 5    | 2 x 5 (deload)| 55-60%          | 55-60%          | 55-60%       | Low (1-2 x 10)   | Transition week -- restoration focus           |

*Deadlift volume is intentionally 1 week behind squat/bench intensity progression due to higher CNS and spinal recovery demand.

**Primary exercise selection:**
- **Squat:** Paused Back Squat (2-second pause at parallel) -- develops strength in the bottom position, directly addresses the "fails in the hole" weakness without competition-specific practice fatigue
- **Bench:** Close-Grip Bench Press (grip approximately 1.5-2 inches inside competition grip) -- overloads the triceps for lockout development; switches to competition grip in transmutation
- **Deadlift:** Conventional Deadlift (competition stance) with controlled 3-second eccentric -- reinforces proprioceptive awareness and hamstring loading

**Key accessory exercises:**
- Romanian Deadlift: 3 x 10-12 -- posterior chain development, squat and deadlift support
- DB Incline Press: 3 x 10-12 -- upper pec and shoulder stability for bench
- Lat Pulldown (overhand, full range): 4 x 10-12 -- upper back for squat bar position stability and deadlift
- Leg Press: 3 x 12-15 -- quad volume accumulation without
